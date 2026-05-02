from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models.study_progress import StudyProgress
from services.content_loader import ContentLoader
from schemas.chapter import ChapterSummary, ChapterDetail, StageDetail
import config

router = APIRouter()


@router.get("")
def list_chapters(user_id: int = Query(None), db: Session = Depends(get_db)):
    loader = ContentLoader(config.DATA_DIR)
    chapters = []
    for ch in loader.get_all_chapters():
        status = "locked"
        completed_nodes = 0
        total_nodes = sum(len(s.get("nodes", [])) for s in loader.get_chapter_stages(ch["id"]))
        if user_id:
            progress = db.query(StudyProgress).filter(
                StudyProgress.user_id == user_id,
                StudyProgress.chapter_id == ch["id"],
            ).all()
            completed_nodes = sum(1 for p in progress if p.status == "completed" and p.node_id)
            if completed_nodes > 0:
                status = "completed" if completed_nodes >= total_nodes else "in_progress"
            elif ch["id"] == 1:
                status = "unlocked"
            else:
                prev = db.query(StudyProgress).filter(
                    StudyProgress.user_id == user_id,
                    StudyProgress.chapter_id == ch["id"] - 1,
                ).first()
                if prev:
                    status = "unlocked"
        elif ch["id"] == 1:
            status = "unlocked"
        chapters.append(ChapterSummary(
            id=ch["id"],
            title=ch["title"],
            description=ch["description"],
            estimated_hours=ch["estimated_hours"],
            stage_count=len(loader.get_chapter_stages(ch["id"])),
            emoji=ch["emoji"],
            status=status,
            completion_percent=round(completed_nodes / total_nodes * 100, 1) if total_nodes > 0 else 0,
        ))
    return chapters


@router.get("/{chapter_id}")
def get_chapter(chapter_id: int, user_id: int = Query(None), db: Session = Depends(get_db)):
    loader = ContentLoader(config.DATA_DIR)
    ch = loader.get_chapter(chapter_id)
    if not ch:
        raise HTTPException(status_code=404, detail="章节不存在")
    stages = []
    for s in loader.get_chapter_stages(chapter_id):
        status = "locked"
        node_count = len(s.get("nodes", []))
        completed_count = 0
        if user_id:
            progress = db.query(StudyProgress).filter(
                StudyProgress.user_id == user_id,
                StudyProgress.stage_id == s["id"],
            ).all()
            completed_count = sum(1 for p in progress if p.status == "completed")
            if completed_count > 0:
                status = "completed" if completed_count >= node_count else "in_progress"
            elif chapter_id == 1 and s["order"] == 1:
                status = "unlocked"
            else:
                prev_stages = [st for st in loader.get_chapter_stages(chapter_id) if st["order"] < s["order"]]
                if prev_stages:
                    prev = prev_stages[-1]
                    prev_progress = db.query(StudyProgress).filter(
                        StudyProgress.user_id == user_id,
                        StudyProgress.stage_id == prev["id"],
                    ).all()
                    if prev_progress:
                        status = "unlocked"
        elif chapter_id == 1 and s["order"] == 1:
            status = "unlocked"
        stages.append(StageDetail(
            id=s["id"],
            chapter_id=s["chapter_id"],
            title=s["title"],
            order=s["order"],
            estimated_minutes=s["estimated_minutes"],
            theme_emoji=s["theme_emoji"],
            status=status,
            node_count=node_count,
            completed_count=completed_count,
        ))
    return ChapterDetail(
        id=ch["id"],
        title=ch["title"],
        description=ch["description"],
        estimated_hours=ch["estimated_hours"],
        emoji=ch["emoji"],
        stages=stages,
    )
