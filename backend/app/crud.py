from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal
from datetime import datetime, date
from typing import List, Optional
from app import models, schemas

# --- Company CRUD ---
def get_companies(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Company).offset(skip).limit(limit).all()

def get_company(db: Session, company_id: int):
    return db.query(models.Company).filter(models.Company.id == company_id).first()

def get_company_by_name(db: Session, name: str):
    return db.query(models.Company).filter(models.Company.company_name == name).first()

def create_company(db: Session, company: schemas.CompanyCreate):
    db_company = models.Company(**company.model_dump())
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    return db_company

def update_company(db: Session, company_id: int, company_update: schemas.CompanyUpdate):
    db_company = get_company(db, company_id)
    if not db_company:
        return None
    for key, value in company_update.model_dump(exclude_unset=True).items():
        setattr(db_company, key, value)
    db.commit()
    db.refresh(db_company)
    return db_company

# --- Tax Entity CRUD ---
def get_tax_entities(db: Session, company_id: Optional[int] = None):
    query = db.query(models.TaxEntity)
    if company_id:
        query = query.filter(models.TaxEntity.company_id == company_id)
    return query.all()

def create_tax_entity(db: Session, entity: schemas.TaxEntityCreate):
    db_entity = models.TaxEntity(**entity.model_dump())
    db.add(db_entity)
    db.commit()
    db.refresh(db_entity)
    return db_entity

# --- Employee CRUD ---
def get_employees(db: Session, company_id: Optional[int] = None, skip: int = 0, limit: int = 100):
    query = db.query(models.Employee)
    if company_id:
        query = query.filter(models.Employee.company_id == company_id)
    # We join with company to load company_name
    return query.offset(skip).limit(limit).all()

def get_employee_changes(db: Session, month: str):
    # Calculate prev month
    try:
        y, m = map(int, month.split("-"))
        if m == 1:
            prev_month = f"{y-1}-12"
        else:
            prev_month = f"{y}-{m-1:02d}"
    except Exception:
        return schemas.EmployeeChangesResponse(
            month=month, compare_month="",
            new_hires=[], resigned=[], transferred=[],
            total_new_hires=0, total_resigned=0, total_transferred=0
        )

    # Fetch current month and prev month records
    curr_records = db.query(models.SalaryRecord).filter(models.SalaryRecord.month == month).all()
    prev_records = db.query(models.SalaryRecord).filter(models.SalaryRecord.month == prev_month).all()

    # Create mapping id_card -> record
    curr_map = {r.id_card: r for r in curr_records}
    prev_map = {r.id_card: r for r in prev_records}

    new_hires = []
    resigned = []
    transferred = []

    # New hires: in current, not in prev
    for card, rec in curr_map.items():
        if card not in prev_map:
            # Join with company name
            comp = db.query(models.Company).filter(models.Company.id == rec.company_id).first()
            c_name = comp.company_name if comp else "未知公司"
            new_hires.append(schemas.EmployeeChangeDetail(
                name=rec.name,
                id_card=card,
                phone=rec.phone,
                company_name=c_name,
                change_type="NEW",
                details=f"新入职 {rec.store_name or ''} / {rec.post_name or ''}"
            ))

    # Resigned: in prev, not in current
    for card, rec in prev_map.items():
        if card not in curr_map:
            comp = db.query(models.Company).filter(models.Company.id == rec.company_id).first()
            c_name = comp.company_name if comp else "未知公司"
            resigned.append(schemas.EmployeeChangeDetail(
                name=rec.name,
                id_card=card,
                phone=rec.phone,
                company_name=c_name,
                change_type="LEFT",
                details=f"离开原岗位 {rec.store_name or ''} / {rec.post_name or ''}"
            ))

    # Transferred: in both, but company_id changed
    for card, rec in curr_map.items():
        if card in prev_map:
            prev_rec = prev_map[card]
            if rec.company_id != prev_rec.company_id:
                prev_comp = db.query(models.Company).filter(models.Company.id == prev_rec.company_id).first()
                curr_comp = db.query(models.Company).filter(models.Company.id == rec.company_id).first()
                prev_cname = prev_comp.company_name if prev_comp else "旧公司"
                curr_cname = curr_comp.company_name if curr_comp else "新公司"
                transferred.append(schemas.EmployeeChangeDetail(
                    name=rec.name,
                    id_card=card,
                    phone=rec.phone,
                    company_name=curr_cname,
                    change_type="TRANSFERRED",
                    details=f"从 [{prev_cname}] 调动至 [{curr_cname}]"
                ))

    return schemas.EmployeeChangesResponse(
        month=month,
        compare_month=prev_month,
        new_hires=new_hires,
        resigned=resigned,
        transferred=transferred,
        total_new_hires=len(new_hires),
        total_resigned=len(resigned),
        total_transferred=len(transferred)
    )

