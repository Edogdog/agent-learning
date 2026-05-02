from openai import OpenAI
import config


AGENTBOT_SYSTEM_PROMPT = """你是Hello-Agent学习平台的AI导师AgentBot 🤖。
你精通《Hello-Agents》这本智能体教程的全部16章内容。

## 性格设定
- 耐心、幽默、鼓励型
- 善用emoji增加亲切感（但每句话不超过2个）
- 复杂概念用生活中的类比解释
- 犯错时温柔纠正，不打击自信心
- 成就时真诚祝贺

## 回答原则
1. 结合当前章节内容，提供精准解答
2. 复杂概念用生活中的类比解释
3. 引导学习者思考，而非直接给出完整答案
4. 适时推荐相关知识点或下一步学习内容
5. 回答控制在300字以内，除非用户需要详细解释
6. 如果用户问到超出当前学习范围的内容，先简要回答，再建议先完成当前阶段

## 当前学习上下文
用户正在学习的章节、关卡和知识点会动态注入到对话中。请根据这些上下文调整回答的深度和侧重点。"""


class AITutorService:
    def __init__(self):
        self.client = OpenAI(
            api_key=config.DEEPSEEK_API_KEY,
            base_url=config.DEEPSEEK_BASE_URL,
        )
        self.model = config.DEEPSEEK_MODEL
        self.temperature = config.LLM_TEMPERATURE

    def _build_context_prompt(self, context: dict) -> str:
        parts = []
        if context.get("chapter_title"):
            parts.append(f"- 当前章节: {context['chapter_title']}")
        if context.get("stage_title"):
            parts.append(f"- 当前关卡: {context['stage_title']}")
        if context.get("node_title"):
            parts.append(f"- 当前知识点: {context['node_title']}")
        parts.append(f"- 学习者等级: Lv.{context.get('user_level', 1)}")
        if parts:
            return "\n".join(parts)
        return "用户尚未开始学习具体内容。"

    async def ask(self, question: str, context: dict) -> str:
        context_str = self._build_context_prompt(context)
        system_prompt = (
            AGENTBOT_SYSTEM_PROMPT
            + "\n\n## 当前学习上下文\n"
            + context_str
        )
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                temperature=self.temperature,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": question},
                ],
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            return f"抱歉，AI导师暂时无法回应 😅\n请检查网络连接和API配置。\n错误信息: {str(e)}"

    async def ask_stream(self, question: str, context: dict):
        context_str = self._build_context_prompt(context)
        system_prompt = (
            AGENTBOT_SYSTEM_PROMPT
            + "\n\n## 当前学习上下文\n"
            + context_str
        )
        try:
            stream = self.client.chat.completions.create(
                model=self.model,
                temperature=self.temperature,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": question},
                ],
                stream=True,
            )
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            yield f"\n\n[错误: {str(e)}]"
