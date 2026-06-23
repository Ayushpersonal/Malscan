import logging
from motor.motor_asyncio import AsyncIOMotorClient
from MalScan.config import settings

logger = logging.getLogger("malscan.database")

class DatabaseManager:
    def __init__(self):
        self.client: AsyncIOMotorClient = None
        self.db = None

    async def connect(self):
        try:
            logger.info(f"Connecting to MongoDB at {settings.MONGODB_URL}...")
            self.client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=1500)
            # Verify connection with a ping first before assigning db
            await self.client.admin.command('ping')
            self.db = self.client[settings.DATABASE_NAME]
            logger.info("Successfully connected to MongoDB database.")
        except Exception as e:
            logger.error(f"Error connecting to MongoDB: {e}")
            self.client = None
            self.db = None
            raise e

    async def close(self):
        if self.client:
            self.client.close()
            logger.info("MongoDB connection pool closed.")

# Single instance to import across the app
db_manager = DatabaseManager()

def get_collection():
    if db_manager.db is None:
        raise RuntimeError("Database connection has not been initialized.")
    return db_manager.db[settings.COLLECTION_NAME]

def get_users_collection():
    if db_manager.db is None:
        raise RuntimeError("Database connection has not been initialized.")
    return db_manager.db["users"]

def get_hashes_collection():
    if db_manager.db is None:
        raise RuntimeError("Database connection has not been initialized.")
    return db_manager.db["hashes"]
