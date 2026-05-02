from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.study_progress import StudyProgress
from services.content_loader import ContentLoader
from services.gamification import GamificationService
from schemas.chapter import NodeDetail, CompleteNodeRequest, CompleteNodeResponse
import config

router = APIRouter()


@router.get("/{stage_id}/nodes")
def get_stage_nodes(stage_id: str, user_id: int = None, db: Session = Depends(get_db)):
    loader = ContentLoader(config.DATA_DIR)
    stage = loader.get_stage(stage_id)
    if not stage:
        raise HTTPException(status_code=404, detail="关卡不存在")
    nodes = []
    prev_node_completed = True
    for i, n in enumerate(sorted(stage.get("nodes", []), key=lambda x: x["order"])):
        status = "locked"
        if user_id:
            progress = db.query(StudyProgress).filter(
                StudyProgress.user_id == user_id,
                StudyProgress.node_id == n["id"],
            ).first()
            if progress and progress.status == "completed":
                status = "completed"
            elif i == 0 or prev_node_completed:
                status = "unlocked"
                prev_node_completed = True
            prev_node_completed = status == "completed"
        elif i == 0:
            status = "unlocked"
        nodes.append(NodeDetail(
            id=n["id"],
            title=n["title"],
            content_type=n["content_type"],
            content=n["content"],
            order=n["order"],
            xp_reward=n["xp_reward"],
            status=status,
        ))
    return {"stage_id": stage_id, "nodes": nodes}


@router.post("/{stage_id}/complete-node", response_model=CompleteNodeResponse)
def complete_node(stage_id: str, req: CompleteNodeRequest, db: Session = Depends(get_db)):
    from models.user import User
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    loader = ContentLoader(config.DATA_DIR)
    GamificationService.update_streak(user, db)
    progress = db.query(StudyProgress).filter(
        StudyProgress.user_id == req.user_id,
        StudyProgress.node_id == req.node_id,
    ).first()
    if not progress:
        stage = loader.get_stage(stage_id)
        chapter_id = stage["chapter_id"] if stage else 0
        progress = StudyProgress(
            user_id=req.user_id,
            chapter_id=chapter_id,
            stage_id=stage_id,
            node_id=req.node_id,
            status="completed",
            completion_percent=100.0,
            time_spent_seconds=req.time_spent_seconds,
        )
        db.add(progress)
    else:
        progress.status = "completed"
        progress.completion_percent = 100.0
        progress.time_spent_seconds += req.time_spent_seconds
    result = GamificationService.award_xp(user, GamificationService.XP_REWARDS["complete_node"], "完成知识点", db)
    achievements = GamificationService.check_achievements(
        req.user_id, "complete_node", {"node_id": req.node_id}, db, loader
    )
    return CompleteNodeResponse(
        xp_awarded=GamificationService.XP_REWARDS["complete_node"],
        new_total_xp=user.xp,
        level_up=result["level_up"],
        new_level=result["new_level"],
        new_level_title=result["new_level_title"],
        unlocked_achievements=[{"id": a["id"], "name": a["name"], "emoji": a["emoji"]} for a in achievements],
    )
