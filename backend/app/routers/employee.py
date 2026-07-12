from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import crud, schemas, models

router = APIRouter(prefix="/employees", tags=["Employees"])

@router.get("", response_model=List[schemas.EmployeeResponse])
def read_employees(company_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    employees = crud.get_employees(db, company_id=company_id, skip=skip, limit=limit)
    # Map company names to the schemas
    res = []
    for emp in employees:
        comp = db.query(models.Company).filter(models.Company.id == emp.company_id).first()
        emp_res = schemas.EmployeeResponse.model_validate(emp)
        emp_res.company_name = comp.company_name if comp else "未知公司"
        res.append(emp_res)
    return res

@router.get("/changes", response_model=schemas.EmployeeChangesResponse)
def get_monthly_employee_changes(month: str, db: Session = Depends(get_db)):
    return crud.get_employee_changes(db, month=month)
