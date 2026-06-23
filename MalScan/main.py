import time
import hashlib
import logging
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from MalScan.config import settings
from MalScan.database import db_manager, get_collection, get_hashes_collection
from MalScan.services.feature_extractor import extract_all
from MalScan.services.predictor import predictor
from MalScan.routes.auth import router as auth_router
from MalScan.routes.dashboard import router as dashboard_router
from MalScan.routes.analysis import router as analysis_router
from MalScan.auth_utils import get_optional_current_user, get_current_user

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("malscan.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB client pool
    try:
        await db_manager.connect()
    except Exception as e:
        logger.error(f"Could not connect to MongoDB at startup: {e}. Running without database logging.")
    
    yield
    
    # Shutdown: Close connection pool
    await db_manager.close()

app = FastAPI(
    title="MalScan PE Security Analysis Backend",
    description="Production-ready FastAPI backend connecting Windows PE static heuristics to an XGBoost runtime process classifier",
    version="1.0.0",
    lifespan=lifespan
)

# Standard Production CORS Rules
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth_router)
app.include_router(dashboard_router, prefix="/dashboard")
app.include_router(analysis_router)

# Pydantic schemas for request/response serialization
class HealthResponse(BaseModel):
    status: str
    timestamp: str
    database_connected: bool
    model_loaded: bool

class ScanResponse(BaseModel):
    filename: str
    sha256: str
    sha1: str
    md5: str
    prediction: str
    confidence: float
    timestamp: str
    features: Dict[str, Any]

class HistoryItem(BaseModel):
    id: str
    filename: str
    sha256: str
    prediction: str
    confidence: float
    timestamp: str
    features: Dict[str, Any]

@app.get("/health", response_model=HealthResponse)
async def health():
    """Returns application status and checking database/model states."""
    db_ok = False
    if db_manager.client:
        try:
            await db_manager.client.admin.command('ping')
            db_ok = True
        except Exception:
            pass
            
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        database_connected=db_ok,
        model_loaded=(predictor.model is not None)
    )

