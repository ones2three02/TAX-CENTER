from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
import os
import shutil
from datetime import datetime
from typing import List
from app.database import get_db
from app.config import settings
from app.models import ImportBatch
from app import excel_parser, crud, schemas

router = APIRouter(prefix="/import", tags=["Data Import"])

@router.post("/payroll", response_model=schemas.ImportBatchResponse)
def import_payroll(
    month: str = Form(...), # format: "2026-07"
    operator: str = Form("Admin"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in [".xlsx", ".xls"]:
        raise HTTPException(status_code=400, detail="只支持导入 .xlsx 和 .xls 格式的Excel文件")

    # Create destination directory
    raw_dir = os.path.join(settings.UPLOAD_DIR, "raw_payroll", month)
    os.makedirs(raw_dir, exist_ok=True)
    
    # Save file locally
    saved_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}"
    file_path = os.path.join(raw_dir, saved_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"保存上传的文件失败: {e}")

    # Create import batch record in database
    batch = ImportBatch(
        filename=file.filename,
        month=month,
        total_rows=0,
        valid_rows=0,
        status="PROCESSING",
        operator=operator
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    
    # Store ID in a local variable to prevent DetachedInstanceError after db.close()
    saved_batch_id = batch.id

    # Parse and split the Excel sheet
    try:
        total_rows, valid_rows = excel_parser.parse_group_excel(
            file_path=file_path,
            month=month,
            db=db,
            batch_id=saved_batch_id
        )
        
        # Trigger risk alert recalculations immediately
        crud.calculate_risk_alerts(db, month)
        
        # Re-fetch batch to avoid DetachedInstanceError after db.close() inside parser
        updated_batch = db.query(ImportBatch).filter(ImportBatch.id == saved_batch_id).first()
        return updated_batch
    except Exception as e:
        import traceback
        traceback.print_exc()
        # Mark batch as failed
        try:
            merged_batch = db.query(ImportBatch).filter(ImportBatch.id == saved_batch_id).first()
            if merged_batch:
                merged_batch.status = "FAILED"
                db.commit()
        except Exception:
            pass
        # Clean up file in case of error (optional)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
        raise HTTPException(status_code=400, detail=f"解析Excel出错: {str(e)}")

@router.get("/batches", response_model=List[schemas.ImportBatchResponse])
def get_import_history(db: Session = Depends(get_db)):
    return crud.get_import_batches(db)
