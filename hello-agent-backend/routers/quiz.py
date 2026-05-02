from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.quiz_record import QuizRecord
from services.content_loader import ContentLoader
from services.quiz_engine import QuizEngine
from services.gamification import GamificationService
from schemas.quiz import QuizData, QuizQuestion, QuizSubmitRequest, QuizResult
import config
import json

router = APIRouter()


@router.get("/{stage_id}")
def get_quiz(stage_id: str, user_id: int = None, db: Session = Depends(get_db)):
    loader = ContentLoader(config.DATA_DIR)
    stage = loader.get_stage(stage_id)
    if not stage:
        raise HTTPException(status_code=404, detail="关卡不存在")
    quiz_info = stage.get("quiz", {})
    quiz_id = quiz_info.get("quiz_id", f"quiz-{stage_id}")
    questions_data = loader.get_stage_quiz_questions(stage_id)
    if not questions_data:
        raise HTTPException(status_code=404, detail="该关卡暂无测验题")
    questions = []
    for q in questions_data:
        questions.append(QuizQuestion(
            id=q["id"],
            type=q["type"],
            question=q["question"],
            options=q["options"],
        ))
    return QuizData(quiz_id=quiz_id, stage_id=stage_id, questions=questions)


@router.post("/submit", response_model=QuizResult)
def submit_quiz(req: QuizSubmitRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    loader = ContentLoader(config.DATA_DIR)
    GamificationService.update_streak(user, db)
    questions = []
    for key, q_data in loader.quizzes.items():
        if isinstance(q_data, list):
            questions.extend(q_data)
        elif isinstance(q_data, dict):
            questions.append(q_data)
    matched_questions = [q for q in questions if q.get("quiz_id") == req.quiz_id]
    if not matched_questions:
        # Try stage-level match
        matched_questions = loader.get_stage_quiz_questions(req.quiz_id.replace("quiz-", ""))
    if not matched_questions:
        raise HTTPException(status_code=404, detail="未找到测验题")
    result = QuizEngine.grade_submission(matched_questions, req.answers)
    xp_awarded = GamificationService.XP_REWARDS["pass_quiz"]
    if result["is_perfect"]:
        xp_awarded += GamificationService.XP_REWARDS["perfect_quiz_bonus"]
    xp_result = GamificationService.award_xp(user, xp_awarded, "完成测验", db)
    stage_id = matched_questions[0].get("stage_id", "")
    chapter_id = 0
    if stage_id:
        stage = loader.get_stage(stage_id)
        if stage:
            chapter_id = stage.get("chapter_id", 0)
    record = QuizRecord(
        user_id=req.user_id,
        quiz_id=req.quiz_id,
        chapter_id=chapter_id,
        answers=json.dumps(req.answers, ensure_ascii=False),
        score=result["score"],
        is_perfect=result["is_perfect"],
        time_spent_seconds=req.time_spent_seconds,
    )
    db.add(record)
    achievements = GamificationService.check_achievements(
        req.user_id, "quiz_submit", {"is_perfect": result["is_perfect"]}, db, loader
    )
    db.commit()
    return QuizResult(
        score=round(result["score"] * 100, 1),
        total_questions=result["total_questions"],
        correct_count=result["correct_count"],
        is_perfect=result["is_perfect"],
        xp_awarded=xp_awarded,
        feedback=result["feedback"],
        new_level_up=xp_result["level_up"],
        new_level=xp_result["new_level"],
        unlocked_achievements=[{"id": a["id"], "name": a["name"], "emoji": a["emoji"]} for a in achievements],
    )
