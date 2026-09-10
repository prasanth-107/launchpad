from typing import Dict, Any, List
from app.db.repositories import (
    user_db, assessment_db, interview_db, learning_db, analytics_db
)

class PlacementReadinessService:
    """Calculates student's Placement Readiness score and action plan."""

    def compute_readiness(self, user_id: str) -> Dict[str, Any]:
        # 1. Retrieve user's existing baseline or analytics
        existing = analytics_db.get_user_readiness(user_id)
        
        tech_score = 80.0
        apt_score = 72.0
        comm_score = 65.0
        interview_score = 75.0
        resume_score = 70.0
        
        # Override with actual attempts if available
        attempts = assessment_db.get_user_attempts(user_id)
        if attempts:
            tech_attempts = [a["percentage"] for a in attempts if a.get("category") not in ["Quantitative Aptitude", "Logical Reasoning", "Verbal Ability"]]
            apt_attempts = [a["percentage"] for a in attempts if a.get("category") in ["Quantitative Aptitude", "Logical Reasoning", "Verbal Ability"]]
            if tech_attempts:
                tech_score = sum(tech_attempts) / len(tech_attempts)
            if apt_attempts:
                apt_score = sum(apt_attempts) / len(apt_attempts)

        # Override interview score if available
        sessions = interview_db.get_user_sessions(user_id)
        if sessions:
            int_scores = [s.get("average_score", 75) for s in sessions if "average_score" in s]
            if int_scores:
                interview_score = sum(int_scores) / len(int_scores)

        # Learning progress from roadmap
        progress_percentage = learning_db.get_progress_percentage(user_id)
        if progress_percentage == 0 and existing:
            progress_percentage = existing.get("learning_progress", 35)

        # Use existing resume score if cached
        if existing and "resume_score" in existing:
            resume_score = existing["resume_score"]

        # Multi-factor weighted score calculation:
        # Technical: 25%, Aptitude: 20%, Communication: 15%, Interview: 15%, Resume: 15%, Progress: 10%
        overall = int(
            (tech_score * 0.25) +
            (apt_score * 0.20) +
            (comm_score * 0.15) +
            (interview_score * 0.15) +
            (resume_score * 0.15) +
            (progress_percentage * 0.10)
        )
        overall = min(100, max(15, overall))

        # Determine Readiness Tier
        if overall >= 85:
            status = "Placement Ready 🎯"
        elif overall >= 68:
            status = "Almost Ready"
        elif overall >= 45:
            status = "Developing"
        else:
            status = "Needs Preparation"

        # Diagnose weak areas and next steps
        weak_skills = []
        strong_skills = []

        if tech_score >= 75:
            strong_skills.append("Technical Foundation")
        else:
            weak_skills.append("Technical Core (SQL / DSA)")

        if apt_score >= 75:
            strong_skills.append("Aptitude & Logic")
        else:
            weak_skills.append("Quantitative Aptitude")

        if comm_score >= 75:
            strong_skills.append("Verbal Communication")
        else:
            weak_skills.append("Interview Communication")

        if interview_score >= 75:
            strong_skills.append("Mock Interview Fluency")
        else:
            weak_skills.append("Mock Interview Practice")

        if resume_score < 75:
            weak_skills.append("Resume ATS Keywords")
        else:
            strong_skills.append("ATS Resume Polish")

        # Actionable next steps
        action_plan = []
        if "Technical Core (SQL / DSA)" in weak_skills or tech_score < 80:
            action_plan.append("Improve SQL queries & review Binary Tree traversals")
        if "Interview Communication" in weak_skills or comm_score < 70:
            action_plan.append("Practice STAR method for HR behavioral questions")
        if progress_percentage < 50:
            action_plan.append("Complete next 2 roadmap milestones in your learning path")
        if len(sessions) < 2:
            action_plan.append("Complete 1 additional AI mock interview with voice recording")
        if resume_score < 75:
            action_plan.append("Incorporate quantifiable project metrics into your resume")

        if not action_plan:
            action_plan = [
                "Practice company-specific coding interview questions",
                "Participate in weekly placement mock tests",
                "Apply to upcoming campus placement drives"
            ]

        recommended_next_step = f"Focus on {weak_skills[0] if weak_skills else 'Advanced DSA'} to boost your readiness past 85%."

        result = {
            "placement_readiness": overall,
            "status": status,
            "technical_score": int(tech_score),
            "aptitude_score": int(apt_score),
            "communication_score": int(comm_score),
            "interview_score": int(interview_score),
            "resume_score": int(resume_score),
            "learning_progress": progress_percentage,
            "weak_skills": weak_skills[:3] if weak_skills else ["System Architecture"],
            "strong_skills": strong_skills[:3] if strong_skills else ["Problem Solving"],
            "recommended_next_step": recommended_next_step,
            "action_plan": action_plan[:4],
            "recommended_topics": [
                "SQL JOINs, Subqueries & Transactions",
                "Binary Search & Dynamic Programming Basics",
                "Behavioral STAR Interview Responses"
            ]
        }

        # Cache in Analytics Database
        analytics_db.set_user_readiness(user_id, result)
        return result

readiness_service = PlacementReadinessService()
