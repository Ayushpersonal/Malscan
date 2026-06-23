import asyncio
from MalScan.database import db_manager, get_users_collection

async def list_users():
    await db_manager.connect()
    try:
        users_col = get_users_collection()
        cursor = users_col.find({})
        users = await cursor.to_list(length=100)
        print("=== Registered Users in Database ===")
        for u in users:
            print(f"Name: {u.get('name')}, Email: {u.get('email')}, Created At: {u.get('created_at')}")
    except Exception as e:
        print(f"Error querying users: {e}")
    finally:
        await db_manager.close()

if __name__ == "__main__":
    asyncio.run(list_users())
