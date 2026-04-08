"""
Async MongoDB connection using Motor.
Reads from the same 'fleet' database the Node.js backend writes to.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from config import MONGO_URI

client = AsyncIOMotorClient(MONGO_URI)
db = client.fleet

# Collections
telemetry_col = db.telemetry
alerts_col = db.alerts
vehicle_latest_col = db.vehiclelatests  # Mongoose adds 's' to collection names