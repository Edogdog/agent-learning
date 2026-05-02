from pydantic import BaseModel


class NodeDetail(BaseModel):
    id: str
    title: str
    content_type: str
    content: str
    order: int
    xp_reward: int
    status: str = "locked"


class StageDetail(BaseModel):
    id: str
    chapter_id: int
    title: str
    order: int
    estimated_minutes: int
    theme_emoji: str
    status: str = "locked"
    node_count: int = 0
    completed_count: int = 0
    nodes: list[NodeDetail] = []


class ChapterSummary(BaseModel):
    id: int
    title: str
    description: str
    estimated_hours: float
    stage_count: int
    emoji: str
    status: str = "locked"
    completion_percent: float = 0.0


class ChapterDetail(BaseModel):
    id: int
    title: str
    description: str
    estimated_hours: float
    emoji: str
    stages: list[StageDetail] = []


class CompleteNodeRequest(BaseModel):
    user_id: int
    node_id: str
    time_spent_seconds: int = 0


class CompleteNodeResponse(BaseModel):
    xp_awarded: int
    new_total_xp: int
    level_up: bool = False
    new_level: int | None = None
    new_level_title: str | None = None
    unlocked_achievements: list = []
