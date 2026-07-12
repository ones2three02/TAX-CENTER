from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import crud, schemas

router = APIRouter(prefix="/companies", tags=["Companies"])

@router.get("", response_model=List[schemas.CompanyResponse])
def read_companies(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_companies(db, skip=skip, limit=limit)

@router.get("/{company_id}", response_model=schemas.CompanyResponse)
def read_company(company_id: int, db: Session = Depends(get_db)):
    db_company = crud.get_company(db, company_id=company_id)
    if db_company is None:
        raise HTTPException(status_code=404, detail="Company not found")
    return db_company

@router.post("", response_model=schemas.CompanyResponse)
def create_company(company: schemas.CompanyCreate, db: Session = Depends(get_db)):
    db_comp = crud.get_company_by_name(db, name=company.company_name)
    if db_comp:
        raise HTTPException(status_code=400, detail="Company with this name already exists")
    return crud.create_company(db=db, company=company)

@router.put("/{company_id}", response_model=schemas.CompanyResponse)
def update_company(company_id: int, company_update: schemas.CompanyUpdate, db: Session = Depends(get_db)):
    db_company = crud.update_company(db, company_id=company_id, company_update=company_update)
    if db_company is None:
        raise HTTPException(status_code=404, detail="Company not found")
    return db_company
