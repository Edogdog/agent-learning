from pydantic import BaseModel


class UserRegister(BaseModel):
    username: str
    nickname: str = ""
    python_level: str = ""
    llm_knowledge: str = ""
    agent_awareness: str = ""
    math_basis: str = ""
    learning_goal: str = ""
    available_time: str = ""
    preferred_style: str = ""


class UserResponse(BaseModel):
    id: int
    username: str
    nickname: str
    level: int
    xp: int
    learning_path: str
    recommended_path: str = ""
    path_description: str = ""


class UserStats(BaseModel):
    level: int
    level_title: str
    level_emoji: str
    xp: int
    xp_to_next: int
    xp_percent: float
    streak_days: int
    total_study_seconds: int
    quizzes_completed: int
    perfect_quizzes: int
    nodes_completed: int
    achievements: list
