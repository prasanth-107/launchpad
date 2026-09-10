import json
import uuid
import datetime
from typing import Dict, List, Optional, Any
from app.db.seed_data import CONTENT_DATABASE_SEED, ASSESSMENT_QUESTIONS_SEED, INTERVIEW_QUESTIONS_SEED

# 1. USER DATABASE
class UserDatabase:
    """Stores student profiles, credentials, career goals, and target roles."""
    def __init__(self):
        self.users: Dict[str, Dict[str, Any]] = {}
        # Seed a default demo student
        demo_id = "student-demo-101"
        self.users[demo_id] = {
            "id": demo_id,
            "name": "Alex Chen",
            "email": "alex.chen@university.edu",
            "password_hash": "demo_password_hash",
            "college": "Stanford Institute of Technology",
            "department": "Computer Science & Engineering",
            "year": "3rd Year",
            "skills": ["Python", "JavaScript", "HTML/CSS", "SQL", "Git"],
            "programming_languages": ["Python", "JavaScript", "C++"],
            "career_goal": "Become a Software Development Engineer (SDE) at a Tier-1 tech company",
            "preferred_job_role": "Full Stack Software Engineer",
            "resume_text": "Alex Chen\nB.Tech Computer Science\nSkills: Python, React, SQL, Git\nProjects: E-commerce web app using React and FastAPI. Real-time chat application with WebSockets.",
            "created_at": datetime.datetime.utcnow().isoformat()
        }

    def get_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        return self.users.get(user_id)

    def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        for user in self.users.values():
            if user.get("email", "").lower() == email.lower():
                return user
        return None

    def create(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        user_id = user_data.get("id") or str(uuid.uuid4())
        user_data["id"] = user_id
        if "created_at" not in user_data:
            user_data["created_at"] = datetime.datetime.utcnow().isoformat()
        self.users[user_id] = user_data
        return user_data

    def update(self, user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if user_id in self.users:
            self.users[user_id].update(updates)
            return self.users[user_id]
        return None

    def all_users(self) -> List[Dict[str, Any]]:
        return list(self.users.values())

# 2. ASSESSMENT DATABASE
class AssessmentDatabase:
    """Stores question banks, attempts, submissions, and detailed question breakdown."""
    def __init__(self):
        self.questions: List[Dict[str, Any]] = list(ASSESSMENT_QUESTIONS_SEED)
        self.attempts: Dict[str, Dict[str, Any]] = {}

    def get_questions_by_category(self, category: str) -> List[Dict[str, Any]]:
        cat_lower = category.strip().lower()
        if not cat_lower or cat_lower == "all":
            return self.questions
        
        # Category alias groups
        category_aliases = {
            "web development": ["javascript", "html", "css", "web development", "react"],
            "database": ["sql", "database", "relational"],
            "aptitude": ["quantitative aptitude", "logical reasoning", "verbal ability", "aptitude"],
            "programming": ["python", "java", "c++", "c", "programming"],
            "data structures": ["data structures", "algorithms", "dsa"]
        }

        target_matches = category_aliases.get(cat_lower, [cat_lower])

        matched = []
        for q in self.questions:
            q_cat = q.get("category", "").lower()
            q_skill = q.get("skill", "").lower()
            if any(target in q_cat or target in q_skill or q_cat in target for target in target_matches):
                matched.append(q)
            elif cat_lower in q_cat or cat_lower in q_skill:
                matched.append(q)

        return matched if matched else [q for q in self.questions if q.get("category", "").lower() == cat_lower]

    def get_all_categories(self) -> List[str]:
        return sorted(list(set(q.get("category", "") for q in self.questions if q.get("category"))))

    def get_question(self, question_id: str) -> Optional[Dict[str, Any]]:
        for q in self.questions:
            if q.get("id") == question_id:
                return q
        return None

    def add_question(self, question_data: Dict[str, Any]) -> Dict[str, Any]:
        if "id" not in question_data:
            question_data["id"] = "q_" + str(uuid.uuid4())[:8]
        self.questions.append(question_data)
        return question_data

    def save_attempt(self, attempt_data: Dict[str, Any]) -> Dict[str, Any]:
        attempt_id = attempt_data.get("id") or str(uuid.uuid4())
        attempt_data["id"] = attempt_id
        attempt_data["timestamp"] = datetime.datetime.utcnow().isoformat()
        self.attempts[attempt_id] = attempt_data
        return attempt_data

    def get_user_attempts(self, user_id: str) -> List[Dict[str, Any]]:
        return [att for att in self.attempts.values() if att.get("user_id") == user_id]

# 3. LEARNING DATABASE
class LearningDatabase:
    """Stores personalized learning paths, roadmap stages, topic nodes, and student completions."""
    def __init__(self):
        self.user_roadmaps: Dict[str, List[Dict[str, Any]]] = {}
        self.completed_topics: Dict[str, List[str]] = {
            "student-demo-101": ["python_basics", "sql_queries"]
        }

    def get_roadmap(self, user_id: str) -> List[Dict[str, Any]]:
        if user_id in self.user_roadmaps:
            return self.user_roadmaps[user_id]
        
        # Default canonical placement preparation roadmap sequence:
        # Python -> SQL -> Data Structures -> Web Development -> Aptitude -> Communication -> Mock Interview -> Placement Ready
        default_roadmap = [
            {
                "id": "node_python",
                "step": 1,
                "title": "Python & Problem Solving",
                "category": "Programming",
                "description": "Master core syntax, data structures (lists, dicts), comprehension, and algorithmic functions.",
                "topics": ["Python Syntax", "Lists & Tuples", "Dictionaries & Sets", "Recursion Basics"],
                "targetHours": 15,
                "resourcesCount": 3,
                "videosCount": 2,
                "completed": "python_basics" in self.completed_topics.get(user_id, [])
            },
            {
                "id": "node_sql",
                "step": 2,
                "title": "SQL & Relational Databases",
                "category": "Database",
                "description": "Essential relational modeling, normalization, multi-table JOINs, subqueries, and aggregation.",
                "topics": ["SELECT & Filtering", "INNER & OUTER JOINs", "GROUP BY & HAVING", "Subqueries", "Indexing"],
                "targetHours": 12,
                "resourcesCount": 3,
                "videosCount": 2,
                "completed": "sql_queries" in self.completed_topics.get(user_id, [])
            },
            {
                "id": "node_dsa",
                "step": 3,
                "title": "Data Structures & Core Algorithms",
                "category": "Data Structures",
                "description": "Arrays, Linked Lists, Stacks, Queues, Binary Trees, and sorting algorithms frequently tested in campus rounds.",
                "topics": ["Two-Pointer Technique", "Linked List Inversion", "Stack Applications", "Binary Tree Traversal", "Binary Search"],
                "targetHours": 25,
                "resourcesCount": 3,
                "videosCount": 2,
                "completed": False
            },
            {
                "id": "node_web",
                "step": 4,
                "title": "Web Development (HTML/CSS/JS/React)",
                "category": "Web Development",
                "description": "Full stack foundations, REST APIs, asynchronous programming, and frontend component states.",
                "topics": ["Modern JavaScript ES6+", "DOM Manipulation", "Async/Await & Fetch", "React Components & Hooks"],
                "targetHours": 20,
                "resourcesCount": 3,
                "videosCount": 2,
                "completed": False
            },
            {
                "id": "node_aptitude",
                "step": 5,
                "title": "Aptitude & Logical Reasoning",
                "category": "Aptitude",
                "description": "Master speed math, quantitative problem solving, puzzles, and verbal reasoning required for initial screening rounds.",
                "topics": ["Percentages & Profit/Loss", "Time, Speed & Distance", "Logical Puzzles", "Syllogisms & Data Interpretation"],
                "targetHours": 14,
                "resourcesCount": 2,
                "videosCount": 1,
                "completed": False
            },
            {
                "id": "node_communication",
                "step": 6,
                "title": "Communication & HR Presentation",
                "category": "Communication",
                "description": "Refine introduction, active listening, executive framing, and behavioral storytelling using STAR framework.",
                "topics": ["Elevator Pitch", "STAR Method Storytelling", "Active Listening", "Handling Tricky Questions"],
                "targetHours": 8,
                "resourcesCount": 2,
                "videosCount": 1,
                "completed": False
            },
            {
                "id": "node_mock_interview",
                "step": 7,
                "title": "AI Mock Interview Simulations",
                "category": "Interview Simulation",
                "description": "Complete interactive role-based technical and HR interviews with real-time AI critique and speech analysis.",
                "topics": ["Technical Deep Dive", "System Thinking", "HR Culture Fit", "Speech Fluency"],
                "targetHours": 10,
                "resourcesCount": 2,
                "videosCount": 2,
                "completed": False
            },
            {
                "id": "node_job_ready",
                "step": 8,
                "title": "Placement Ready 🎯",
                "category": "Milestone",
                "description": "Final readiness evaluation, resume ATS polish, and direct placement drive applications.",
                "topics": ["Portfolio Review", "Resume ATS Verification", "Placement Drive Strategies"],
                "targetHours": 5,
                "resourcesCount": 2,
                "videosCount": 1,
                "completed": False
            }
        ]
        self.user_roadmaps[user_id] = default_roadmap
        return default_roadmap

    def toggle_topic_completion(self, user_id: str, node_id: str) -> bool:
        roadmap = self.get_roadmap(user_id)
        for node in roadmap:
            if node["id"] == node_id:
                node["completed"] = not node["completed"]
                # update completed topics
                if user_id not in self.completed_topics:
                    self.completed_topics[user_id] = []
                if node["completed"] and node_id not in self.completed_topics[user_id]:
                    self.completed_topics[user_id].append(node_id)
                elif not node["completed"] and node_id in self.completed_topics[user_id]:
                    self.completed_topics[user_id].remove(node_id)
                return node["completed"]
        return False

    def get_progress_percentage(self, user_id: str) -> int:
        roadmap = self.get_roadmap(user_id)
        if not roadmap:
            return 0
        completed = sum(1 for node in roadmap if node.get("completed"))
        return int((completed / len(roadmap)) * 100)

# 4. INTERVIEW DATABASE
class InterviewDatabase:
    """Stores interview sessions, question logs, audio transcripts, and AI evaluation rubrics."""
    def __init__(self):
        self.sessions: Dict[str, Dict[str, Any]] = {}
        # Seed one past interview for the demo student
        demo_session_id = "session-demo-501"
        self.sessions[demo_session_id] = {
            "id": demo_session_id,
            "user_id": "student-demo-101",
            "type": "Technical Interview",
            "role": "Full Stack Software Engineer",
            "timestamp": (datetime.datetime.utcnow() - datetime.timedelta(days=2)).isoformat(),
            "questions": [
                {
                    "question": "Can you explain the difference between a Process and a Thread, and how IPC works?",
                    "student_answer": "A process is an executing program instance with its own isolated memory space. A thread is a lightweight execution unit inside a process that shares the heap with other threads. IPC happens through pipes, message queues, and shared memory.",
                    "evaluation": {
                        "communication_score": 75,
                        "relevance_score": 82,
                        "confidence_score": 70,
                        "answer_quality_score": 78,
                        "overall_score": 77,
                        "feedback": "Your answer is clear and relevant. Good distinction between memory isolation and thread shared memory. To improve, mention race conditions and synchronization primitives like mutexes.",
                        "follow_up": "How would you prevent two threads from modifying the same data simultaneously in Python or Java?"
                    }
                }
            ],
            "average_score": 77
        }

    def create_session(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        session_id = session_data.get("id") or str(uuid.uuid4())
        session_data["id"] = session_id
        session_data["timestamp"] = datetime.datetime.utcnow().isoformat()
        if "questions" not in session_data:
            session_data["questions"] = []
        self.sessions[session_id] = session_data
        return session_data

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        return self.sessions.get(session_id)

    def add_exchange(self, session_id: str, exchange: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if session_id in self.sessions:
            self.sessions[session_id]["questions"].append(exchange)
            # Recompute average
            scores = [q["evaluation"]["overall_score"] for q in self.sessions[session_id]["questions"] if "evaluation" in q]
            if scores:
                self.sessions[session_id]["average_score"] = int(sum(scores) / len(scores))
            return self.sessions[session_id]
        return None

    def get_user_sessions(self, user_id: str) -> List[Dict[str, Any]]:
        return [s for s in self.sessions.values() if s.get("user_id") == user_id]

# 5. CONTENT DATABASE
class ContentDatabase:
    """Stores structured learning resources, authentic documentation links, and video lists."""
    def __init__(self):
        self.categories = CONTENT_DATABASE_SEED

    def get_all_content(self) -> Dict[str, Any]:
        return self.categories

    def get_category_content(self, category_key: str) -> List[Dict[str, Any]]:
        return self.categories.get(category_key, [])

    def add_resource_to_topic(self, topic_id: str, resource: Dict[str, Any]) -> bool:
        for cat_list in self.categories.values():
            for topic in cat_list:
                if topic.get("id") == topic_id:
                    topic["resources"].append(resource)
                    return True
        return False

    def add_topic(self, category_key: str, topic_data: Dict[str, Any]) -> bool:
        if category_key in self.categories:
            self.categories[category_key].append(topic_data)
            return True
        return False

# 6. ANALYTICS DATABASE
class AnalyticsDatabase:
    """Stores placement readiness scores, component dimensions, and platform usage metrics."""
    def __init__(self):
        self.user_readiness_cache: Dict[str, Dict[str, Any]] = {
            "student-demo-101": {
                "placement_readiness": 73,
                "status": "Almost Ready",
                "technical_score": 80,
                "aptitude_score": 72,
                "communication_score": 65,
                "interview_score": 75,
                "resume_score": 70,
                "learning_progress": 38,
                "weak_skills": ["SQL", "Communication", "Verbal Ability"],
                "strong_skills": ["Python", "JavaScript", "HTML/CSS"],
                "recommended_next_step": "Improve SQL and Communication to increase your placement readiness to 85%+.",
                "recommended_topics": [
                    "SQL Subqueries & Window Functions",
                    "STAR Behavioral Interview Practice",
                    "Data Structures: Binary Trees & Graphs"
                ],
                "last_calculated": datetime.datetime.utcnow().isoformat()
            }
        }
        self.platform_stats = {
            "total_registered_students": 1420,
            "assessments_completed": 3890,
            "mock_interviews_conducted": 1240,
            "resumes_analyzed": 960,
            "average_readiness_score": 68.4
        }

    def get_user_readiness(self, user_id: str) -> Optional[Dict[str, Any]]:
        return self.user_readiness_cache.get(user_id)

    def set_user_readiness(self, user_id: str, data: Dict[str, Any]) -> None:
        data["last_calculated"] = datetime.datetime.utcnow().isoformat()
        self.user_readiness_cache[user_id] = data

    def get_platform_stats(self) -> Dict[str, Any]:
        return self.platform_stats

# Singleton instances of each separated database
user_db = UserDatabase()
assessment_db = AssessmentDatabase()
learning_db = LearningDatabase()
interview_db = InterviewDatabase()
content_db = ContentDatabase()
analytics_db = AnalyticsDatabase()
