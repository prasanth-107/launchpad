from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.db.repositories import user_db

router = APIRouter(prefix="/profile", tags=["Profile"])

class ProfileUpdateRequest(BaseModel):
    user_id: str
    name: Optional[str] = None
    college: Optional[str] = None
    department: Optional[str] = None
    year: Optional[str] = None
    skills: Optional[List[str]] = None
    programming_languages: Optional[List[str]] = None
    career_goal: Optional[str] = None
    preferred_job_role: Optional[str] = None
    resume_text: Optional[str] = None

@router.get("/{user_id}")
def get_profile(user_id: str):
    user = user_db.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Student profile not found.")
    return user

@router.put("/update")
def update_profile(req: ProfileUpdateRequest):
    updates = {k: v for k, v in req.dict().items() if v is not None and k != "user_id"}
    updated = user_db.update(req.user_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found.")
    return {
        "success": True,
        "message": "Student profile updated successfully.",
        "user": updated
    }
