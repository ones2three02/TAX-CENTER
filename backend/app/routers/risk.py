from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import crud, schemas

router = APIRouter(prefix="/risk", tags=["Risk Inspection"])

@router.get("/alerts", response_model=List[schemas.RiskAlertResponse])
def read_risk_alerts(month: Optional[str] = None, db: Session = Depends(get_db)):
    return crud.get_risk_alerts(db, month=month)

@router.post("/check")
def trigger_risk_check(month: str, db: Session = Depends(get_db)):
    alerts = crud.calculate_risk_alerts(db, month=month)
    return {"message": f"成功针对月份 {month} 重新跑了风险检测", "alerts_created": len(alerts)}

@router.put("/alerts/{alert_id}/resolve", response_model=schemas.RiskAlertResponse)
def resolve_alert(alert_id: int, resolve: schemas.RiskAlertResolve, db: Session = Depends(get_db)):
    alert = crud.resolve_risk_alert(db, alert_id=alert_id, resolve=resolve)
    if not alert:
        raise HTTPException(status_code=404, detail="Risk alert not found")
    return alert
