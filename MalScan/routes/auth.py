import logging
from datetime import datetime
from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field

from MalScan.database import get_users_collection, get_collection
from MalScan.auth_utils import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user
)

logger = logging.getLogger("malscan.routes.auth")
router = APIRouter()

# Pydantic schemas for requests/responses
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class ProfileResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: str
    total_scans: int

@router.post("/auth/register", status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserRegister):
    """
    Registers a new user inside the system.
    Enforces email uniqueness by performing a case-insensitive check.
    """
    users_col = get_users_collection()
    
    # Case-insensitive unique check for email
    normalized_email = user_data.email.strip().lower()
    existing_user = await users_col.find_one({"email": normalized_email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )
        
    hashed_password = get_password_hash(user_data.password)
    new_user = {
        "name": user_data.name.strip(),
        "email": normalized_email,
        "password_hash": hashed_password,
        "created_at": datetime.utcnow().isoformat()
    }
    
    try:
        result = await users_col.insert_one(new_user)
        logger.info(f"Registered user: {normalized_email} with ID {result.inserted_id}")
        return {
            "status": "success",
            "message": "User registered successfully."
        }
    except Exception as e:
        logger.error(f"Error writing registered user to database: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register user due to database write failure."
        )

@router.post("/auth/login", response_model=TokenResponse)
async def login_user(credentials: UserLogin):
    """
    Performs standard login via email and password (JSON body).
    Returns JWT access bearer token and user metadata.
    """
    users_col = get_users_collection()
    
    normalized_email = credentials.email.strip().lower()
    user = await users_col.find_one({"email": normalized_email})
    
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
        
    user_id_str = str(user["_id"])
    access_token = create_access_token(data={"sub": user_id_str})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user_id_str,
            "name": user.get("name"),
            "email": user.get("email"),
            "created_at": user.get("created_at")
        }
    )

@router.get("/profile", response_model=ProfileResponse)
async def get_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Returns user profile details along with a live scan count query matching
    the specific authenticated User ID.
    """
    scans_col = get_collection()
    
    try:
        # Live count of uploads/scans matching user_id
        total_scans = await scans_col.count_documents({"user_id": current_user["id"]})
    except Exception as e:
        logger.error(f"Error querying user scans count: {e}")
        total_scans = 0
        
    return ProfileResponse(
        id=current_user["id"],
        name=current_user["name"],
        email=current_user["email"],
        created_at=current_user.get("created_at", datetime.utcnow().isoformat()),
        total_scans=total_scans
    )
