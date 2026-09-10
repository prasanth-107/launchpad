from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.db.repositories import interview_db, user_db
from app.db.seed_data import INTERVIEW_QUESTIONS_SEED
from app.services.ai_service import ai_service
from app.services.readiness_service import readiness_service

router = APIRouter(prefix="/interview", tags=["Mock Interview"])

class StartSessionRequest(BaseModel):
    user_id: str
    type: str  # "HR Interview", "Technical Interview", "Behavioral Interview", "Role-based Interview"
    role: Optional[str] = "Full Stack Software Engineer"

class EvaluateAnswerRequest(BaseModel):
    session_id: Optional[str] = None
    user_id: str
    interview_type: str = "Technical"
    question: str
    student_answer: str

@router.get("/questions")
def get_interview_questions(type: Optional[str] = None):
    """Returns curated interview questions by interview type."""
    if type and type.lower() in INTERVIEW_QUESTIONS_SEED:
        return {"questions": INTERVIEW_QUESTIONS_SEED[type.lower()]}
    return {
        "categories": {
            "hr": {"title": "HR Interview", "questions": INTERVIEW_QUESTIONS_SEED["hr"]},
            "technical": {"title": "Technical Interview", "questions": INTERVIEW_QUESTIONS_SEED["technical"]},
            "behavioral": {"title": "Behavioral Interview", "questions": INTERVIEW_QUESTIONS_SEED["behavioral"]},
            "role_based": {"title": "Role-based Interview", "questions": INTERVIEW_QUESTIONS_SEED["role_based"]}
        }
    }

@router.post("/start")
def start_session(req: StartSessionRequest):
    """Initializes a new interactive interview session."""
    session_data = {
        "user_id": req.user_id,
        "type": req.type,
        "role": req.role,
        "questions": []
    }
    created = interview_db.create_session(session_data)
    return {"success": True, "session": created}

@router.post("/evaluate")
async def evaluate_answer(req: EvaluateAnswerRequest):
    """Evaluates student's answer using AI, records exchange, and updates readiness."""
    # 1. AI evaluation
    evaluation = await ai_service.evaluate_interview_answer(
        question=req.question,
        student_answer=req.student_answer,
        interview_type=req.interview_type
    )

    exchange = {
        "question": req.question,
        "student_answer": req.student_answer,
        "evaluation": evaluation
    }

    # 2. Record exchange in session if session_id provided
    session = None
    if req.session_id:
        session = interview_db.add_exchange(req.session_id, exchange)

    # 3. Recalculate user placement readiness score
    updated_readiness = readiness_service.compute_readiness(req.user_id)

    return {
        "success": True,
        "evaluation": evaluation,
        "session": session,
        "updated_readiness": updated_readiness
    }

@router.get("/sessions/{user_id}")
def get_user_sessions(user_id: str):
    """Returns the user's past mock interview sessions."""
    sessions = interview_db.get_user_sessions(user_id)
    return {"sessions": sessions}
