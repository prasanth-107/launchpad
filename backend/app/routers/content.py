from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from app.db.repositories import content_db

router = APIRouter(prefix="/content", tags=["Content"])

@router.get("")
def get_all_content():
    """Returns the full organized content library across all 7 layers."""
    return {
        "success": True,
        "categories": [
            {"key": "programming", "title": "Programming Languages", "desc": "C, C++, Java, and Python fundamentals."},
            {"key": "web_development", "title": "Web Development", "desc": "Modern HTML5, CSS3, JavaScript ES6+, and React."},
            {"key": "database", "title": "Databases & SQL", "desc": "Relational schemas, queries, JOINs, indexing, and DBMS."},
            {"key": "data_structures", "title": "Data Structures & Algorithms", "desc": "Arrays, trees, graphs, sorting, searching, and Big-O."},
            {"key": "aptitude", "title": "Campus Aptitude & Logic", "desc": "Quantitative tricks, logical reasoning, and verbal tests."},
            {"key": "interview_prep", "title": "Interview Preparation", "desc": "HR behavioral questions, STAR method, and core technical questions."},
            {"key": "resume_prep", "title": "Resume Building & ATS", "desc": "ATS formats, action verbs, project templates, and tips."}
        ],
        "data": content_db.get_all_content()
    }

@router.get("/{category_key}")
def get_category_content(category_key: str):
    data = content_db.get_category_content(category_key)
    if not data:
        raise HTTPException(status_code=404, detail="Content category not found.")
    return {"category": category_key, "topics": data}
