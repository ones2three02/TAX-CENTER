from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from app.database import Base

class Company(Base):
    __tablename__ = "tax_company"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    company_code = Column(String(50), unique=True, index=True, nullable=True)
    company_name = Column(String(255), unique=True, index=True, nullable=False)
    tax_number = Column(String(50), nullable=True)
    credit_code = Column(String(50), nullable=True)
    bank_name = Column(String(100), nullable=True)
    bank_account = Column(String(100), nullable=True)
    status = Column(String(20), default="ACTIVE") # ACTIVE, INACTIVE
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    entities = relationship("TaxEntity", back_populates="company", cascade="all, delete-orphan")
    employees = relationship("Employee", back_populates="company")
    salary_records = relationship("SalaryRecord", back_populates="company")
    declare_tasks = relationship("DeclareTask", back_populates="company")
    payments = relationship("Payment", back_populates="company")
    archives = relationship("Archive", back_populates="company", cascade="all, delete-orphan")
    risk_alerts = relationship("RiskAlert", back_populates="company", cascade="all, delete-orphan")

class TaxEntity(Base):
    __tablename__ = "tax_entity"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey("tax_company.id", ondelete="CASCADE"), nullable=False)
    tax_no = Column(String(50), nullable=False)
    tax_type = Column(String(50), default="个人所得税")
    tax_region = Column(String(100), nullable=True)
    status = Column(String(20), default="ACTIVE")
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    company = relationship("Company", back_populates="entities")

class Employee(Base):
    __tablename__ = "tax_employee"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey("tax_company.id"), nullable=False)
    name = Column(String(100), nullable=False)
    id_card = Column(String(50), nullable=False)
    id_card_type = Column(String(50), default="居民身份证")
    employee_status = Column(String(20), default="在职") # 在职, 离职
    entry_date = Column(Date, nullable=True)
    leave_date = Column(Date, nullable=True)
    phone = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    company = relationship("Company", back_populates="employees")
    salary_records = relationship("SalaryRecord", back_populates="employee")

class ImportBatch(Base):
    __tablename__ = "tax_import_batch"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    filename = Column(String(255), nullable=False)
    month = Column(String(20), nullable=False, index=True) # e.g. "2026-07"
    total_rows = Column(Integer, default=0)
    valid_rows = Column(Integer, default=0)
    status = Column(String(20), default="SUCCESS") # PROCESSING, SUCCESS, FAILED
    operator = Column(String(50), default="System")
    ignored_records = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    salary_records = relationship("SalaryRecord", back_populates="batch", cascade="all, delete-orphan")

class SalaryRecord(Base):
    __tablename__ = "tax_salary_record"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    batch_id = Column(Integer, ForeignKey("tax_import_batch.id", ondelete="CASCADE"), nullable=False)
    company_id = Column(Integer, ForeignKey("tax_company.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("tax_employee.id"), nullable=True)
    name = Column(String(100), nullable=False)
    id_card = Column(String(50), nullable=False)
    store_name = Column(String(100), nullable=True)
    post_name = Column(String(100), nullable=True)
    employee_status = Column(String(50), default="在职")
    salary = Column(Numeric(12, 2), default=0.00) # 报税工资
    tax_amount = Column(Numeric(12, 2), default=0.00) # 个税
    pension = Column(Numeric(12, 2), default=0.00) # 养老险
    medical = Column(Numeric(12, 2), default=0.00) # 医疗险
    unemployment = Column(Numeric(12, 2), default=0.00) # 失业险
    actual_tax = Column(Numeric(12, 2), default=0.00) # 实际个税
    phone = Column(String(50), nullable=True)
    remark = Column(String(255), nullable=True)
    month = Column(String(20), nullable=False, index=True)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    batch = relationship("ImportBatch", back_populates="salary_records")
    company = relationship("Company", back_populates="salary_records")
    employee = relationship("Employee", back_populates="salary_records")

class DeclareTask(Base):
    __tablename__ = "tax_declare_task"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    month = Column(String(20), nullable=False, index=True) # e.g. "2026-07"
    company_id = Column(Integer, ForeignKey("tax_company.id"), nullable=False)
    status = Column(String(30), default="INIT") # INIT, DATA_READY, WAIT_DECLARE, DECLARED, PAYMENT_PENDING, FINISHED, FAILED
    declare_tax = Column(Numeric(12, 2), default=0.00)
    headcount = Column(Integer, default=0)
    operator = Column(String(50), default="System")
    declared_at = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    company = relationship("Company", back_populates="declare_tasks")
    payments = relationship("Payment", back_populates="task", cascade="all, delete-orphan")

class Payment(Base):
    __tablename__ = "tax_payment"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("tax_declare_task.id", ondelete="CASCADE"), nullable=False)
    company_id = Column(Integer, ForeignKey("tax_company.id"), nullable=False)
    month = Column(String(20), nullable=False, index=True)
    tax_amount = Column(Numeric(12, 2), default=0.00)
    payment_method = Column(String(50), default="三方协议扣款")
    paid_at = Column(DateTime, nullable=True)
    status = Column(String(20), default="PAID") # PAID, UNPAID
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    task = relationship("DeclareTask", back_populates="payments")
    company = relationship("Company", back_populates="payments")

class Archive(Base):
    __tablename__ = "tax_archive"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey("tax_company.id", ondelete="CASCADE"), nullable=False)
    month = Column(String(20), nullable=False, index=True)
    archive_type = Column(String(50), nullable=False) # PAYROLL_FILE, EXCEL_TEMPLATE, DECLARE_SCREENSHOT, RECEIPT_FILE, PAYMENT_VOUCHER
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    uploaded_at = Column(DateTime, default=func.now())
    
    # Relationships
    company = relationship("Company", back_populates="archives")

class RiskAlert(Base):
    __tablename__ = "tax_risk_alert"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    month = Column(String(20), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("tax_company.id", ondelete="CASCADE"), nullable=False)
    alert_type = Column(String(50), nullable=False) # WAGE_DROP, LEFT_EMPM_PAID, TAX_SURGE
    alert_level = Column(String(20), default="WARN") # INFO, WARN, ERROR
    message = Column(String(500), nullable=False)
    status = Column(String(20), default="UNRESOLVED") # UNRESOLVED, IGNORED, RESOLVED
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    company = relationship("Company", back_populates="risk_alerts")
