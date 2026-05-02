import json
import os
from pathlib import Path


class ContentLoader:
    def __init__(self, data_dir: str):
        self.data_dir = Path(data_dir)
        self.chapters: dict = {}
        self.stages: dict = {}
        self.quizzes: dict = {}
        self.achievements: list = []
        self.levels: list = []
        self._load_all()

    def _load_all(self):
        self._load_achievements()
        self._load_levels()
        self._load_chapters()

    def _load_achievements(self):
        path = self.data_dir / "achievements.json"
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                self.achievements = json.load(f)

    def _load_levels(self):
        path = self.data_dir / "levels.json"
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                self.levels = json.load(f)

    def _load_chapters(self):
        chapters_dir = self.data_dir / "chapters"
        if not chapters_dir.exists():
            return
        for ch_dir in sorted(chapters_dir.iterdir()):
            if not ch_dir.is_dir():
                continue
            content_file = ch_dir / "content.json"
            quiz_file = ch_dir / "quiz.json"
            stages_dir = ch_dir / "stages"

            if content_file.exists():
                with open(content_file, "r", encoding="utf-8") as f:
                    chapter = json.load(f)
                    self.chapters[chapter["id"]] = chapter

            if quiz_file.exists():
                with open(quiz_file, "r", encoding="utf-8") as f:
                    quiz_list = json.load(f)
                    for q in quiz_list:
                        self.quizzes[q["quiz_id"]] = q

            if stages_dir.exists():
                for stage_file in sorted(stages_dir.iterdir()):
                    if stage_file.suffix == ".json":
                        with open(stage_file, "r", encoding="utf-8") as f:
                            stage = json.load(f)
                            self.stages[stage["id"]] = stage

    def get_chapter(self, chapter_id: int) -> dict | None:
        return self.chapters.get(chapter_id)

    def get_all_chapters(self) -> list[dict]:
        return sorted(self.chapters.values(), key=lambda c: c["id"])

    def get_stage(self, stage_id: str) -> dict | None:
        return self.stages.get(stage_id)

    def get_chapter_stages(self, chapter_id: int) -> list[dict]:
        return sorted(
            [s for s in self.stages.values() if s["chapter_id"] == chapter_id],
            key=lambda s: s["order"],
        )

    def get_quiz(self, quiz_id: str) -> list[dict] | None:
        quiz = self.quizzes.get(quiz_id)
        if quiz:
            return quiz  # Return the quiz data as stored
        # Fallback: collect all questions for the given quiz_id/stage_id
        questions = []
        for q_data in self.quizzes.values():
            q_list = q_data if isinstance(q_data, list) else [q_data]
            for question in q_list:
                if isinstance(question, dict) and question.get("stage_id") == quiz_id or question.get("quiz_id") == quiz_id:
                    questions.append(question)
        # If no quiz ID match, try stage-level match
        for stage in self.stages.values():
            stage_quiz = stage.get("quiz", {})
            if stage_quiz.get("quiz_id") == quiz_id:
                # Quiz questions are embedded in the stage or in quiz.json
                pass
        return None if not questions else questions

    def get_stage_quiz_questions(self, stage_id: str) -> list[dict]:
        questions = []
        for key, q_data in self.quizzes.items():
            if isinstance(q_data, list):
                for q in q_data:
                    if isinstance(q, dict) and q.get("stage_id") == stage_id:
                        questions.append(q)
            elif isinstance(q_data, dict) and q_data.get("stage_id") == stage_id:
                questions.append(q_data)
        return questions

    def get_achievement(self, achievement_id: str) -> dict | None:
        for a in self.achievements:
            if a["id"] == achievement_id:
                return a
        return None

    def get_all_achievements(self) -> list[dict]:
        return self.achievements
