from fastapi import APIRouter
from app.services.readiness_service import readiness_service
from app.db.repositories import interview_db, assessment_db, learning_db, user_db

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/{user_id}")
def get_dashboard_data(user_id: str = "student-demo-101"):
    # 1. Compute dynamic placement readiness metrics
    readiness = readiness_service.compute_readiness(user_id)
    
    # 2. Get user info
    user = user_db.get_by_id(user_id) or {}

    # 3. Get recent interview sessions
    sessions = interview_db.get_user_sessions(user_id)
    recent_interviews = []
    for s in sessions[-3:]:
        recent_interviews.append({
            "id": s["id"],
            "type": s["type"],
            "role": s.get("role", "Software Engineer"),
            "score": s.get("average_score", 75),
            "timestamp": s.get("timestamp"),
            "question_count": len(s.get("questions", []))
        })

    # 4. Get upcoming assessments / pending categories
    completed_cats = {a.get("category") for a in assessment_db.get_user_attempts(user_id)}
    all_cats = ["Python", "SQL", "Data Structures", "JavaScript", "Quantitative Aptitude", "Logical Reasoning"]
    upcoming_assessments = [
        {"category": cat, "questions": 5, "durationMinutes": 15, "status": "Ready to take"}
        for cat in all_cats if cat not in completed_cats
    ][:3]

    # 5. Get learning roadmap next node
    roadmap = learning_db.get_roadmap(user_id)
    next_node = next((node for node in roadmap if not node.get("completed")), None)

    return {
        "user": {
            "id": user.get("id"),
            "name": user.get("name", "Student"),
            "college": user.get("college", "Engineering Institute"),
            "department": user.get("department", "CSE"),
            "preferred_job_role": user.get("preferred_job_role", "Software Engineer")
        },
        "readiness": readiness,
        "recent_interviews": recent_interviews,
        "upcoming_assessments": upcoming_assessments,
        "next_learning_step": next_node,
        "radar_data": [
            {"subject": "Technical", "score": readiness["technical_score"], "fullMark": 100},
            {"subject": "Aptitude", "score": readiness["aptitude_score"], "fullMark": 100},
            {"subject": "Communication", "score": readiness["communication_score"], "fullMark": 100},
            {"subject": "Interview", "score": readiness["interview_score"], "fullMark": 100},
            {"subject": "Resume", "score": readiness["resume_score"], "fullMark": 100},
            {"subject": "Progress", "score": readiness["learning_progress"], "fullMark": 100}
        ]
    }
