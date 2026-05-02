from pydantic import BaseModel


class QuizQuestion(BaseModel):
    id: str
    type: str
    question: str
    options: list[str]


class QuizData(BaseModel):
    quiz_id: str
    stage_id: str
    questions: list[QuizQuestion]


class QuizSubmitRequest(BaseModel):
    quiz_id: str
    user_id: int
    answers: dict  # {question_id: selected_index}
    time_spent_seconds: int = 0


class QuizFeedbackItem(BaseModel):
    question_id: str
    is_correct: bool
    explanation: str
    correct_index: int


class QuizResult(BaseModel):
    score: float
    total_questions: int
    correct_count: int
    is_perfect: bool
    xp_awarded: int
    feedback: list[QuizFeedbackItem]
    new_level_up: bool = False
    new_level: int | None = None
    unlocked_achievements: list = []
