from fastapi import APIRouter, Query
from app.services.youtube_service import youtube_service

router = APIRouter(prefix="/youtube", tags=["YouTube"])

@router.get("/search")
async def search_videos(q: str = Query(..., description="Topic or technology to find educational videos for")):
    results = await youtube_service.search_videos(q)
    return results

@router.get("/topic/{topic_name}")
async def get_topic_videos(topic_name: str):
    results = await youtube_service.search_videos(topic_name)
    return results
