from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.core.config import settings
from app.routers import (
    auth, profile, dashboard, assessments, roadmap,
    content, youtube, interview, resume, recommendations, admin, coach
)
import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("placement_launchpad")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Modern Placement Launchpad - AI-Powered Placement Preparation Platform Backend"
)

# Enable CORS for frontend Vite dev server and production origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local testing and dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Safe Exception Handler (Zero stack trace leakage in production)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal server error occurred. Please try again later.",
            "code": "INTERNAL_SERVER_ERROR"
        }
    )

# Structured Request Validation Handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Invalid request payload or parameters.",
            "code": "VALIDATION_ERROR",
            "errors": [{"field": ".".join(str(loc) for loc in err.get("loc", [])), "message": err.get("msg")} for err in exc.errors()]
        }
    )

# Mount all domain routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(profile.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(assessments.router, prefix=settings.API_V1_STR)
app.include_router(roadmap.router, prefix=settings.API_V1_STR)
app.include_router(content.router, prefix=settings.API_V1_STR)
app.include_router(youtube.router, prefix=settings.API_V1_STR)
app.include_router(interview.router, prefix=settings.API_V1_STR)
app.include_router(resume.router, prefix=settings.API_V1_STR)
app.include_router(recommendations.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(coach.router, prefix=settings.API_V1_STR)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database_layer": "separated_modular_repositories",
        "ai_engine": "ready",
        "youtube_service": "ready",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
    }

@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API Gateway",
        "docs": "/docs",
        "health": "/api/health"
    }
