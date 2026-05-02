from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from schemas.tutor import TutorRequest
from services.ai_tutor import AITutorService
from services.content_loader import ContentLoader
from models.user import User
from database import SessionLocal
import config
import json

router = APIRouter()
tutor_service = AITutorService()


@router.post("/ask")
async def ask_tutor(req: TutorRequest):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == req.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        loader = ContentLoader(config.DATA_DIR)
        context = req.context or {}
        if context.get("chapter_id"):
            ch = loader.get_chapter(context["chapter_id"])
            if ch:
                context["chapter_title"] = ch["title"]
        if context.get("stage_id"):
            stage = loader.get_stage(context["stage_id"])
            if stage:
                context["stage_title"] = stage["title"]
        context.setdefault("user_level", user.level)
        context.setdefault("user_xp", user.xp)
        response = await tutor_service.ask(req.question, context)
        return {"answer": response, "user_id": req.user_id}
    finally:
        db.close()


@router.post("/ask/stream")
async def ask_tutor_stream(req: TutorRequest):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == req.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        loader = ContentLoader(config.DATA_DIR)
        context = req.context or {}
        if context.get("chapter_id"):
            ch = loader.get_chapter(context["chapter_id"])
            if ch:
                context["chapter_title"] = ch["title"]
        if context.get("stage_id"):
            stage = loader.get_stage(context["stage_id"])
            if stage:
                context["stage_title"] = stage["title"]
        context.setdefault("user_level", user.level)
        context.setdefault("user_xp", user.xp)

        async def generate():
            async for chunk in tutor_service.ask_stream(req.question, context):
                yield f"data: {json.dumps({'content': chunk})}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(generate(), media_type="text/event-stream")
    finally:
        db.close()
