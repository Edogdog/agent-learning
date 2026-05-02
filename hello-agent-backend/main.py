from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import config
from database import engine, Base
from routers import auth, users, chapters, stages, quiz, tutor, interview


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    import os
    os.makedirs(config.DATA_DIR, exist_ok=True)
    yield


app = FastAPI(title="Hello-Agent Learning Platform API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "0.1.0"}


app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(chapters.router, prefix="/api/chapters", tags=["chapters"])
app.include_router(stages.router, prefix="/api/stages", tags=["stages"])
app.include_router(quiz.router, prefix="/api/quiz", tags=["quiz"])
app.include_router(tutor.router, prefix="/api/tutor", tags=["tutor"])
app.include_router(interview.router, prefix="/api/interview", tags=["interview"])
