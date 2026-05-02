from sqlalchemy import Column, Integer, String, Date, DateTime
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False)
    nickname = Column(String, default="")
    level = Column(Integer, default=1)
    xp = Column(Integer, default=0)
    streak_days = Column(Integer, default=0)
    last_study_date = Column(Date, nullable=True)
    python_level = Column(String, default="")
    llm_knowledge = Column(String, default="")
    agent_awareness = Column(String, default="")
    math_basis = Column(String, default="")
    learning_goal = Column(String, default="")
    available_time = Column(String, default="")
    preferred_style = Column(String, default="")
    learning_path = Column(String, default="full")
    created_at = Column(DateTime, server_default=func.now())
