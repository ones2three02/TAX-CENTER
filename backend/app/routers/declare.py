from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from app.database import get_db
from app import crud, schemas, excel_parser, models

router = APIRouter(prefix="/declare", tags=["Tax Declaration"])

@router.get("/tasks", response_model=List[schemas.DeclareTaskResponse])
def read_declare_tasks(month: Optional[str] = None, db: Session = Depends(get_db)):
    return crud.get_declare_tasks(db, month=month)

@router.put("/tasks/{task_id}/status", response_model=schemas.DeclareTaskResponse)
def update_task_status(
    task_id: int, 
    status_update: schemas.DeclareTaskStatusUpdate, 
    db: Session = Depends(get_db)
):
    task = crud.update_declare_task_status(db, task_id=task_id, status_update=status_update)
    if not task:
        raise HTTPException(status_code=404, detail="Declaration task not found")
    return task

@router.get("/tasks/{task_id}/export")
def export_tax_template(task_id: int, db: Session = Depends(get_db)):
    # 1. Fetch task
    task = db.query(models.DeclareTask).filter(models.DeclareTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Declaration task not found")
    
    # 2. Export excel
    try:
        file_path = excel_parser.export_tax_client_excel(
            company_id=task.company_id,
            month=task.month,
            db=db
        )
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=500, detail="生成申报模版失败：文件未正确创建")
            
        filename = os.path.basename(file_path)
        
        # 3. Save as auto-archived template file (optional, but convenient)
        # Check if already exists in archive
        existing_archive = db.query(models.Archive).filter(
            models.Archive.company_id == task.company_id,
            models.Archive.month == task.month,
            models.Archive.archive_type == "EXCEL_TEMPLATE"
        ).first()
        
        if not existing_archive:
            archive = models.Archive(
                company_id=task.company_id,
                month=task.month,
                archive_type="EXCEL_TEMPLATE",
                file_name=filename,
                file_path=file_path
            )
            db.add(archive)
            db.commit()

        return FileResponse(
            path=file_path,
            filename=filename,
            media_type="application/vnd.ms-excel"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"导出税局模版出错: {str(e)}")
