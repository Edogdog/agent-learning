class QuizEngine:
    @staticmethod
    def grade_submission(questions: list[dict], user_answers: dict) -> dict:
        feedback = []
        correct_count = 0
        for q in questions:
            q_id = q.get("id", "")
            correct_idx = q.get("correct_index", -1)
            user_idx = user_answers.get(q_id, -1)
            is_correct = (user_idx == correct_idx)
            if is_correct:
                correct_count += 1
            feedback.append({
                "question_id": q_id,
                "is_correct": is_correct,
                "explanation": q.get("explanation", ""),
                "correct_index": correct_idx,
            })
        total = len(questions)
        score = correct_count / total if total > 0 else 0
        return {
            "score": score,
            "total_questions": total,
            "correct_count": correct_count,
            "is_perfect": correct_count == total,
            "feedback": feedback,
        }

    @staticmethod
    def generate_feedback(is_correct: bool) -> str:
        if is_correct:
            return "\U0001f389 正确！你掌握了这个概念。"
        return "\U0001f4a1 再想想，建议回顾一下相关知识点。"
