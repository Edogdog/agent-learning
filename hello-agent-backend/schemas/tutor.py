from pydantic import BaseModel


class TutorRequest(BaseModel):
    question: str
    user_id: int
    context: dict = {}


class TutorContext(BaseModel):
    chapter_id: int | None = None
    chapter_title: str = ""
    stage_id: str | None = None
    stage_title: str = ""
    node_id: str | None = None
    node_title: str = ""
    user_level: int = 1
    user_xp: int = 0
