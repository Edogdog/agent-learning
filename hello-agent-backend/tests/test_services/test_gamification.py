from services.gamification import GamificationService


def test_calculate_level():
    assert GamificationService.calculate_level(0)["level"] == 1
    assert GamificationService.calculate_level(0)["title"] == "新手小白"
    assert GamificationService.calculate_level(250)["level"] == 2
    assert GamificationService.calculate_level(600)["level"] == 3
    assert GamificationService.calculate_level(30000)["level"] == 12


def test_xp_to_next_level():
    assert GamificationService.xp_to_next_level(0) == 200
    assert GamificationService.xp_to_next_level(199) == 1
    assert GamificationService.xp_to_next_level(200) == 300
    assert GamificationService.xp_to_next_level(99999) == 0


def test_xp_percent():
    pct = GamificationService.xp_percent(100)
    assert 0.4 <= pct <= 0.6  # 100/200 = 0.5
