from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from app.db.repositories import user_db
from app.services.readiness_service import readiness_service

router = APIRouter(prefix="/auth", tags=["Authentication"])

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    college: str
    department: str
    year: str
    skills: List[str] = []
    programming_languages: List[str] = []
    career_goal: str = "Software Engineer"
    preferred_job_role: str = "Full Stack Software Engineer"
    resume_text: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

@router.post("/register")
def register(req: RegisterRequest):
    existing = user_db.get_by_email(req.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A student account with this email address already exists."
        )
    user_data = req.dict()
    user_data["password_hash"] = f"hash_{req.password}"
    del user_data["password"]
    
    created_user = user_db.create(user_data)
    # Initialize readiness score for new student
    readiness_service.compute_readiness(created_user["id"])
    
    return {
        "success": True,
        "message": "Student registration completed successfully!",
        "user": created_user,
        "token": f"token_{created_user['id']}"
    }

@router.post("/login")
def login(req: LoginRequest):
    user = user_db.get_by_email(req.email)
    if not user:
        # Check if demo student
        if req.email.lower() == "demo@launchpad.edu":
            user = user_db.get_by_id("student-demo-101")
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials. Student account not found."
            )
    return {
        "success": True,
        "message": "Login successful!",
        "user": user,
        "token": f"token_{user['id']}"
    }

@router.post("/demo")
def demo_login():
    """Provides one-click instant access to the pre-populated demo student profile."""
    user = user_db.get_by_id("student-demo-101")
    return {
        "success": True,
        "message": "Demo student logged in successfully!",
        "user": user,
        "token": f"token_{user['id']}"
    }

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    user = user_db.get_by_email(req.email)
    return {
        "success": True,
        "message": f"If an account exists for {req.email}, a secure password reset link has been dispatched."
    }

@router.get("/me")
def get_current_user(user_id: str = "student-demo-101"):
    user = user_db.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Student profile not found.")
    return user
