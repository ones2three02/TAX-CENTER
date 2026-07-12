from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import crud, schemas

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.get("", response_model=List[schemas.PaymentResponse])
def read_payments(month: Optional[str] = None, db: Session = Depends(get_db)):
    return crud.get_payments(db, month=month)
