import hashlib
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app import schemas

router = APIRouter(prefix="/auth", tags=["Authentication"])

def hash_password(password: str) -> str:
    """SHA-256 password hashing with static salt for simplicity and stability."""
    salt = "tax_center_salt_2026"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def is_password_strong(password: str) -> bool:
    """Password strength validation: length >= 6, contains at least one letter and one number."""
    if len(password) < 6:
        return False
    has_letter = any(c.isalpha() for c in password)
    has_digit = any(c.isdigit() for c in password)
    return has_letter and has_digit

@router.post("/login", response_model=schemas.TokenResponse)
def login(request: schemas.UserLoginRequest, db: Session = Depends(get_db)):
    # 1. Fetch user
    user = db.query(User).filter(User.username == request.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )
        
    # 2. Verify status
    if user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="该账户已被禁用，请联系系统管理员"
        )
        
    # 3. Verify password
    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )
        
    # 4. Generate mock token (simple secure token for frontend session state)
    token = f"session_token_{user.username}_{hash_password(user.username)[:16]}"
    
    return {
        "token": token,
        "username": user.username,
        "role": user.role
    }

@router.post("/change-password")
def change_password(
    username: str,
    old_password: str,
    new_password: str,
    db: Session = Depends(get_db)
):
    # 1. Fetch user
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="未找到该用户")
        
    # 2. Verify old password
    if not verify_password(old_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="原密码输入错误")
        
    # 3. Enforce strong password limit
    if not is_password_strong(new_password):
        raise HTTPException(
            status_code=400,
            detail="密码强度不合规！新密码长度必须至少为 6 位，且必须同时包含英文字母和数字"
        )
        
    # 4. Hash and save
    user.hashed_password = hash_password(new_password)
    db.commit()
    return {"message": "密码修改成功！"}
