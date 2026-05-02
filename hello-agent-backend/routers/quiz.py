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
    from models.study_log import StudyLog
    for fb in result.get("feedback", []):
        if not fb["is_correct"]:
            for q in matched_questions:
                if q.get("id") == fb["question_id"]:
                    db.add(StudyLog(user_id=req.user_id, action_type="wrong_answer", chapter_id=chapter_id, node_id=fb["question_id"], details=json.dumps({"question": q.get("question",""), "user_answer": req.answers.get(fb["question_id"], -1), "correct_index": fb["correct_index"], "explanation": fb["explanation"]}, ensure_ascii=False)))
    achievements = GamificationService.check_achievements(req.user_id, "quiz_submit", {"is_perfect": result["is_perfect"]}, db, loader)
    db.commit()
    return QuizResult(score=round(result["score"] * 100, 1), total_questions=result["total_questions"], correct_count=result["correct_count"], is_perfect=result["is_perfect"], xp_awarded=xp_awarded, feedback=result["feedback"], new_level_up=xp_result["level_up"], new_level=xp_result["new_level"], unlocked_achievements=[{"id": a["id"], "name": a["name"], "emoji": a["emoji"]} for a in achievements])


@router.get("/history/{user_id}")
def quiz_history(user_id: int, db: Session = Depends(get_db)):
    records = db.query(QuizRecord).filter(QuizRecord.user_id == user_id).order_by(QuizRecord.created_at.desc()).limit(20).all()
    return [{"id": r.id, "quiz_id": r.quiz_id, "chapter_id": r.chapter_id, "score": round(r.score * 100, 1), "is_perfect": r.is_perfect, "created_at": str(r.created_at)} for r in records]


@router.get("/wrong-answers/{user_id}")
def wrong_answers(user_id: int, db: Session = Depends(get_db)):
    from models.study_log import StudyLog
    wrong = db.query(StudyLog).filter(StudyLog.user_id == user_id, StudyLog.action_type == "wrong_answer").order_by(StudyLog.created_at.desc()).all()
    results = []
    for w in wrong:
        try:
            d = json.loads(w.details) if w.details else {}
            results.append({"id": w.id, "question": d.get("question",""), "correct_index": d.get("correct_index",0), "explanation": d.get("explanation",""), "created_at": str(w.created_at)})
        except: pass
    return results
