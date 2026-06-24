import sys
import os
import json
import hashlib
import asyncio
from datetime import datetime

# Resolve sys.path so we can import MalScan modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import MalScan items
try:
    from MalScan.database import db_manager, get_collection, get_hashes_collection
    from MalScan.services.feature_extractor import extract_all
    from MalScan.services.predictor import predictor
except Exception as e:
    sys.stderr.write(f"MCP Import Warning: {e}\n")
    sys.stderr.flush()

async def scan_local_file(file_path):
    try:
        if not os.path.exists(file_path):
            return {"error": f"File does not exist: {file_path}"}
        
        with open(file_path, "rb") as f:
            file_bytes = f.read()
            
        if len(file_bytes) == 0:
            return {"error": "File is empty"}
            
        md5 = hashlib.md5(file_bytes).hexdigest()
        sha1 = hashlib.sha1(file_bytes).hexdigest()
        sha256 = hashlib.sha256(file_bytes).hexdigest()
        
        # 1. Feature extraction
        mapped_features = extract_all(file_bytes)
        
        # 2. Model inference
        prediction, confidence = predictor.predict(mapped_features)
        
        timestamp_str = datetime.utcnow().isoformat()
        
        # 3. Log to database if connected
        record = {
            "filename": os.path.basename(file_path),
            "md5": md5,
            "sha1": sha1,
            "sha256": sha256,
            "prediction": prediction,
            "confidence": confidence,
            "timestamp": timestamp_str,
            "features": mapped_features,
            "user_id": None # Run under system authority
        }
        
        db_connected = False
        try:
            await db_manager.connect()
            db_connected = True
        except Exception:
            pass
            
        if db_connected and db_manager.db is not None:
            try:
                collection = get_collection()
                await collection.insert_one(record.copy())
                
                hashes_col = get_hashes_collection()
                await hashes_col.update_one(
                    {"sha256": sha256},
                    {
                        "$inc": {"scan_count": 1},
                        "$set": {"last_seen": timestamp_str},
                        "$setOnInsert": {"first_seen": timestamp_str}
                    },
                    upsert=True
                )
            except Exception as e:
                sys.stderr.write(f"Database insertion failed: {e}\n")
                sys.stderr.flush()
            finally:
                await db_manager.close()
                
        return {
            "filename": os.path.basename(file_path),
            "md5": md5,
            "sha1": sha1,
            "sha256": sha256,
            "prediction": prediction,
            "confidence": confidence,
            "timestamp": timestamp_str,
            "features": mapped_features,
            "database_logged": db_connected
        }
    except Exception as e:
        return {"error": f"Scan failed: {str(e)}"}

async def get_scan_history(limit=10):
    db_connected = False
    try:
        await db_manager.connect()
        db_connected = True
    except Exception:
        pass
        
    if not db_connected or db_manager.db is None:
        return {"error": "MongoDB is not connected. History lookup failed."}
        
    try:
        collection = get_collection()
        cursor = collection.find({}).sort("timestamp", -1).limit(limit)
        results = []
        async for doc in cursor:
            results.append({
                "id": str(doc.get("_id")),
                "filename": doc.get("filename", "unknown"),
                "sha256": doc.get("sha256", ""),
                "prediction": doc.get("prediction", "unknown"),
                "confidence": doc.get("confidence", 0.0),
                "timestamp": doc.get("timestamp", ""),
            })
        return {"history": results}
    except Exception as e:
        return {"error": f"Failed to retrieve history logs: {str(e)}"}
    finally:
        await db_manager.close()