# --- Declare Task CRUD ---
def get_declare_tasks(db: Session, month: Optional[str] = None):
    query = db.query(models.DeclareTask)
    if month:
        query = query.filter(models.DeclareTask.month == month)
    tasks = query.all()
    # Fill company names
    for t in tasks:
        comp = db.query(models.Company).filter(models.Company.id == t.company_id).first()
        t.company_name = comp.company_name if comp else "未知公司"
    return tasks

def update_declare_task_status(db: Session, task_id: int, status_update: schemas.DeclareTaskStatusUpdate):
    task = db.query(models.DeclareTask).filter(models.DeclareTask.id == task_id).first()
    if not task:
        return None
    
    old_status = task.status
    task.status = status_update.status
    task.operator = status_update.operator or "Admin"
    
    if status_update.status == "DECLARED":
        task.declared_at = datetime.now()
    elif status_update.status == "FINISHED":
        if not task.declared_at:
            task.declared_at = datetime.now()
        task.paid_at = datetime.now()
        
        # Automatically record a payment
        existing_payment = db.query(models.Payment).filter(models.Payment.task_id == task_id).first()
        if not existing_payment:
            payment = models.Payment(
                task_id=task_id,
                company_id=task.company_id,
                month=task.month,
                tax_amount=task.declare_tax,
                payment_method="三方协议扣款",
                paid_at=datetime.now(),
                status="PAID"
            )
            db.add(payment)
            
    db.commit()
    db.refresh(task)
    return task

# --- Payment CRUD ---
def get_payments(db: Session, month: Optional[str] = None):
    query = db.query(models.Payment)
    if month:
        query = query.filter(models.Payment.month == month)
    payments = query.all()
    for p in payments:
        comp = db.query(models.Company).filter(models.Company.id == p.company_id).first()
        p.company_name = comp.company_name if comp else "未知公司"
    return payments

# --- Archive CRUD ---
def get_archives(db: Session, company_id: Optional[int] = None, month: Optional[str] = None):
    query = db.query(models.Archive)
    if company_id:
        query = query.filter(models.Archive.company_id == company_id)
    if month:
        query = query.filter(models.Archive.month == month)
    archives = query.all()
    for a in archives:
        comp = db.query(models.Company).filter(models.Company.id == a.company_id).first()
        a.company_name = comp.company_name if comp else "未知公司"
    return archives

def create_archive(db: Session, company_id: int, month: str, archive_type: str, file_name: str, file_path: str):
    db_archive = models.Archive(
        company_id=company_id,
        month=month,
        archive_type=archive_type,
        file_name=file_name,
        file_path=file_path
    )
    db.add(db_archive)
    db.commit()
    db.refresh(db_archive)
    return db_archive

# --- Import Batch CRUD ---
def get_import_batches(db: Session):
    return db.query(models.ImportBatch).order_by(models.ImportBatch.created_at.desc()).all()

# --- Risk Alert CRUD ---
def get_risk_alerts(db: Session, month: Optional[str] = None):
    query = db.query(models.RiskAlert)
    if month:
        query = query.filter(models.RiskAlert.month == month)
    alerts = query.all()
    for a in alerts:
        comp = db.query(models.Company).filter(models.Company.id == a.company_id).first()
        a.company_name = comp.company_name if comp else "未知公司"
    return alerts

