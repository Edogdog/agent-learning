from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.ai_teacher import AITeacherService
from services.content_loader import ContentLoader
from services.gamification import GamificationService
from models.user import User
from database import SessionLocal
import config

router = APIRouter()
teacher = AITeacherService()


class TeachRequest(BaseModel):
    user_id: int
    chapter_id: int = 0
    stage_id: str = ""
    node_id: str = ""
    user_message: str = ""


class QuizGenRequest(BaseModel):
    user_id: int
    chapter_id: int = 0
    node_id: str = ""
    difficulty: str = "easy"


class AnswerReviewRequest(BaseModel):
    user_id: int
    question: str
    user_answer: str
    correct_answer: str
    explanation: str


@router.post("/teach")
def teach_node(req: TeachRequest):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == req.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        loader = ContentLoader(config.DATA_DIR)
        context = {"user_level": user.level, "user_xp": user.xp}
        if req.chapter_id:
            ch = loader.get_chapter(req.chapter_id)
            if ch:
                context["chapter_id"] = req.chapter_id
                context["chapter_title"] = ch["title"]
        if req.stage_id:
            stage = loader.get_stage(req.stage_id)
            if stage:
                context["stage_id"] = req.stage_id
                context["stage_title"] = stage["title"]
                # Find the node content
                for node in stage.get("nodes", []):
                    if req.node_id and node["id"] == req.node_id:
                        context["node_id"] = req.node_id
                        context["node_title"] = node["title"]
                        context["node_content"] = node.get("content", "")
                        break
                    elif not req.node_id and node["order"] == 1:
                        context["node_id"] = node["id"]
                        context["node_title"] = node["title"]
                        context["node_content"] = node.get("content", "")
        result = teacher.teach(context, req.user_message)
        return result
    finally:
        db.close()


@router.post("/quiz/generate")
def generate_quiz(req: QuizGenRequest):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == req.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        loader = ContentLoader(config.DATA_DIR)
        context = {"user_level": user.level, "user_xp": user.xp}
        if req.chapter_id:
            ch = loader.get_chapter(req.chapter_id)
            if ch:
                context["chapter_id"] = req.chapter_id
                context["chapter_title"] = ch["title"]
        if req.node_id:
            for stage_id, stage in loader.stages.items():
                for node in stage.get("nodes", []):
                    if node["id"] == req.node_id:
                        context["node_id"] = req.node_id
                        context["node_title"] = node["title"]
                        context["node_content"] = node.get("content", "")
                        break
        result = teacher.generate_quiz(context, req.difficulty)
        return result
    finally:
        db.close()


@router.post("/review")
def review_answer(req: AnswerReviewRequest):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == req.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        result = teacher.review_answer(req.question, req.user_answer, req.correct_answer, req.explanation)
        if result.get("xp_reward", 0) > 0:
            GamificationService.award_xp(user, result["xp_reward"], "测验奖励", db)
        result["new_xp"] = user.xp
        result["new_level"] = user.level
        return result
    finally:
        db.close()
