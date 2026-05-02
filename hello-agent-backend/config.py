import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env", override=True)

# LLM
LLM_PROVIDER = os.environ.get("LLM_PROVIDER", "deepseek").lower()
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
DEEPSEEK_MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")
DEEPSEEK_BASE_URL = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
LLM_TEMPERATURE = float(os.environ.get("LLM_TEMPERATURE", "0"))

# Database
DATABASE_PATH = str(BASE_DIR / "data" / "hello_agent.db")

# Data
DATA_DIR = str(BASE_DIR / "data")

# App
DEBUG = os.environ.get("DEBUG", "true").lower() == "true"
CORS_ORIGINS = ["*"]
CHAT_HISTORY_MAX = 20

# XP / Level thresholds (per PRD section 3.5.1)
LEVEL_THRESHOLDS = {
    1: {"title": "新手小白", "xp": 0, "emoji": "\U0001f331"},
    2: {"title": "代码学徒", "xp": 200, "emoji": "\U0001f33f"},
    3: {"title": "Agent萌新", "xp": 500, "emoji": "\U0001f340"},
    4: {"title": "调参侠", "xp": 900, "emoji": "\U0001f332"},
    5: {"title": "Prompt法师", "xp": 1500, "emoji": "\U0001f333"},
    6: {"title": "工具匠人", "xp": 2300, "emoji": "\U0001f6e0️"},
    7: {"title": "ReAct达人", "xp": 3400, "emoji": "⚡"},
    8: {"title": "架构师", "xp": 5000, "emoji": "\U0001f3d7️"},
    9: {"title": "Multi-Agent", "xp": 7200, "emoji": "\U0001f465"},
    10: {"title": "Agent大师", "xp": 10000, "emoji": "\U0001f3c6"},
    11: {"title": "传奇构建者", "xp": 15000, "emoji": "\U0001f451"},
    12: {"title": "Agent之神", "xp": 25000, "emoji": "\U0001f31f"},
}