async def get_hash_reputation(sha256_hash):
    db_connected = False
    try:
        await db_manager.connect()
        db_connected = True
    except Exception:
        pass
        
    if not db_connected or db_manager.db is None:
        return {"error": "MongoDB is not connected. Reputation lookup failed."}
        
    try:
        hashes_col = get_hashes_collection()
        doc = await hashes_col.find_one({"sha256": sha256_hash.lower()})
        if not doc:
            return {
                "sha256": sha256_hash.lower(),
                "previously_scanned": False,
                "first_seen": None,
                "last_seen": None,
                "scan_count": 0
            }
        return {
            "sha256": sha256_hash.lower(),
            "previously_scanned": True,
            "first_seen": doc.get("first_seen"),
            "last_seen": doc.get("last_seen"),
            "scan_count": doc.get("scan_count", 0)
        }
    except Exception as e:
        return {"error": f"Failed to query reputation: {str(e)}"}
    finally:
        await db_manager.close()

# MCP stdio JSON-RPC loop
async def mcp_loop():
    loop = asyncio.get_event_loop()
    reader = asyncio.StreamReader()
    protocol = asyncio.StreamReaderProtocol(reader)
    await loop.connect_read_pipe(lambda: protocol, sys.stdin)

    while True:
        try:
            line = await reader.readline()
            if not line:
                break
            
            data = json.loads(line.decode("utf-8"))
            req_id = data.get("id")
            method = data.get("method")
            params = data.get("params", {})
            
            if method == "initialize":
                response = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "protocolVersion": "2024-11-05",
                        "capabilities": {
                            "tools": {}
                        },
                        "serverInfo": {
                            "name": "MalScanMCP",
                            "version": "1.0.0"
                        }
                    }
                }
            elif method == "tools/list":
                response = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "tools": [
                            {
                                "name": "scan_local_file",
                                "description": "Scan a local PE file structure and classify it (Malware or Benign)",
                                "inputSchema": {
                                    "type": "object",
                                    "properties": {
                                        "file_path": {
                                            "type": "string",
                                            "description": "The absolute path of the executable/PE binary to scan"
                                        }
                                    },
                                    "required": ["file_path"]
                                }
                            },
                            {
                                "name": "get_scan_history",
                                "description": "Get recent scan logs database history",
                                "inputSchema": {
                                    "type": "object",
                                    "properties": {
                                        "limit": {
                                            "type": "integer",
                                            "description": "Limit the history results"
                                        }
                                    }
                                }
                            },
                            {
                                "name": "get_hash_reputation",
                                "description": "Query the global hash reputation registry database for threat frequency",
                                "inputSchema": {
                                    "type": "object",
                                    "properties": {
                                        "sha256_hash": {
                                            "type": "string",
                                            "description": "The SHA256 of the binary"
                                        }
                                    },
                                    "required": ["sha256_hash"]
                                }
                            }
                        ]
                    }
                }
            elif method == "tools/call":
                tool_name = params.get("name")
                arguments = params.get("arguments", {})
                
                result = None
                if tool_name == "scan_local_file":
                    file_path = arguments.get("file_path")
                    result = await scan_local_file(file_path)
                elif tool_name == "get_scan_history":
                    limit = arguments.get("limit", 10)
                    result = await get_scan_history(limit)
                elif tool_name == "get_hash_reputation":
                    sha256_hash = arguments.get("sha256_hash")
                    result = await get_hash_reputation(sha256_hash)
                else:
                    result = {"error": f"Tool not found: {tool_name}"}
                
                response = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "content": [
                            {
                                "type": "text",
                                "text": json.dumps(result, indent=2)
                            }
                        ]
                    }
                }
            elif method == "notifications/initialized":
                # client notification, no response required
                continue
            else:
                response = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {
                        "code": -32601,
                        "message": f"Method not found: {method}"
                    }
                }
            
            # Send response to client
            sys.stdout.write(json.dumps(response) + "\n")
            sys.stdout.flush()
            
        except asyncio.CancelledError:
            break
        except Exception as e:
            sys.stderr.write(f"MCP Server error: {e}\n")
            sys.stderr.flush()

if __name__ == "__main__":
    try:
        asyncio.run(mcp_loop())
    except KeyboardInterrupt:
        pass
