from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
import os
from dotenv import load_dotenv

def test_database_connection():
    # Load environment variables
    load_dotenv()
    
    # Get database URL from environment variable
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        print("❌ DATABASE_URL not found in environment variables")
        return False
        
    try:
        # Create test engine
        engine = create_engine(database_url)
        
        # Try to connect
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("✅ Database connection successful!")
            return True
            
    except SQLAlchemyError as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False

if __name__ == "__main__":
    test_database_connection()