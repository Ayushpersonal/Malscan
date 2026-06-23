import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any

from fastapi import APIRouter, Depends, HTTPException, status

from MalScan.database import get_collection
from MalScan.auth_utils import get_current_user

logger = logging.getLogger("malscan.routes.dashboard")
router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """
    Computes global scan counts, average confidence scores, and bucketed
    threat distribution metrics matching the authenticated User ID.
    """
    user_id = current_user["id"]
    scans_col = get_collection()
    
    pipeline = [
        {"$match": {"user_id": user_id}},
        {
            "$facet": {
                "general_stats": [
                    {
                        "$group": {
                            "_id": None,
                            "total_scans": {"$sum": 1},
                            "average_confidence": {"$avg": "$confidence"},
                            "malware_count": {
                                "$sum": {
                                    "$cond": [
                                        {"$or": [
                                            {"$eq": ["$prediction", "malware"]},
                                            {"$eq": ["$prediction", "1"]}
                                        ]},
                                        1,
                                        0
                                    ]
                                }
                            },
                            "benign_count": {
                                "$sum": {
                                    "$cond": [
                                        {"$or": [
                                            {"$eq": ["$prediction", "benign"]},
                                            {"$eq": ["$prediction", "0"]}
                                        ]},
                                        1,
                                        0
                                    ]
                                }
                            }
                        }
                    }
                ],
                "risk_distribution": [
                    {
                        "$project": {
                            "risk_level": {
                                "$cond": [
                                    {"$or": [
                                        {"$eq": ["$prediction", "malware"]},
                                        {"$eq": ["$prediction", "1"]}
                                    ]},
                                    {"$cond": [{"$gte": ["$confidence", 0.85]}, "critical", "high"]},
                                    {"$cond": [{"$gte": ["$confidence", 0.85]}, "low", "medium"]}
                                ]
                            }
                        }
                    },
                    {
                        "$group": {
                            "_id": "$risk_level",
                            "count": {"$sum": 1}
                        }
                    }
                ]
            }
        }
    ]
    
    try:
        cursor = scans_col.aggregate(pipeline)
        result_list = await cursor.to_list(length=1)
        
        total_scans = 0
        malware_count = 0
        benign_count = 0
        average_confidence = 0.0
        risk_dist = {"low": 0, "medium": 0, "high": 0, "critical": 0}
        
        if result_list:
            facet_res = result_list[0]
            general = facet_res.get("general_stats", [])
            if general:
                gen = general[0]
                total_scans = gen.get("total_scans", 0)
                average_confidence = gen.get("average_confidence", 0.0) or 0.0
                malware_count = gen.get("malware_count", 0)
                benign_count = gen.get("benign_count", 0)
                
            risk_entries = facet_res.get("risk_distribution", [])
            for entry in risk_entries:
                r_level = entry.get("_id")
                if r_level in risk_dist:
                    risk_dist[r_level] = entry.get("count", 0)
                    
        return {
            "total_scans": total_scans,
            "malware_count": malware_count,
            "benign_count": benign_count,
            "average_confidence": round(average_confidence, 4),
            "risk_distribution": risk_dist
        }
    except Exception as e:
        logger.error(f"Error computing dashboard stats: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve dashboard stats telemetry."
        )

@router.get("/recent")
async def get_dashboard_recent(current_user: dict = Depends(get_current_user)):
    """
    Retrieves the last 5 scans executed by the authenticated operator.
    Maps and projects standard fields including dynamic risk level classifications.
    """
    user_id = current_user["id"]
    scans_col = get_collection()
    
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$sort": {"timestamp": -1}},
        {"$limit": 5},
        {
            "$project": {
                "_id": 0,
                "filename": "$filename",
                "prediction": "$prediction",
                "confidence": "$confidence",
                "scan_time": "$timestamp",
                "risk_level": {
                    "$cond": [
                        {"$or": [
                            {"$eq": ["$prediction", "malware"]},
                            {"$eq": ["$prediction", "1"]}
                        ]},
                        {"$cond": [{"$gte": ["$confidence", 0.85]}, "critical", "high"]},
                        {"$cond": [{"$gte": ["$confidence", 0.85]}, "low", "medium"]}
                    ]
                }
            }
        }
    ]
    
    try:
        cursor = scans_col.aggregate(pipeline)
        recent_scans = await cursor.to_list(length=5)
        return recent_scans
    except Exception as e:
        logger.error(f"Error fetching recent dashboard scans: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve recent dashboard scans."
        )

