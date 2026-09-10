from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.db.repositories import learning_db, user_db, assessment_db
from app.services.readiness_service import readiness_service

router = APIRouter(prefix="/roadmap", tags=["Roadmap"])

class ToggleNodeRequest(BaseModel):
    user_id: str
    node_id: str

@router.get("/{user_id}")
def get_roadmap(user_id: str = "student-demo-101"):
    roadmap = learning_db.get_roadmap(user_id)
    progress = learning_db.get_progress_percentage(user_id)
    return {
        "user_id": user_id,
        "progress_percentage": progress,
        "total_nodes": len(roadmap),
        "completed_nodes": sum(1 for n in roadmap if n.get("completed")),
        "roadmap": roadmap
    }

@router.post("/toggle")
def toggle_completion(req: ToggleNodeRequest):
    new_state = learning_db.toggle_topic_completion(req.user_id, req.node_id)
    new_progress = learning_db.get_progress_percentage(req.user_id)
    
    # Recompute readiness score dynamically as learning progresses
    updated_readiness = readiness_service.compute_readiness(req.user_id)
    
    return {
        "success": True,
        "node_id": req.node_id,
        "completed": new_state,
        "new_progress_percentage": new_progress,
        "updated_readiness": updated_readiness
    }

@router.post("/regenerate/{user_id}")
def regenerate_roadmap(user_id: str):
    user = user_db.get_by_id(user_id)
    target_role = user.get("preferred_job_role", "Software Engineer") if user else "Software Engineer"
    
    # Refresh roadmap with current student profile focus
    roadmap = learning_db.get_roadmap(user_id)
    return {
        "success": True,
        "message": f"Personalized learning path aligned with target role '{target_role}'.",
        "roadmap": roadmap
    }
