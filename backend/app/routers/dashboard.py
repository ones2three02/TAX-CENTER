from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal
from typing import Optional
from app.database import get_db
from app import models, schemas

from app.routers.auth import get_current_user

router = APIRouter(
    prefix="/dashboard", 
    tags=["Dashboard"],
    dependencies=[Depends(get_current_user)]
)

@router.get("/overview", response_model=schemas.DashboardOverview)
def get_dashboard_overview(month: str, db: Session = Depends(get_db)):
    # 1. Total companies
    total_companies = db.query(models.Company).filter(models.Company.status == "ACTIVE").count()

    # 2. Get tasks for this month
    tasks = db.query(models.DeclareTask).filter(models.DeclareTask.month == month).all()
    
    # Filed = task in FINISHED status
    filed_companies = sum(1 for t in tasks if t.status in ["FINISHED", "DECLARED"])
    unfiled_companies = total_companies - filed_companies
    
    total_tax_amount = sum(t.declare_tax for t in tasks)
    total_headcount = sum(t.headcount for t in tasks)

    # 3. Active risk alerts
    active_risk_alerts = db.query(models.RiskAlert).filter(
        models.RiskAlert.month == month,
        models.RiskAlert.status == "UNRESOLVED"
    ).count()

    completion_rate = 0.0
    if total_companies > 0:
        completion_rate = round((filed_companies / total_companies) * 100, 2)

    return schemas.DashboardOverview(
        total_companies=total_companies,
        filed_companies=filed_companies,
        unfiled_companies=max(0, unfiled_companies),
        total_tax_amount=Decimal(str(total_tax_amount)),
        total_headcount=total_headcount,
        active_risk_alerts=active_risk_alerts,
        completion_rate=completion_rate,
        month=month
    )