@router.get("/trends")
async def get_dashboard_trends(current_user: dict = Depends(get_current_user)):
    """
    Retrieves time-bucketed scan volumes for the authenticated operator.
    Groups counts by day (last 7 days), week (last 4 weeks), and month (last 12 months).
    """
    user_id = current_user["id"]
    scans_col = get_collection()
    now = datetime.utcnow()
    
    # 1. Daily buckets: last 7 days
    daily_start = (now - timedelta(days=7)).isoformat()
    daily_results = await scans_col.aggregate([
        {"$match": {"user_id": user_id, "timestamp": {"$gte": daily_start}}},
        {"$group": {"_id": {"$substr": ["$timestamp", 0, 10]}, "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]).to_list(length=10)
    
    daily_map = {res["_id"]: res["count"] for res in daily_results}
    daily_scans = []
    for i in range(6, -1, -1):
        day_str = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        daily_scans.append({
            "date": day_str,
            "count": daily_map.get(day_str, 0)
        })
        
    # 2. Weekly buckets: last 4 weeks (28 days)
    weekly_start = (now - timedelta(days=28)).isoformat()
    weekly_results = await scans_col.aggregate([
        {"$match": {"user_id": user_id, "timestamp": {"$gte": weekly_start}}},
        {"$group": {"_id": {"$substr": ["$timestamp", 0, 10]}, "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]).to_list(length=35)
    
    weekly_map = {res["_id"]: res["count"] for res in weekly_results}
    weekly_scans = []
    for w in range(3, -1, -1):
        # Construct relative weeks of 7 days
        week_count = 0
        start_day_offset = w * 7 + 6
        end_day_offset = w * 7
        
        # Aggregate daily counts inside this week window
        for d_off in range(start_day_offset, end_day_offset - 1, -1):
            day_str = (now - timedelta(days=d_off)).strftime("%Y-%m-%d")
            week_count += weekly_map.get(day_str, 0)
            
        week_start_str = (now - timedelta(days=start_day_offset)).strftime("%m/%d")
        week_end_str = (now - timedelta(days=end_day_offset)).strftime("%m/%d")
        weekly_scans.append({
            "week": f"{week_start_str}-{week_end_str}",
            "count": week_count
        })

    # 3. Monthly buckets: last 12 months
    monthly_start = (now - timedelta(days=365)).isoformat()
    monthly_results = await scans_col.aggregate([
        {"$match": {"user_id": user_id, "timestamp": {"$gte": monthly_start}}},
        {"$group": {"_id": {"$substr": ["$timestamp", 0, 7]}, "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]).to_list(length=15)
    
    monthly_map = {res["_id"]: res["count"] for res in monthly_results}
    monthly_scans = []
    for m in range(11, -1, -1):
        # Step back month by month
        # Since python timedelta doesn't support months directly, offset days roughly
        target_date = now - timedelta(days=m * 30.5)
        month_str = target_date.strftime("%Y-%m")
        month_label = target_date.strftime("%b %y")
        monthly_scans.append({
            "month": month_label,
            "count": monthly_map.get(month_str, 0)
        })
        
    return {
        "daily_scans": daily_scans,
        "weekly_scans": weekly_scans,
        "monthly_scans": monthly_scans
    }

@router.get("/threat-distribution")
async def get_dashboard_threat_distribution(current_user: dict = Depends(get_current_user)):
    """
    Computes total percentages of malware vs benign verdicts directly
    associated with the authenticated operator.
    """
    user_id = current_user["id"]
    scans_col = get_collection()
    
    pipeline = [
        {"$match": {"user_id": user_id}},
        {
            "$group": {
                "_id": None,
                "total": {"$sum": 1},
                "malware": {
                    "$sum": {
                        "$cond": [
                            {"$or": [
                                {"$eq": ["$prediction", "malware"]},
                                {"$eq": ["$prediction", "1"]}
                            ]},
                            1,
                            0
                        ]
                    }
                },
                "benign": {
                    "$sum": {
                        "$cond": [
                            {"$or": [
                                {"$eq": ["$prediction", "benign"]},
                                {"$eq": ["$prediction", "0"]}
                            ]},
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]
    
    try:
        cursor = scans_col.aggregate(pipeline)
        res = await cursor.to_list(length=1)
        
        total = 0
        malware = 0
        benign = 0
        malware_pct = 0.0
        benign_pct = 0.0
        
        if res:
            data = res[0]
            total = data.get("total", 0)
            malware = data.get("malware", 0)
            benign = data.get("benign", 0)
            if total > 0:
                malware_pct = round((malware / total) * 100, 2)
                benign_pct = round((benign / total) * 100, 2)
                
        return {
            "total_scans": total,
            "malware_count": malware,
            "benign_count": benign,
            "malware_percentage": malware_pct,
            "benign_percentage": benign_pct
        }
    except Exception as e:
        logger.error(f"Error computing threat distribution: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve threat distribution telemetry."
        )
