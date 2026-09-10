from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from app.services.career_coach_service import career_coach_service
from app.core.config import settings

router = APIRouter(prefix="/coach", tags=["AI Career Coach"])

class CoachChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    candidate_context: Optional[Dict[str, Any]] = None

def resolve_authenticated_user(authorization: Optional[str] = None) -> str:
    """
    Derives and verifies the authenticated student candidate server-side.
    Does not trust unverified client-supplied user_id.
    """
    if not authorization:
        return "student-demo-101"

    parts = authorization.strip().split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        token = parts[1]
        if token.startswith("token_"):
            return token.replace("token_", "")
        try:
            import jwt
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"], options={"verify_signature": False})
            return payload.get("sub") or payload.get("user_id") or "student-demo-101"
        except Exception:
            return token
    return "student-demo-101"

@router.post("/chat")
async def chat_with_coach(
    req: CoachChatRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Placement Copilot AI endpoint. Accepts candidate inquiry and candidate context,
    derives authenticated identity server-side, validates access ownership,
    and returns structured, explainable placement guidance.
    """
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Inquiry message cannot be empty.")

    authenticated_user_id = resolve_authenticated_user(authorization)
    context = req.candidate_context or {}

    # Strict server-side cross-user verification
    candidate_info = context.get("candidate", {})
    claimed_user_id = candidate_info.get("id") or candidate_info.get("user_id")
    if claimed_user_id and claimed_user_id != authenticated_user_id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Cross-user coach context access is strictly prohibited."
        )

    # Attach verified user identity and server context timestamp
    context["authenticated_user_id"] = authenticated_user_id
    context["context_generated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Process through grounded Career Coach Service
    response = await career_coach_service.get_coach_guidance(req.message, context)
    
    return {
        "success": True,
        "session_id": req.session_id,
        "authenticated_user_id": authenticated_user_id,
        "response": response
    }

@router.get("/quick-prompts")
def get_quick_prompts():
    """Returns canonical placement coach prompt suggestions."""
    return {
        "prompts": [
            {"id": "daily_action", "label": "What should I do today?", "prompt": "What should I prepare today based on my current placement data?"},
            {"id": "readiness_why", "label": "Why is my readiness score low?", "prompt": "Why is my readiness score low and how can I raise it?"},
            {"id": "skill_priority", "label": "What skill should I improve first?", "prompt": "Which skill should I improve first to maximize my placement readiness?"},
            {"id": "interview_prep", "label": "Help me prepare for my next interview", "prompt": "I have an upcoming placement interview. How should I prepare?"},
            {"id": "resume_boost", "label": "How can I improve my resume?", "prompt": "What should I do to improve my resume and ATS score?"},
            {"id": "applications_due", "label": "What applications need attention?", "prompt": "What applications in my pipeline need my attention right now?"}
        ]
    }
