from openai import OpenAI
import config

TEACHER_SYSTEM_PROMPT = """你是Hello-Agent学习平台的AI导师AgentBot 🤖，你现在处于**主动教学模式**。

## 教学风格
- 你不是被动回答问题，而是**主动引导**学习者探索每个知识点
- 像一位耐心的私人教师，用对话的方式教学
- 每个概念的讲解要分段、有节奏，中间穿插提问和互动
- 用emoji和生动的类比让抽象概念变得有趣

## 教学流程（每个知识点遵循此模式）
1. **🎯 引入**：用1-2句有趣的问题或场景引入概念（如"想象一下，如果你是一个机器人..."）
2. **📖 讲解**：分段解释概念，每段不超过3-4句话，用类比和例子
3. **🔄 互动**：提出一个小问题让学习者思考或选择
4. **✅ 确认**：检查理解程度，如果对了就鼓励，错了就温柔纠正
5. **🎮 小测验**：出1道选择题检验理解

## 输出格式（重要！）
使用以下JSON格式输出你的教学回复：
{
  "type": "teach|quiz|code|encourage|correct|hint",
  "content": "教学文本内容",
  "options": ["选项A", "选项B", "选项C", "选项D"],  // quiz类型时必填
  "correct_index": 0,  // quiz类型时必填，正确答案索引
  "explanation": "解题思路和知识点讲解",
  "xp_reward": 10,
  "code_template": "代码模板，code类型时填写",
  "expected_output": "期望输出描述"
}

## 当前学习上下文
用户的等级、当前章节和关卡信息会动态注入。请根据用户的等级调整教学深度：
- Lv1-2: 用最简单的生活类比，避免专业术语
- Lv3-5: 引入专业术语，但每个都解释
- Lv6+: 可以讨论更深入的技术细节"""


class AITeacherService:
    def __init__(self):
        self.client = OpenAI(api_key=config.DEEPSEEK_API_KEY, base_url=config.DEEPSEEK_BASE_URL)
        self.model = config.DEEPSEEK_MODEL
        self.temperature = 0.3

    def _build_context(self, context: dict) -> str:
        parts = [f"- 用户等级: Lv.{context.get('user_level', 1)}"]
        if context.get("chapter_title"): parts.append(f"- 当前章节: 第{context.get('chapter_id','?')}章 {context['chapter_title']}")
        if context.get("node_title"): parts.append(f"- 当前知识点: {context['node_title']}")
        if context.get("node_content"): parts.append(f"- 知识点内容: {context['node_content'][:800]}")
        if context.get("history"):
            recent = context["history"][-6:]
            parts.append(f"- 最近对话: {recent}")
        return "\n".join(parts)

    def teach(self, context: dict, user_message: str = "") -> dict:
        ctx = self._build_context(context)
        system = TEACHER_SYSTEM_PROMPT + "\n\n## 当前学习上下文\n" + ctx
        messages = [{"role": "system", "content": system}]
        if user_message:
            messages.append({"role": "user", "content": user_message})
        else:
            node_title = context.get("node_title", "")
            node_content = context.get("node_content", "")[:300]
            messages.append({"role": "user", "content": f"请开始教我关于「{node_title}」的知识。知识点内容：{node_content}"})
        try:
            response = self.client.chat.completions.create(
                model=self.model, temperature=self.temperature,
                messages=messages,
            )
            text = response.choices[0].message.content or "{}"
            # Try to parse JSON
            import re
            json_match = re.search(r'\{[\s\S]*\}', text)
            if json_match:
                import json
                try:
                    return json.loads(json_match.group())
                except json.JSONDecodeError:
                    pass
            return {"type": "teach", "content": text, "xp_reward": 5}
        except Exception as e:
            return {"type": "teach", "content": f"🤖 AgentBot需要休息一下... ({str(e)[:50]})", "xp_reward": 0}

    def generate_quiz(self, context: dict, difficulty: str = "easy") -> dict:
        ctx = self._build_context(context)
        system = TEACHER_SYSTEM_PROMPT + "\n\n## 当前学习上下文\n" + ctx
        system += f"\n\n请为当前知识点生成1道{difficulty}难度的选择题。"
        try:
            response = self.client.chat.completions.create(
                model=self.model, temperature=0.5,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": "请生成一道测验题，输出JSON格式包含type:quiz, content(题目), options(4个选项数组), correct_index, explanation, xp_reward"},
                ],
            )
            text = response.choices[0].message.content or "{}"
            import re, json
            json_match = re.search(r'\{[\s\S]*\}', text)
            if json_match:
                return json.loads(json_match.group())
            return {"type": "quiz", "content": text, "options": [], "correct_index": 0, "explanation": "", "xp_reward": 10}
        except Exception as e:
            return {"type": "quiz", "content": f"生成题目失败: {e}", "options": [], "correct_index": 0, "explanation": "", "xp_reward": 0}

    def review_answer(self, question: str, user_answer: str, correct_answer: str, explanation: str) -> dict:
        """AI reviews user's answer and provides personalized feedback"""
        try:
            response = self.client.chat.completions.create(
                model=self.model, temperature=0.3,
                messages=[
                    {"role": "system", "content": "你是AgentBot，一个耐心的AI导师。现在需要你评价学习者的回答。给出鼓励（即使错了也要先肯定努力），然后给出正确的解释。输出JSON: {type: 'encourage'|'correct'|'hint', content: 个性反馈, xp_reward: 奖励}"},
                    {"role": "user", "content": f"题目: {question}\n学习者回答: {user_answer}\n正确答案: {correct_answer}\n解释: {explanation}\n请评价。"},
                ],
            )
            text = response.choices[0].message.content or "{}"
            import re, json
            json_match = re.search(r'\{[\s\S]*\}', text)
            if json_match:
                return json.loads(json_match.group())
            return {"type": "encourage", "content": "👏 很好！你正在进步！", "xp_reward": 10}
        except Exception:
            return {"type": "encourage", "content": "👏 继续加油！", "xp_reward": 10}
