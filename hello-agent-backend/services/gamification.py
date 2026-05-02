from datetime import date, timedelta
import config


class GamificationService:
    XP_REWARDS = {
        "complete_node": 10,
        "pass_quiz": 20,
        "perfect_quiz_bonus": 10,
        "complete_stage": 100,
        "complete_chapter": 300,
        "streak_3": 50,
        "streak_7": 150,
    }

    @staticmethod
    def calculate_level(xp: int) -> dict:
        current = {"level": 1, "title": "新手小白", "emoji": "\U0001f331"}
        for lv in sorted(config.LEVEL_THRESHOLDS.keys()):
            if xp >= config.LEVEL_THRESHOLDS[lv]["xp"]:
                current = {
                    "level": lv,
                    "title": config.LEVEL_THRESHOLDS[lv]["title"],
                    "emoji": config.LEVEL_THRESHOLDS[lv]["emoji"],
                }
        return current

    @staticmethod
    def xp_to_next_level(xp: int) -> int:
        levels = sorted(config.LEVEL_THRESHOLDS.items(), key=lambda x: x[0])
        for lv, info in levels:
            if xp < info["xp"]:
                return info["xp"] - xp
        return 0

    @staticmethod
    def xp_percent(xp: int) -> float:
        levels = sorted(config.LEVEL_THRESHOLDS.items(), key=lambda x: x[0])
        current_xp_threshold = 0
        next_xp_threshold = 200
        for lv, info in levels:
            if xp >= info["xp"]:
                current_xp_threshold = info["xp"]
            else:
                next_xp_threshold = info["xp"]
                break
        if next_xp_threshold == current_xp_threshold:
            return 1.0
        range_xp = next_xp_threshold - current_xp_threshold
        progress = xp - current_xp_threshold
        return min(progress / range_xp, 1.0)

    @staticmethod
    def award_xp(user, amount: int, reason: str, db) -> dict:
        old_level = user.level
        user.xp += amount
        level_info = GamificationService.calculate_level(user.xp)
        level_up = level_info["level"] > old_level
        if level_up:
            user.level = level_info["level"]
        db.commit()
        db.refresh(user)
        return {
            "xp_awarded": amount,
            "new_total_xp": user.xp,
            "level_up": level_up,
            "new_level": level_info["level"] if level_up else None,
            "new_level_title": level_info["title"] if level_up else None,
            "reason": reason,
        }

    @staticmethod
    def check_achievements(user_id: int, event_type: str, event_data: dict, db, content_loader) -> list:
        from models.achievement import Achievement
        unlocked_ids = set(
            row[0] for row in db.query(Achievement.achievement_id)
            .filter(Achievement.user_id == user_id).all()
        )
        newly_unlocked = []
        for ach in content_loader.get_all_achievements():
            if ach["id"] in unlocked_ids:
                continue
            if GamificationService._check_condition(ach, event_type, event_data, user_id, db):
                db.add(Achievement(user_id=user_id, achievement_id=ach["id"]))
                newly_unlocked.append(ach)
        if newly_unlocked:
            db.commit()
        return newly_unlocked

    @staticmethod
    def _check_condition(ach: dict, event_type: str, event_data: dict, user_id: int, db) -> bool:
        cond = ach.get("condition_type", "")
        val = ach.get("condition_value", 0)
        if cond == "complete_first_node" and event_type == "complete_node":
            return True
        if cond == "complete_chapter" and event_type == "complete_chapter":
            return event_data.get("chapter_id") == val
        if cond == "perfect_quizzes_count" and event_type == "quiz_submit":
            from models.quiz_record import QuizRecord
            count = db.query(QuizRecord).filter(
                QuizRecord.user_id == user_id, QuizRecord.is_perfect == True
            ).count()
            return count >= val
        if cond == "quiz_pass_streak" and event_type == "quiz_submit":
            from models.quiz_record import QuizRecord
            recent = db.query(QuizRecord).filter(
                QuizRecord.user_id == user_id
            ).order_by(QuizRecord.created_at.desc()).limit(val).all()
            return len(recent) >= val and all(r.is_perfect for r in recent)
        if cond == "streak_days" and event_type == "daily_study":
            return event_data.get("streak_days", 0) >= val
        if cond == "complete_stage" and event_type == "complete_stage":
            return event_data.get("stage_id") == val
        return False

    @staticmethod
    def update_streak(user, db) -> dict:
        today = date.today()
        if user.last_study_date is None:
            user.streak_days = 1
        elif user.last_study_date == today:
            pass  # Already studied today
        elif user.last_study_date == today - timedelta(days=1):
            user.streak_days += 1
        else:
            user.streak_days = 1
        user.last_study_date = today
        db.commit()
        streak_bonus = 0
        if user.streak_days == 3:
            streak_bonus = GamificationService.XP_REWARDS["streak_3"]
            GamificationService.award_xp(user, streak_bonus, "连续学习3天奖励", db)
        elif user.streak_days == 7:
            streak_bonus = GamificationService.XP_REWARDS["streak_7"]
            GamificationService.award_xp(user, streak_bonus, "连续学习7天奖励", db)
        return {"streak_days": user.streak_days, "streak_bonus": streak_bonus}
