from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.database import engine, Base
from app.config import settings
from app.routers import (
    dashboard,
    company,
    employee,
    import_data,
    declare,
    payment,
    risk,
    archive,
    auth
)

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Enterprise Tax Management Center API",
    description="TAX-CENTER 后端 API 系统",
    version="1.0.0"
)

# CORS middleware config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev simplicity. Can restrict to React client domain in prod.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount files folder to serve archived pictures/vouchers directly
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(company.router, prefix="/api")
app.include_router(employee.router, prefix="/api")
app.include_router(import_data.router, prefix="/api")
app.include_router(declare.router, prefix="/api")
app.include_router(payment.router, prefix="/api")
app.include_router(risk.router, prefix="/api")
app.include_router(archive.router, prefix="/api")

from app.database import SessionLocal
from app.models import User

@app.on_event("startup")
def initialize_admin_user():
    db = SessionLocal()
    try:
        admin_count = db.query(User).filter(User.username == "admin").count()
        if admin_count == 0:
            print("No admin user found. Initializing default admin user...")
            hashed = auth.hash_password("Admin@123456")
            default_admin = User(
                username="admin",
                hashed_password=hashed,
                role="ADMIN",
                status="ACTIVE"
            )
            db.add(default_admin)
            db.commit()
            print("Default admin user initialized: admin / Admin@123456")
    except Exception as e:
        print(f"Error initializing admin user: {e}")
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to Enterprise Tax Management Center API (TAX-CENTER)"}
