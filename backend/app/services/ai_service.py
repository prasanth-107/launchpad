import re
import json
import httpx
from typing import Dict, Any, List
from app.core.config import settings

class AIService:
    """AI engine for interview evaluation, resume parsing, and diagnostic analysis."""
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY

    async def evaluate_interview_answer(
        self,
        question: str,
        student_answer: str,
        interview_type: str = "Technical"
    ) -> Dict[str, Any]:
        """Evaluates student's interview response with scores, detailed feedback, and a follow-up question."""
        if not student_answer or len(student_answer.strip()) < 5:
            return {
                "communication_score": 30,
                "relevance_score": 25,
                "confidence_score": 35,
                "answer_quality_score": 30,
                "overall_score": 30,
                "feedback": "Answer was too brief or empty. Please elaborate with technical specifics and practical examples.",
                "follow_up": "Could you provide a detailed example from a recent project?"
            }

        # Try live Gemini if API key is provided
        if self.api_key:
            try:
                prompt = f"""
                You are a senior hiring manager and tech interviewer conducting a {interview_type} placement interview.
                Question: {question}
                Student Answer: {student_answer}

                Evaluate the student's answer accurately. Respond ONLY in valid JSON matching this exact schema:
                {{
                    "communication_score": (integer 0-100),
                    "relevance_score": (integer 0-100),
                    "confidence_score": (integer 0-100),
                    "answer_quality_score": (integer 0-100),
                    "overall_score": (integer 0-100),
                    "feedback": "(2-3 sentences of constructive feedback highlighting strengths and what to improve)",
                    "follow_up": "(a relevant technical or behavioral follow-up question)"
                }}
                """
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.3}
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        text_resp = data["candidates"][0]["content"]["parts"][0]["text"]
                        json_match = re.search(r'\{.*\}', text_resp, re.DOTALL)
                        if json_match:
                            return json.loads(json_match.group(0))
            except Exception as e:
                # Log and fallback gracefully
                print(f"[AI Service] Gemini call failed, using heuristic engine: {e}")

        # Heuristic Rubric Engine (High-quality offline intelligence)
        words = student_answer.strip().split()
        word_count = len(words)
        
        # Communication scoring based on structure and length
        if word_count < 15:
            comm_score = 55
            conf_score = 60
        elif word_count < 40:
            comm_score = 75
            conf_score = 72
        elif word_count < 120:
            comm_score = 85
            conf_score = 82
        else:
            comm_score = 88
            conf_score = 85

        # Relevance scoring based on question keywords
        q_keywords = set(re.findall(r'\b\w{4,}\b', question.lower()))
        ans_keywords = set(re.findall(r'\b\w{4,}\b', student_answer.lower()))
        overlap = len(q_keywords.intersection(ans_keywords))
        
        relevance_score = min(92, max(60, 65 + overlap * 7))
        quality_score = int((comm_score * 0.4) + (relevance_score * 0.6))
        overall = int((comm_score + relevance_score + conf_score + quality_score) / 4)

        # Contextual feedback and follow-up
        if "process" in question.lower() or "thread" in question.lower():
            feedback = "Your answer provides a good structural distinction between memory spaces and execution units. To elevate your score, explicitly explain mutex synchronization and race condition prevention."
            follow_up = "How would you handle a race condition where multiple threads try to update a shared bank balance simultaneously?"
        elif "database" in question.lower() or "schema" in question.lower():
            feedback = "Solid relational thinking. Make sure to clearly specify index selections for read-heavy tables and referential integrity constraints."
            follow_up = "When would you prefer a NoSQL document database like MongoDB over PostgreSQL for this schema?"
        elif "yourself" in question.lower():
            feedback = "Good introduction. Make sure to structure your pitch with Past (education), Present (core skills and projects), and Future (why this role excites you)."
            follow_up = "Which software project that you built taught you the most significant technical lesson?"
        else:
            feedback = f"Good technical relevance ({relevance_score}%). Your articulation is clear. Practice incorporating the STAR framework (Situation, Task, Action, Result) with measurable metrics."
            follow_up = "Can you share a specific challenge you encountered while implementing this and how you resolved it?"

        return {
            "communication_score": comm_score,
            "relevance_score": relevance_score,
            "confidence_score": conf_score,
            "answer_quality_score": quality_score,
            "overall_score": overall,
            "feedback": feedback,
            "follow_up": follow_up
        }

    async def analyze_resume(
        self,
        resume_text: str,
        target_role: str = "Full Stack Software Engineer"
    ) -> Dict[str, Any]:
        """Performs deep ATS resume analysis, skill extraction, keyword matching, and gap diagnosis."""
        if not resume_text or len(resume_text.strip()) < 30:
            return {
                "resume_score": 40,
                "extracted_skills": ["General Basics"],
                "missing_skills": ["Data Structures", "System Design", "Databases", "APIs", "Git"],
                "strengths": ["Basic format provided"],
                "improvements": ["Add detailed technical projects", "Quantify achievements with numbers", "Specify technology stack used"],
                "formatting_score": 50,
                "role_relevance": 45
            }

        # Check for technical keywords
        tech_dictionary = [
            "Python", "JavaScript", "TypeScript", "Java", "C++", "C", "HTML", "CSS", "React",
            "Node.js", "Express", "FastAPI", "Django", "SQL", "PostgreSQL", "MySQL", "MongoDB",
            "Git", "GitHub", "Docker", "AWS", "Linux", "REST", "API", "DSA", "Data Structures",
            "Algorithms", "OOP", "Unit Testing", "CI/CD", "Tailwind", "Next.js"
        ]
        
        extracted = []
        lower_resume = resume_text.lower()
        for tech in tech_dictionary:
            if re.search(r'\b' + re.escape(tech.lower()) + r'\b', lower_resume):
                extracted.append(tech)

        role_requirements = {
            "Full Stack Software Engineer": ["React", "JavaScript", "Python", "SQL", "Git", "REST", "Data Structures"],
            "Frontend Developer": ["HTML", "CSS", "JavaScript", "React", "TypeScript", "Tailwind", "Git"],
            "Backend Developer": ["Python", "Java", "SQL", "PostgreSQL", "Docker", "REST", "Data Structures", "Git"],
            "Data Engineer": ["Python", "SQL", "PostgreSQL", "MongoDB", "Linux", "Git", "Algorithms"]
        }

        required_skills = role_requirements.get(target_role, role_requirements["Full Stack Software Engineer"])
        missing = [skill for skill in required_skills if skill not in extracted]
        match_count = len(required_skills) - len(missing)
        role_relevance = int((match_count / max(1, len(required_skills))) * 100)

        # Check sections presence
        has_education = any(w in lower_resume for w in ["education", "b.tech", "degree", "university", "college"])
        has_projects = any(w in lower_resume for w in ["project", "developed", "built", "implemented"])
        has_metrics = bool(re.search(r'\b\d+%\b|\b\d+x\b|\b\$\d+\b|\bincreased\b|\breduced\b', lower_resume))

        formatting_score = 70
        if has_education: formatting_score += 10
        if has_projects: formatting_score += 10
        if has_metrics: formatting_score += 10
        formatting_score = min(100, formatting_score)

        # Calculate final ATS Score
        resume_score = int((role_relevance * 0.5) + (formatting_score * 0.3) + (min(len(extracted) * 5, 20)))
        resume_score = min(95, max(45, resume_score))

        strengths = []
        improvements = []

        if len(extracted) >= 4:
            strengths.append(f"Identified strong foundational skills: {', '.join(extracted[:4])}.")
        if has_projects:
            strengths.append("Contains project portfolio sections that demonstrate applied problem solving.")
        if has_education:
            strengths.append("Clear educational credentials visible.")

        if missing:
            improvements.append(f"Missing essential keywords for {target_role}: {', '.join(missing[:3])}.")
        if not has_metrics:
            improvements.append("Use the Google X-Y-Z formula: 'Accomplished [X] as measured by [Y], by doing [Z]'.")
        improvements.append("Ensure your GitHub and LinkedIn profile links are clickable and active.")

        return {
            "resume_score": resume_score,
            "extracted_skills": extracted if extracted else ["Foundational Computing"],
            "missing_skills": missing if missing else ["Cloud Deployment (Docker/AWS)", "CI/CD Pipelines"],
            "strengths": strengths if strengths else ["Good baseline resume structure"],
            "improvements": improvements,
            "formatting_score": formatting_score,
            "role_relevance": role_relevance,
            "recommended_skills": missing[:4]
        }

    def analyze_assessment_gaps(self, category_scores: Dict[str, float]) -> Dict[str, Any]:
        """Diagnoses strong and weak areas from assessment results."""
        strong_skills = []
        weak_skills = []
        recommended_topics = []

        for category, score in category_scores.items():
            if score >= 75:
                strong_skills.append(category)
            else:
                weak_skills.append(category)
                if category in ["SQL", "Database"]:
                    recommended_topics.extend(["SQL JOINs & Normalization", "Subqueries & Indexing"])
                elif category in ["Python", "Programming"]:
                    recommended_topics.extend(["Python List Comprehensions & OOP", "Memory Optimization"])
                elif category in ["Data Structures", "DSA"]:
                    recommended_topics.extend(["Two-Pointer Techniques", "Binary Tree Traversal", "Sorting Algorithms"])
                elif category in ["Aptitude", "Quantitative Aptitude"]:
                    recommended_topics.extend(["Percentages & Speed Math", "Time, Speed & Distance"])
                elif category in ["Verbal Ability", "Communication"]:
                    recommended_topics.extend(["Professional Technical Vocabulary", "STAR Interview Framing"])
                else:
                    recommended_topics.append(f"{category} Fundamentals & Practice Questions")

        if not weak_skills:
            weak_skills = ["Advanced System Design", "Microservices"]
            recommended_topics = ["Distributed Systems Overview", "Cache Invalidation & Redis"]

        return {
            "strong_skills": strong_skills,
            "weak_skills": weak_skills,
            "recommended_skills": weak_skills[:3],
            "recommended_topics": list(dict.fromkeys(recommended_topics))[:4]
        }

ai_service = AIService()
