from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from app.db.repositories import (
    user_db, assessment_db, learning_db, interview_db, analytics_db, content_db
)
from app.services.readiness_service import readiness_service

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

@router.get("/{user_id}")
def get_recommendations(user_id: str = "student-demo-101"):
    """Synthesizes student profile, assessments, interviews, and resume into prioritized AI recommendations."""
    # 1. Get user readiness and diagnosed weak areas
    readiness = readiness_service.compute_readiness(user_id)
    user = user_db.get_by_id(user_id) or {}
    target_role = user.get("preferred_job_role", "Full Stack Software Engineer")
    
    weak_skills = readiness.get("weak_skills", ["SQL", "Communication"])
    tech_score = readiness.get("technical_score", 70)
    interview_score = readiness.get("interview_score", 70)
    resume_score = readiness.get("resume_score", 70)

    # 2. Build prioritized recommendations
    action_items = []
    recommended_topics = []
    recommended_videos = []
    recommended_websites = []
    recommended_practice = []
    recommended_interview = []

    # Detect specific weakness
    has_sql_weakness = any("sql" in s.lower() or "database" in s.lower() for s in weak_skills) or tech_score < 75
    has_comm_weakness = any("communication" in s.lower() or "verbal" in s.lower() for s in weak_skills) or readiness.get("communication_score", 70) < 70
    has_interview_weakness = interview_score < 75
    has_resume_weakness = resume_score < 75

    if has_sql_weakness:
        recommended_topics.extend([
            {"title": "SQL Subqueries, Aggregations & Window Functions", "urgency": "High", "reason": "High weight in initial technical screening"},
            {"title": "Relational Schema Normalization & Indexing", "urgency": "Medium", "reason": "Core database systems interview topic"}
        ])
        recommended_websites.append({
            "name": "W3Schools SQL Tutorial",
            "url": "https://www.w3schools.com/sql/",
            "topic": "SQL Queries & Aggregations",
            "description": "Interactive browser-based database query playground."
        })
        recommended_videos.append({
            "videoId": "HXV3zeQKqGY",
            "title": "SQL Tutorial - Full Database Course for Beginners",
            "channel": "freeCodeCamp.org",
            "duration": "4h 20m",
            "thumbnail": "https://img.youtube.com/vi/HXV3zeQKqGY/hqdefault.jpg"
        })
        recommended_practice.append("Complete SQL Assessment: Practice 5 multi-table JOIN questions.")

    if has_comm_weakness or has_interview_weakness:
        recommended_topics.append({
            "title": "STAR Method for Behavioral Placement Interviews",
            "urgency": "High",
            "reason": "Crucial for HR culture-fit round and manager evaluations"
        })
        recommended_interview.extend([
            "Practice 'Tell Me About Yourself' elevator pitch in AI Mock Interview",
            "Simulate Behavioral conflict resolution question with voice input"
        ])
        recommended_videos.append({
            "videoId": "1mHjMNZZvFo",
            "title": "Tell Me About Yourself - A Good Answer to This Interview Question",
            "channel": "Linda Raynier",
            "duration": "11m 40s",
            "thumbnail": "https://img.youtube.com/vi/1mHjMNZZvFo/hqdefault.jpg"
        })
        recommended_websites.append({
            "name": "GeeksforGeeks HR Interview Questions",
            "url": "https://www.geeksforgeeks.org/top-hr-interview-questions-answers/",
            "topic": "HR Behavioral Preparation",
            "description": "Top 50 campus placement HR questions with curated model answers."
        })

    if has_resume_weakness:
        action_items.append("Revise resume with quantifiable metrics (e.g. 'Improved performance by 35%').")
        recommended_websites.append({
            "name": "freeCodeCamp Resume Guide",
            "url": "https://www.freecodecamp.org/news/how-to-write-a-tech-resume/",
            "topic": "ATS Tech Resume Strategy",
            "description": "Step-by-step tech resume guide with ATS keyword recommendations."
        })

    # Always ensure Data Structures reinforcement
    recommended_topics.append({
        "title": "Data Structures: Binary Trees & Graphs",
        "urgency": "High",
        "reason": f"Standard coding assessment expectation for {target_role}"
    })
    recommended_videos.append({
        "videoId": "8hly31xKli0",
        "title": "Algorithms and Data Structures Tutorial - Full Course",
        "channel": "freeCodeCamp.org",
        "duration": "5h 22m",
        "thumbnail": "https://img.youtube.com/vi/8hly31xKli0/hqdefault.jpg"
    })
    recommended_websites.append({
        "name": "GeeksforGeeks DSA Guide",
        "url": "https://www.geeksforgeeks.org/data-structures/",
        "topic": "Data Structures & Algorithms",
        "description": "Definitive visual guides to Trees, Graphs, and Dynamic Programming."
    })
    recommended_practice.append("Take Data Structures assessment challenge on Array Two-Pointers.")

    return {
        "user_id": user_id,
        "target_role": target_role,
        "weak_area_detected": weak_skills[0] if weak_skills else "SQL & Relational Databases",
        "readiness_score": readiness["placement_readiness"],
        "recommended_next_step": readiness["recommended_next_step"],
        "recommended_topics": recommended_topics,
        "recommended_videos": recommended_videos,
        "recommended_websites": recommended_websites,
        "recommended_practice": recommended_practice,
        "recommended_interview_prep": recommended_interview
    }
