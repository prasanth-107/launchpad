from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.db.repositories import user_db, analytics_db
from app.services.ai_service import ai_service
from app.services.readiness_service import readiness_service

router = APIRouter(prefix="/resume", tags=["Resume Analysis"])

class AnalyzeResumeRequest(BaseModel):
    user_id: str
    resume_text: str
    target_role: Optional[str] = "Full Stack Software Engineer"

@router.post("/analyze")
async def analyze_resume_text(req: AnalyzeResumeRequest):
    """Analyzes student resume text against target role using ATS evaluation engine."""
    analysis = await ai_service.analyze_resume(
        resume_text=req.resume_text,
        target_role=req.target_role or "Full Stack Software Engineer"
    )

    # Save resume text and score to student profile & analytics
    user_db.update(req.user_id, {
        "resume_text": req.resume_text,
        "preferred_job_role": req.target_role
    })
    
    existing = analytics_db.get_user_readiness(req.user_id) or {}
    existing["resume_score"] = analysis["resume_score"]
    analytics_db.set_user_readiness(req.user_id, existing)

    # Recompute overall readiness score
    updated_readiness = readiness_service.compute_readiness(req.user_id)

    return {
        "success": True,
        "analysis": analysis,
        "updated_readiness": updated_readiness
    }

@router.post("/upload")
async def upload_resume_file(
    user_id: str = Form(...),
    target_role: str = Form("Full Stack Software Engineer"),
    file: UploadFile = File(...)
):
    """Accepts resume file upload (.txt, .pdf, .md), extracts text and analyzes."""
    content_bytes = await file.read()
    try:
        text_content = content_bytes.decode("utf-8", errors="ignore")
    except Exception:
        text_content = f"Uploaded resume file: {file.filename}"

    analysis = await ai_service.analyze_resume(
        resume_text=text_content,
        target_role=target_role
    )

    user_db.update(user_id, {
        "resume_text": text_content,
        "preferred_job_role": target_role
    })

    existing = analytics_db.get_user_readiness(user_id) or {}
    existing["resume_score"] = analysis["resume_score"]
    analytics_db.set_user_readiness(user_id, existing)

    updated_readiness = readiness_service.compute_readiness(user_id)

    return {
        "success": True,
        "filename": file.filename,
        "analysis": analysis,
        "updated_readiness": updated_readiness
    }
