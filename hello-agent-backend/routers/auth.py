from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from schemas.user import UserRegister, UserResponse
from services.gamification import GamificationService

router = APIRouter()

PATH_RECOMMENDATIONS = {
    "fast": {"name": "速成路线", "duration": "8周", "desc": "适合时间有限、有编程基础的开发者，快速直达实战"},
    "deep": {"name": "深度路线", "duration": "20周", "desc": "适合研究人员和算法工程师，深入每个概念的底层原理"},
    "full": {"name": "全能路线", "duration": "16周", "desc": "适合时间充裕的初学者，按章节顺序完整学习"},
    "interview": {"name": "面试路线", "duration": "4周", "desc": "聚焦核心概念和面试高频题，快速备战"},
    "lowcode": {"name": "低代码路线", "duration": "6周", "desc": "侧重低代码平台使用，减少手写代码量"},
}


def recommend_path(answers: dict) -> str:
    available_time = answers.get("available_time", "")
    goal = answers.get("learning_goal", "")
    python_level = answers.get("python_level", "")
    if goal == "面试求职" or (available_time in ["<3小时"] and goal == "面试求职"):
        return "interview"
    if goal == "深入研究":
        return "deep"
    if python_level in ["完全小白"] and goal in ["做个有趣的项目", "解决工作问题"]:
        return "speed"
    if python_level in ["完全小白", "会写脚本"] and available_time in ["<3小时", "3-5小时"]:
        return "lowcode"
    return "full"


@router.post("/register", response_model=UserResponse)
def register(req: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == req.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="用户名已存在")
    path = recommend_path({
        "available_time": req.available_time,
        "learning_goal": req.learning_goal,
        "python_level": req.python_level,
    })
    user = User(
        username=req.username,
        nickname=req.nickname or req.username,
        python_level=req.python_level,
        llm_knowledge=req.llm_knowledge,
        agent_awareness=req.agent_awareness,
        math_basis=req.math_basis,
        learning_goal=req.learning_goal,
        available_time=req.available_time,
        preferred_style=req.preferred_style,
        learning_path=path,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    path_info = PATH_RECOMMENDATIONS.get(path, PATH_RECOMMENDATIONS["full"])
    return UserResponse(
        id=user.id,
        username=user.username,
        nickname=user.nickname,
        level=user.level,
        xp=user.xp,
        learning_path=path,
        recommended_path=path_info["name"],
        path_description=path_info["desc"],
    )
