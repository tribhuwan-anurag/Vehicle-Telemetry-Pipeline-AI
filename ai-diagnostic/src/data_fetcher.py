"""
Data Fetcher — queries MongoDB and returns structured data
ready for LLM prompts.
"""

from datetime import datetime, timedelta, timezone
from database import telemetry_col, alerts_col, vehicle_latest_col


async def get_vehicle_summary_24h(vehicle_id: str) -> dict:
    """Get a 24-hour telemetry summary for one vehicle."""
    now = datetime.now(timezone.utc)
    since = now - timedelta(hours=24)

    # Get latest state
    latest = await vehicle_latest_col.find_one({"vehicleId": vehicle_id})
    if not latest:
        return None

    # Aggregate 24h telemetry stats
    pipeline = [
        {"$match": {"vehicleId": vehicle_id, "time": {"$gte": since}}},
        {"$group": {
            "_id": None,
            "avg_soc": {"$avg": "$batterySoc"},
            "min_soc": {"$min": "$batterySoc"},
            "max_soc": {"$max": "$batterySoc"},
            "start_soc": {"$first": "$batterySoc"},
            "end_soc": {"$last": "$batterySoc"},
            "min_voltage": {"$min": "$batteryVoltage"},
            "max_voltage": {"$max": "$batteryVoltage"},
            "avg_voltage": {"$avg": "$batteryVoltage"},
            "min_temp": {"$min": "$batteryTemp"},
            "max_temp": {"$max": "$batteryTemp"},
            "avg_temp": {"$avg": "$batteryTemp"},
            "max_speed": {"$max": "$speed"},
            "avg_speed": {"$avg": "$speed"},
            "avg_motor_temp": {"$avg": "$motorTemp"},
            "max_motor_temp": {"$max": "$motorTemp"},
            "sample_count": {"$sum": 1},
        }},
    ]

    stats = None
    async for doc in telemetry_col.aggregate(pipeline):
        stats = doc

    # Get active alerts
    active_alerts = []
    async for alert in alerts_col.find({"vehicleId": vehicle_id, "resolved": False}):
        active_alerts.append({
            "type": alert.get("alertType"),
            "severity": alert.get("severity"),
            "message": alert.get("message"),
        })

    # Get recent DTCs from latest telemetry
    recent_telemetry = await telemetry_col.find_one(
        {"vehicleId": vehicle_id},
        sort=[("time", -1)]
    )
    dtcs = []
    if recent_telemetry and "dtcs" in recent_telemetry:
        dtcs = [{"code": d.get("code"), "severity": d.get("severity"),
                 "description": d.get("description")} for d in recent_telemetry["dtcs"]]

    return {
        "vehicle_id": vehicle_id,
        "current_state": latest.get("state"),
        "current_soc": latest.get("batterySoc"),
        "current_voltage": latest.get("batteryVoltage"),
        "current_temp": latest.get("batteryTemp"),
        "current_health": latest.get("batteryHealth"),
        "stats_24h": stats,
        "active_alerts": active_alerts,
        "dtcs": dtcs,
        "sample_count": stats.get("sample_count", 0) if stats else 0,
    }


async def get_vehicle_trend_7d(vehicle_id: str) -> list:
    """Get daily aggregates for the past 7 days."""
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=7)

    pipeline = [
        {"$match": {"vehicleId": vehicle_id, "time": {"$gte": since}}},
        {"$group": {
            "_id": {
                "$dateToString": {"format": "%Y-%m-%d", "date": "$time"}
            },
            "avg_soc": {"$avg": "$batterySoc"},
            "min_soc": {"$min": "$batterySoc"},
            "avg_voltage": {"$avg": "$batteryVoltage"},
            "avg_temp": {"$avg": "$batteryTemp"},
            "max_temp": {"$max": "$batteryTemp"},
            "max_speed": {"$max": "$speed"},
            "samples": {"$sum": 1},
        }},
        {"$sort": {"_id": 1}},
    ]

    days = []
    async for doc in telemetry_col.aggregate(pipeline):
        days.append({
            "date": doc["_id"],
            "avg_soc": round(doc["avg_soc"], 2),
            "min_soc": round(doc["min_soc"], 2),
            "avg_voltage": round(doc["avg_voltage"], 2),
            "avg_temp": round(doc["avg_temp"], 2),
            "max_temp": round(doc["max_temp"], 2),
            "max_speed": round(doc["max_speed"], 2),
            "samples": doc["samples"],
        })

    return days


async def get_fleet_summary() -> dict:
    """Fleet-wide summary for AI analysis."""
    vehicles = []
    async for v in vehicle_latest_col.find():
        vehicles.append({
            "vehicle_id": v.get("vehicleId"),
            "state": v.get("state"),
            "soc": v.get("batterySoc"),
            "health": v.get("batteryHealth"),
            "temp": v.get("batteryTemp"),
        })

    alert_count = await alerts_col.count_documents({"resolved": False})

    return {
        "total_vehicles": len(vehicles),
        "vehicles": vehicles,
        "active_alerts": alert_count,
    }