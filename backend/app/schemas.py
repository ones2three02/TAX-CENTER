from pydantic import BaseModel, Field
from typing import List, Optional
from decimal import Decimal
from datetime import date, datetime

# --- Company Schemas ---
class CompanyBase(BaseModel):
    company_code: Optional[str] = None
    company_name: str
    tax_number: Optional[str] = None
    credit_code: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    status: Optional[str] = "ACTIVE"

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    company_code: Optional[str] = None
    company_name: Optional[str] = None
    tax_number: Optional[str] = None
    credit_code: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    status: Optional[str] = None

class CompanyResponse(CompanyBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Tax Entity Schemas ---
class TaxEntityBase(BaseModel):
    company_id: int
    tax_no: str
    tax_type: Optional[str] = "个人所得税"
    tax_region: Optional[str] = None
    status: Optional[str] = "ACTIVE"

class TaxEntityCreate(TaxEntityBase):
    pass

class TaxEntityResponse(TaxEntityBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Employee Schemas ---
class EmployeeBase(BaseModel):
    company_id: int
    name: str
    id_card: str
    id_card_type: Optional[str] = "居民身份证"
    employee_status: Optional[str] = "在职"
    entry_date: Optional[date] = None
    leave_date: Optional[date] = None
    phone: Optional[str] = None

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeResponse(EmployeeBase):
    id: int
    created_at: datetime
    updated_at: datetime
    company_name: Optional[str] = None

    class Config:
        from_attributes = True

# --- Employee Month-to-Month Change Schemas ---
class EmployeeChangeDetail(BaseModel):
    name: str
    id_card: str
    phone: Optional[str] = None
    company_name: str
    change_type: str # NEW, LEFT, TRANSFERRED
    details: Optional[str] = None

class EmployeeChangesResponse(BaseModel):
    month: str
    compare_month: str
    new_hires: List[EmployeeChangeDetail]
    resigned: List[EmployeeChangeDetail]
    transferred: List[EmployeeChangeDetail]
    total_new_hires: int
    total_resigned: int
    total_transferred: int

# --- Salary Record Schemas ---
class SalaryRecordResponse(BaseModel):
    id: int
    batch_id: int
    company_id: int
    employee_id: Optional[int] = None
    name: str
    id_card: str
    store_name: Optional[str] = None
    post_name: Optional[str] = None
    employee_status: Optional[str] = None
    salary: Decimal
    tax_amount: Decimal
    pension: Decimal
    medical: Decimal
    unemployment: Decimal
    actual_tax: Decimal
    phone: Optional[str] = None
    remark: Optional[str] = None
    month: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Declare Task Schemas ---
class DeclareTaskResponse(BaseModel):
    id: int
    month: str
    company_id: int
    company_name: Optional[str] = None
    status: str
    declare_tax: Decimal
    headcount: int
    operator: str
    declared_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DeclareTaskStatusUpdate(BaseModel):
    status: str
    operator: Optional[str] = "Admin"

# --- Import Batch Schemas ---
class ImportBatchResponse(BaseModel):
    id: int
    filename: str
    month: str
    total_rows: int
    valid_rows: int
    status: str
    operator: str
    ignored_records: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Payment Schemas ---
class PaymentCreate(BaseModel):
    task_id: int
    company_id: int
    month: str
    tax_amount: Decimal
    payment_method: Optional[str] = "三方协议扣款"
    status: Optional[str] = "PAID"

class PaymentResponse(BaseModel):
    id: int
    task_id: int
    company_id: int
    company_name: Optional[str] = None
    month: str
    tax_amount: Decimal
    payment_method: str
    paid_at: Optional[datetime] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Archive Schemas ---
class ArchiveResponse(BaseModel):
    id: int
    company_id: int
    company_name: Optional[str] = None
    month: str
    archive_type: str
    file_name: str
    file_path: str
    uploaded_at: datetime

    class Config:
        from_attributes = True

# --- Risk Alert Schemas ---
class RiskAlertResponse(BaseModel):
    id: int
    month: str
    company_id: int
    company_name: Optional[str] = None
    alert_type: str
    alert_level: str
    message: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class RiskAlertResolve(BaseModel):
    status: str # IGNORED, RESOLVED

# --- Dashboard Schemas ---
class DashboardOverview(BaseModel):
    total_companies: int
    filed_companies: int # 本月完成申报的任务数
    unfiled_companies: int # 本月待申报的任务数
    total_tax_amount: Decimal # 本月应纳税额
    total_headcount: int # 本月申报总人数
    active_risk_alerts: int # 未处理的风险数
    completion_rate: float # 申报完成率
    month: str

# --- User & Auth Schemas ---
class UserLoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    token: str
    username: str
    role: str
