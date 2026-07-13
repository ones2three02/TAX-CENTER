from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
import os
import shutil
from datetime import datetime
from typing import List, Optional
from app.database import get_db
from app.config import settings
from app import crud, schemas

from app.routers.auth import get_current_user

router = APIRouter(
    prefix="/archive", 
    tags=["Tax Archives"],
    dependencies=[Depends(get_current_user)]
)

@router.post("/upload", response_model=schemas.ArchiveResponse)
def upload_archive_file(
    company_id: int = Form(...),
    month: str = Form(...),
    archive_type: str = Form(...), # DECLARE_SCREENSHOT, RECEIPT_FILE, PAYMENT_VOUCHER
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Validate type
    valid_types = ["DECLARE_SCREENSHOT", "RECEIPT_FILE", "PAYMENT_VOUCHER", "PAYROLL_FILE"]
    if archive_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"不支持的档案类型。支持: {valid_types}")
        
    # Save file
    archive_dir = os.path.join(settings.UPLOAD_DIR, "archives", month)
    os.makedirs(archive_dir, exist_ok=True)
    
    saved_filename = f"{archive_type}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}"
    file_path = os.path.join(archive_dir, saved_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"保存档案文件失败: {e}")
        
    # Save in DB
    archive = crud.create_archive(
        db=db,
        company_id=company_id,
        month=month,
        archive_type=archive_type,
        file_name=file.filename,
        file_path=file_path
    )
    return archive

@router.get("", response_model=List[schemas.ArchiveResponse])
def read_archives(
    company_id: Optional[int] = None, 
    month: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    return crud.get_archives(db, company_id=company_id, month=month)
