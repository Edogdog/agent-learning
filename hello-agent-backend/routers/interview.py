import json, random
from fastapi import APIRouter
import config
from services.content_loader import ContentLoader

router = APIRouter()


@router.get("/questions")
def get_interview_questions():
    loader = ContentLoader(config.DATA_DIR)
    path = loader.data_dir / "interview_questions.json"
    if not path.exists():
        return {"questions": []}
    with open(path, "r", encoding="utf-8") as f:
        questions = json.load(f)
    return {"questions": questions}


@router.get("/random")
def get_random_question():
    loader = ContentLoader(config.DATA_DIR)
    path = loader.data_dir / "interview_questions.json"
    if not path.exists():
        return {"question": None}
    with open(path, "r", encoding="utf-8") as f:
        questions = json.load(f)
    if not questions:
        return {"question": None}
    q = random.choice(questions)
    return {"question": q}