def resolve_risk_alert(db: Session, alert_id: int, resolve: schemas.RiskAlertResolve):
    alert = db.query(models.RiskAlert).filter(models.RiskAlert.id == alert_id).first()
    if not alert:
        return None
    alert.status = resolve.status
    db.commit()
    db.refresh(alert)
    return alert

# Run automatic risk calculations for a month
def calculate_risk_alerts(db: Session, month: str):
    # Calculate prev month
    try:
        y, m = map(int, month.split("-"))
        if m == 1:
            prev_month = f"{y-1}-12"
        else:
            prev_month = f"{y}-{m-1:02d}"
    except Exception:
        return []

    # Clear un-ignored/unresolved alerts for this month first
    db.query(models.RiskAlert).filter(
        models.RiskAlert.month == month,
        models.RiskAlert.status == "UNRESOLVED"
    ).delete()
    db.commit()

    # Get active companies
    companies = db.query(models.Company).filter(models.Company.status == "ACTIVE").all()
    
    alerts_created = []

    for comp in companies:
        # Check 1: Wage drop > 80% (comparing sum of wages)
        curr_wage = db.query(func.sum(models.SalaryRecord.salary)).filter(
            models.SalaryRecord.company_id == comp.id,
            models.SalaryRecord.month == month
        ).scalar() or Decimal("0.00")
        
        prev_wage = db.query(func.sum(models.SalaryRecord.salary)).filter(
            models.SalaryRecord.company_id == comp.id,
            models.SalaryRecord.month == prev_month
        ).scalar() or Decimal("0.00")

        if prev_wage > 0 and curr_wage / prev_wage < Decimal("0.2"):
            alert = models.RiskAlert(
                month=month,
                company_id=comp.id,
                alert_type="WAGE_DROP",
                alert_level="WARN",
                message=f"工资异常：本月工资总额 ¥{curr_wage:.2f} 较上月 ¥{prev_wage:.2f} 下降超过 80%！"
            )
            db.add(alert)
            alerts_created.append(alert)

        # Check 2: Tax surge > 500%
        curr_tax = db.query(func.sum(models.SalaryRecord.actual_tax)).filter(
            models.SalaryRecord.company_id == comp.id,
            models.SalaryRecord.month == month
        ).scalar() or Decimal("0.00")
        
        prev_tax = db.query(func.sum(models.SalaryRecord.actual_tax)).filter(
            models.SalaryRecord.company_id == comp.id,
            models.SalaryRecord.month == prev_month
        ).scalar() or Decimal("0.00")

        if prev_tax > 0 and curr_tax / prev_tax > Decimal("5.0"):
            alert = models.RiskAlert(
                month=month,
                company_id=comp.id,
                alert_type="TAX_SURGE",
                alert_level="ERROR",
                message=f"税额异常：本月个税总额 ¥{curr_tax:.2f} 较上月 ¥{prev_tax:.2f} 突增超过 500%！"
            )
            db.add(alert)
            alerts_created.append(alert)

        # Check 3: Departed employees getting paid
        # Check current month salary records against employees who resigned in Employee table
        resigned_paid = db.query(models.SalaryRecord).join(
            models.Employee, models.SalaryRecord.employee_id == models.Employee.id
        ).filter(
            models.SalaryRecord.company_id == comp.id,
            models.SalaryRecord.month == month,
            models.Employee.employee_status == "离职"
        ).all()

        for rec in resigned_paid:
            alert = models.RiskAlert(
                month=month,
                company_id=comp.id,
                alert_type="LEFT_EMPM_PAID",
                alert_level="ERROR",
                message=f"人员异常：已离职员工 [{rec.name}] (身份证 {rec.id_card}) 在本月依然发放了工资 ¥{rec.salary:.2f}！"
            )
            db.add(alert)
            alerts_created.append(alert)

    db.commit()
    return alerts_created