@app.post("/scan", response_model=ScanResponse)
async def scan_file(
    file: UploadFile = File(...),
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """
    Accepts Windows executable (PE binary), extracts and translates 
    heuristics into the 33 process runtime features, runs model prediction, 
    saves result to MongoDB, and returns JSON payload.
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded.")
        
    try:
        file_bytes = await file.read()
        if len(file_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
            
        # File Cryptographic Hash Computation
        md5 = hashlib.md5(file_bytes).hexdigest()
        sha1 = hashlib.sha1(file_bytes).hexdigest()
        sha256 = hashlib.sha256(file_bytes).hexdigest()
        
        logger.info(f"Scanning file: '{file.filename}' (Size: {len(file_bytes)} bytes, SHA256: {sha256})")
        
        # 1. Feature Extraction and Mapping
        try:
            mapped_features = extract_all(file_bytes)
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=str(ve))
        except Exception as e:
            logger.error(f"Error during feature extraction: {e}")
            raise HTTPException(status_code=500, detail=f"Feature extraction failed: {str(e)}")
            
        # 2. Machine Learning Classifier Inference
        try:
            prediction, confidence = predictor.predict(mapped_features)
        except Exception as e:
            logger.error(f"Error during prediction scoring: {e}")
            raise HTTPException(status_code=500, detail=f"Classifier prediction failed: {str(e)}")
            
        timestamp_str = datetime.utcnow().isoformat()
        
        # Determine User ID from current session context
        user_id = current_user["id"] if current_user else None
        
        # 3. Log records to MongoDB database
        record = {
            "filename": file.filename,
            "md5": md5,
            "sha1": sha1,
            "sha256": sha256,
            "prediction": prediction,
            "confidence": confidence,
            "timestamp": timestamp_str,
            "features": mapped_features,
            "user_id": user_id
        }
        
        if db_manager.db is not None:
            try:
                collection = get_collection()
                # Create a copy so pymongo doesn't mutate it by inserting '_id'
                await collection.insert_one(record.copy())
                logger.info(f"Successfully logged scan history record for {sha256}")
            except Exception as e:
                logger.error(f"Failed to save record to MongoDB: {e}")

            # Upsert global hash reputation tracker (atomically)
            try:
                hashes_col = get_hashes_collection()
                now_str = datetime.utcnow().isoformat()
                await hashes_col.update_one(
                    {"sha256": sha256},
                    {
                        "$inc": {"scan_count": 1},
                        "$set": {"last_seen": now_str},
                        "$setOnInsert": {"first_seen": now_str}
                    },
                    upsert=True
                )
                logger.info(f"Updated global hash reputation entry for {sha256}")
            except Exception as e:
                logger.error(f"Failed to upsert hash reputation entry: {e}")
        else:
            logger.warning("Database unavailable. Scan record logged in memory only.")
            
        return ScanResponse(
            filename=file.filename,
            sha256=sha256,
            sha1=sha1,
            md5=md5,
            prediction=prediction,
            confidence=confidence,
            timestamp=timestamp_str,
            features=mapped_features
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error occurred while scanning")
        raise HTTPException(status_code=500, detail=f"Internal scanning error: {str(e)}")

@app.get("/user/history", response_model=List[HistoryItem])
async def get_user_history(
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
    prediction: str = Query(None, description="Filter logs by classification label"),
    current_user: dict = Depends(get_current_user)
):
    """Retrieves list of scanned binaries associated with the logged-in user."""
    if db_manager.db is None:
        raise HTTPException(
            status_code=503, 
            detail="History lookup unavailable. MongoDB is not connected."
        )
        
    try:
        collection = get_collection()
        query_filter = {"user_id": current_user["id"]}
        if prediction:
            query_filter["prediction"] = prediction.lower()
            
        cursor = collection.find(query_filter).sort("timestamp", -1).skip(skip).limit(limit)
        results = []
        async for doc in cursor:
            results.append(
                HistoryItem(
                    id=str(doc.get("_id")),
                    filename=doc.get("filename", "unknown"),
                    sha256=doc.get("sha256", ""),
                    prediction=doc.get("prediction", "unknown"),
                    confidence=doc.get("confidence", 0.0),
                    timestamp=doc.get("timestamp", ""),
                    features=doc.get("features", {})
                )
            )
        return results
    except Exception as e:
        logger.error(f"Error fetching user scan history logs: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user history logs.")

@app.get("/history", response_model=List[HistoryItem])
async def get_history(
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
    prediction: str = Query(None, description="Filter logs by classification label")
):
    """Retrieves list of recently analyzed binaries."""
    if db_manager.db is None:
        raise HTTPException(
            status_code=503, 
            detail="History lookup unavailable. MongoDB is not connected."
        )
        
    try:
        collection = get_collection()
        query_filter = {}
        if prediction:
            query_filter["prediction"] = prediction.lower()
            
        cursor = collection.find(query_filter).sort("timestamp", -1).skip(skip).limit(limit)
        results = []
        async for doc in cursor:
            results.append(
                HistoryItem(
                    id=str(doc.get("_id")),
                    filename=doc.get("filename", "unknown"),
                    sha256=doc.get("sha256", ""),
                    prediction=doc.get("prediction", "unknown"),
                    confidence=doc.get("confidence", 0.0),
                    timestamp=doc.get("timestamp", ""),
                    features=doc.get("features", {})
                )
            )
        return results
    except Exception as e:
        logger.error(f"Error fetching scan history logs: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve history logs.")

@app.get("/feature-importance")
async def get_feature_importance():
    """Retrieves the feature importance visualization plot."""
    import os
    img_path = settings.BASE_DIR / "feature_importance.png"
    if os.path.exists(img_path):
        return FileResponse(img_path, media_type="image/png")
    raise HTTPException(status_code=404, detail="Feature importance plot not found.")
