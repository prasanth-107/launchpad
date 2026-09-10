from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.db.repositories import (
    user_db, assessment_db, content_db, interview_db, analytics_db
)

router = APIRouter(prefix="/admin", tags=["Admin Panel"])

class AddQuestionRequest(BaseModel):
    category: str
    type: str = "mcq" # "mcq" or "coding"
    question: str
    difficulty: str = "Medium"
    skill: str
    options: Optional[List[str]] = None
    correctIndex: Optional[int] = None
    explanation: Optional[str] = None
    initialCode: Optional[str] = None

class AddResourceRequest(BaseModel):
    topic_id: str
    title: str
    url: str
    provider: str
    type: str = "Documentation & Tutorial"
    description: str

class AddTopicRequest(BaseModel):
    category_key: str # programming, web_development, database, data_structures, aptitude, interview_prep, resume_prep
    name: str
    description: str
    topics: List[str] = []

@router.get("/stats")
def get_admin_stats():
    """Returns aggregated platform metrics and usage statistics."""
    platform_stats = analytics_db.get_platform_stats()
    users = user_db.all_users()
    questions = assessment_db.questions
    
    # Calculate real-time dynamic stats
    avg_readiness = 73.0
    if users:
        readiness_values = []
        for u in users:
            r = analytics_db.get_user_readiness(u["id"])
            if r:
                readiness_values.append(r["placement_readiness"])
        if readiness_values:
            avg_readiness = round(sum(readiness_values) / len(readiness_values), 1)

    return {
        "metrics": {
            "total_students": len(users) + platform_stats.get("total_registered_students", 1420),
            "total_questions": len(questions),
            "assessments_completed": len(assessment_db.attempts) + platform_stats.get("assessments_completed", 3890),
            "interviews_conducted": len(interview_db.sessions) + platform_stats.get("mock_interviews_conducted", 1240),
            "average_readiness_score": avg_readiness
        },
        "popular_topics": [
            {"name": "Python & Data Structures", "completions": 482, "category": "Programming"},
            {"name": "SQL Queries & Aggregations", "completions": 420, "category": "Database"},
            {"name": "React Hooks & State", "completions": 389, "category": "Web Development"},
            {"name": "Quantitative Aptitude Formulas", "completions": 354, "category": "Aptitude"},
            {"name": "HR STAR Method Responses", "completions": 298, "category": "Interview Prep"}
        ]
    }

@router.get("/students")
def get_student_list():
    """Lists registered students with readiness status."""
    users = user_db.all_users()
    result = []
    for u in users:
        readiness = analytics_db.get_user_readiness(u["id"]) or {"placement_readiness": 70, "status": "Developing"}
        result.append({
            "id": u.get("id"),
            "name": u.get("name"),
            "email": u.get("email"),
            "college": u.get("college"),
            "department": u.get("department"),
            "preferred_job_role": u.get("preferred_job_role"),
            "readiness": readiness.get("placement_readiness", 70),
            "status": readiness.get("status", "Developing"),
            "created_at": u.get("created_at")
        })
    return {"students": result}

@router.post("/questions")
def add_question(req: AddQuestionRequest):
    """Admin adds a new assessment question."""
    q_data = req.dict()
    added = assessment_db.add_question(q_data)
    return {
        "success": True,
        "message": f"Question added successfully to category '{req.category}'.",
        "question": added
    }

@router.post("/resources")
def add_resource(req: AddResourceRequest):
    """Admin adds a verified educational resource link to a learning topic."""
    res_data = {
        "title": req.title,
        "url": req.url,
        "provider": req.provider,
        "type": req.type,
        "description": req.description
    }
    success = content_db.add_resource_to_topic(req.topic_id, res_data)
    if not success:
        raise HTTPException(status_code=404, detail="Topic not found.")
    return {
        "success": True,
        "message": f"Resource '{req.title}' linked successfully to topic '{req.topic_id}'."
    }

@router.post("/topics")
def add_topic(req: AddTopicRequest):
    """Admin adds a new learning topic to a content category."""
    topic_data = {
        "id": req.name.lower().replace(" ", "_"),
        "name": req.name,
        "category": req.category_key.title(),
        "description": req.description,
        "topics": req.topics,
        "resources": [],
        "youtube": []
    }
    success = content_db.add_topic(req.category_key, topic_data)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid category key.")
    return {
        "success": True,
        "message": f"Topic '{req.name}' added successfully to category '{req.category_key}'.",
        "topic": topic_data
    }
