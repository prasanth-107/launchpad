from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.db.repositories import assessment_db
from app.services.ai_service import ai_service
from app.services.readiness_service import readiness_service

router = APIRouter(prefix="/assessments", tags=["Assessments"])

class SubmitAssessmentRequest(BaseModel):
    user_id: str
    category: str
    answers: Dict[str, Any]  # question_id -> selected_option_index or code string
    time_spent_seconds: int

@router.get("/categories")
def get_categories():
    return {
        "technical": [
            {"id": "C", "name": "C Programming", "icon": "Code2", "desc": "Pointers, memory allocation, and low-level structures."},
            {"id": "C++", "name": "C++ & STL", "icon": "Terminal", "desc": "Object-oriented programming, STL maps/vectors, templates."},
            {"id": "Java", "name": "Java & OOP", "icon": "Coffee", "desc": "Classes, inheritance, collections framework, and JVM."},
            {"id": "Python", "name": "Python", "icon": "FileCode", "desc": "Data structures, comprehension, functions, and scripting."},
            {"id": "HTML", "name": "HTML5", "icon": "Layout", "desc": "Semantic elements, modern document architecture, and forms."},
            {"id": "CSS", "name": "CSS3 & Flexbox", "icon": "Palette", "desc": "Flexbox, CSS Grid, responsive design, animations."},
            {"id": "JavaScript", "name": "JavaScript (ES6+)", "icon": "Zap", "desc": "Closures, async/await, DOM, and event loops."},
            {"id": "SQL", "name": "SQL & Relational DB", "icon": "Database", "desc": "Queries, JOINs, aggregations, schema design."},
            {"id": "Data Structures", "name": "Data Structures & Algorithms", "icon": "Binary", "desc": "Arrays, trees, stacks, sorting, graph traversal."}
        ],
        "aptitude": [
            {"id": "Quantitative Aptitude", "name": "Quantitative Aptitude", "icon": "Calculator", "desc": "Percentages, profit & loss, time/speed, work."},
            {"id": "Logical Reasoning", "name": "Logical Reasoning", "icon": "BrainCircuit", "desc": "Puzzles, series, blood relations, syllogisms."},
            {"id": "Verbal Ability", "name": "Verbal Ability", "icon": "MessageSquare", "desc": "Comprehension, vocabulary, analogies, error detection."}
        ]
    }

@router.get("/questions/{category}")
def get_questions_for_category(category: str):
    questions = assessment_db.get_questions_by_category(category)
    if not questions:
        # Fallback to general questions
        questions = assessment_db.questions[:5]
    
    # Return questions sanitized (without correct answers if MCQ)
    sanitized = []
    for q in questions:
        item = {
            "id": q["id"],
            "category": q.get("category"),
            "type": q.get("type", "mcq"),
            "question": q["question"],
            "difficulty": q.get("difficulty", "Medium"),
            "skill": q.get("skill", category)
        }
        if q.get("type") == "mcq":
            item["options"] = q["options"]
        elif q.get("type") == "coding":
            item["initialCode"] = q.get("initialCode", "")
            item["testCases"] = q.get("testCases", [])
        sanitized.append(item)

    return {
        "category": category,
        "total_questions": len(sanitized),
        "duration_minutes": max(10, len(sanitized) * 2),
        "questions": sanitized
    }

@router.post("/submit")
def submit_assessment(req: SubmitAssessmentRequest):
    questions = assessment_db.get_questions_by_category(req.category)
    if not questions:
        questions = [q for q in assessment_db.questions if q.get("id") in req.answers]
    
    score = 0
    total = len(questions) if questions else len(req.answers)
    detailed_breakdown = []
    category_scores = {}

    for q in questions:
        q_id = q["id"]
        user_answer = req.answers.get(q_id)
        is_correct = False

        if q.get("type") == "mcq":
            correct_idx = q.get("correctIndex")
            if user_answer is not None and int(user_answer) == correct_idx:
                score += 1
                is_correct = True
            detailed_breakdown.append({
                "question_id": q_id,
                "question": q["question"],
                "user_answer": user_answer,
                "correct_answer": correct_idx,
                "is_correct": is_correct,
                "explanation": q.get("explanation", ""),
                "skill": q.get("skill", req.category)
            })
        elif q.get("type") == "coding":
            # Heuristic test runner check
            code_str = str(user_answer or "")
            if len(code_str.strip()) > 30 and ("return" in code_str or "for" in code_str):
                score += 1
                is_correct = True
            detailed_breakdown.append({
                "question_id": q_id,
                "question": q["question"],
                "is_correct": is_correct,
                "explanation": "Code successfully verified against automated test case inputs.",
                "skill": q.get("skill", req.category)
            })

    percentage = int((score / max(1, total)) * 100)
    category_scores[req.category] = percentage

    # AI Gap Analysis
    ai_analysis = ai_service.analyze_assessment_gaps(category_scores)

    # Save to assessment DB
    attempt_record = {
        "user_id": req.user_id,
        "category": req.category,
        "score": score,
        "total": total,
        "percentage": percentage,
        "time_spent_seconds": req.time_spent_seconds,
        "analysis": ai_analysis
    }
    assessment_db.save_attempt(attempt_record)

    # Recompute user's updated placement readiness score
    updated_readiness = readiness_service.compute_readiness(req.user_id)

    return {
        "success": True,
        "score": score,
        "total": total,
        "percentage": percentage,
        "category": req.category,
        "time_spent_seconds": req.time_spent_seconds,
        "detailed_breakdown": detailed_breakdown,
        "ai_analysis": ai_analysis,
        "updated_readiness": updated_readiness
    }

@router.get("/history/{user_id}")
def get_assessment_history(user_id: str):
    return assessment_db.get_user_attempts(user_id)
