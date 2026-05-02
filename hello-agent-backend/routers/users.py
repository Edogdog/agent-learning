from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.study_progress import StudyProgress
from models.quiz_record import QuizRecord
from models.achievement import Achievement
from schemas.user import UserStats
from services.gamification import GamificationService
from services.content_loader import ContentLoader
import config

router = APIRouter()


@router.get("/{user_id}/progress")
def get_progress(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    loader = ContentLoader(config.DATA_DIR)
    chapters = []
    for ch in loader.get_all_chapters():
        ch_progress = db.query(StudyProgress).filter(
            StudyProgress.user_id == user_id,
            StudyProgress.chapter_id == ch["id"],
        ).all()
        completed_nodes = sum(1 for p in ch_progress if p.status == "completed" and p.node_id)
        total_nodes = sum(len(s.get("nodes", [])) for s in loader.get_chapter_stages(ch["id"]))
        status = "locked"
        if completed_nodes > 0:
            status = "completed" if completed_nodes >= total_nodes else "in_progress"
        elif ch["id"] == 1:
            status = "unlocked"
        else:
            prev_ch = db.query(StudyProgress).filter(
                StudyProgress.user_id == user_id,
                StudyProgress.chapter_id == ch["id"] - 1,
            ).first()
            if prev_ch:
                status = "unlocked"
        chapters.append({
            "chapter_id": ch["id"],
            "title": ch["title"],
            "status": status,
            "completion_percent": round(completed_nodes / total_nodes * 100, 1) if total_nodes > 0 else 0,
            "completed_nodes": completed_nodes,
            "total_nodes": total_nodes,
        })
    return {"user_id": user_id, "chapters": chapters}


@router.get("/{user_id}/stats", response_model=UserStats)
def get_stats(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    level_info = GamificationService.calculate_level(user.xp)
    quizzes_completed = db.query(QuizRecord).filter(QuizRecord.user_id == user_id).count()
    perfect_quizzes = db.query(QuizRecord).filter(
        QuizRecord.user_id == user_id, QuizRecord.is_perfect == True
    ).count()
    nodes_completed = db.query(StudyProgress).filter(
        StudyProgress.user_id == user_id, StudyProgress.status == "completed"
    ).count()
    total_seconds = db.query(StudyProgress).filter(
        StudyProgress.user_id == user_id
    ).with_entities(StudyProgress.time_spent_seconds).all()
    total_study = sum(t[0] or 0 for t in total_seconds)
    achievements = db.query(Achievement).filter(Achievement.user_id == user_id).all()
    achievement_list = [{"id": a.achievement_id, "unlocked_at": str(a.unlocked_at)} for a in achievements]
    return UserStats(
        level=level_info["level"],
        level_title=level_info["title"],
        level_emoji=level_info["emoji"],
        xp=user.xp,
        xp_to_next=GamificationService.xp_to_next_level(user.xp),
        xp_percent=round(GamificationService.xp_percent(user.xp) * 100, 1),
        streak_days=user.streak_days,
        total_study_seconds=total_study,
        quizzes_completed=quizzes_completed,
        perfect_quizzes=perfect_quizzes,
        nodes_completed=nodes_completed,
        achievements=achievement_list,
    )
