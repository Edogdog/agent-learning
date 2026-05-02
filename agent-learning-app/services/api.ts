const API_BASE = 'http://localhost:8000/api';

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new ApiError(response.status, error.detail || 'Request failed');
  }
  return response.json();
}

export interface RegisterRequest {
  username: string;
  nickname?: string;
  python_level: string;
  llm_knowledge: string;
  agent_awareness: string;
  math_basis: string;
  learning_goal: string;
  available_time: string;
  preferred_style: string;
}

export interface UserResponse {
  id: number;
  username: string;
  nickname: string;
  level: number;
  xp: number;
  learning_path: string;
  recommended_path: string;
  path_description: string;
}

export interface UserStats {
  level: number;
  level_title: string;
  level_emoji: string;
  xp: number;
  xp_to_next: number;
  xp_percent: number;
  streak_days: number;
  total_study_seconds: number;
  quizzes_completed: number;
  perfect_quizzes: number;
  nodes_completed: number;
  achievements: Array<{ id: string; unlocked_at: string }>;
}

export interface ChapterSummary {
  id: number;
  title: string;
  description: string;
  estimated_hours: number;
  stage_count: number;
  emoji: string;
  status: string;
  completion_percent: number;
}

export interface StageDetail {
  id: string;
  chapter_id: number;
  title: string;
  order: number;
  estimated_minutes: number;
  theme_emoji: string;
  status: string;
  node_count: number;
  completed_count: number;
}

export interface ChapterDetail {
  id: number;
  title: string;
  description: string;
  estimated_hours: number;
  emoji: string;
  stages: StageDetail[];
}

export interface NodeDetail {
  id: string;
  title: string;
  content_type: string;
  content: string;
  order: number;
  xp_reward: number;
  status: string;
}

export interface QuizQuestion {
  id: string;
  type: string;
  question: string;
  options: string[];
  correct_index?: number;
}

export interface QuizData {
  quiz_id: string;
  stage_id: string;
  questions: QuizQuestion[];
}

export interface QuizResult {
  score: number;
  total_questions: number;
  correct_count: number;
  is_perfect: boolean;
  xp_awarded: number;
  feedback: Array<{
    question_id: string;
    is_correct: boolean;
    explanation: string;
    correct_index: number;
  }>;
  new_level_up: boolean;
  new_level: number | null;
  unlocked_achievements: Array<{ id: string; name: string; emoji: string }>;
}

export const api = {
  register: (data: RegisterRequest) =>
    request<UserResponse>('POST', '/auth/register', data),

  getUserProgress: (userId: number) =>
    request<{ user_id: number; chapters: Array<{ chapter_id: number; title: string; status: string; completion_percent: number }> }>(
      'GET', `/users/${userId}/progress`),

  getUserStats: (userId: number) =>
    request<UserStats>('GET', `/users/${userId}/stats`),

  getChapters: (userId?: number) =>
    request<ChapterSummary[]>('GET', `/chapters${userId ? `?user_id=${userId}` : ''}`),

  getChapterDetail: (chapterId: number, userId?: number) =>
    request<ChapterDetail>('GET', `/chapters/${chapterId}${userId ? `?user_id=${userId}` : ''}`),

  getStageNodes: (stageId: string, userId?: number) =>
    request<{ stage_id: string; nodes: NodeDetail[] }>('GET', `/stages/${stageId}/nodes${userId ? `?user_id=${userId}` : ''}`),

  completeNode: (stageId: string, data: { user_id: number; node_id: string; time_spent_seconds?: number }) =>
    request<{ xp_awarded: number; new_total_xp: number; level_up: boolean; new_level: number | null; unlocked_achievements: Array<{ id: string; name: string; emoji: string }> }>(
      'POST', `/stages/${stageId}/complete-node`, data),

  getQuiz: (stageId: string) =>
    request<QuizData>('GET', `/quiz/${stageId}`),

  submitQuiz: (data: { quiz_id: string; user_id: number; answers: Record<string, number>; time_spent_seconds?: number }) =>
    request<QuizResult>('POST', '/quiz/submit', data),

  askTutor: (question: string, userId: number, context?: Record<string, unknown>) =>
    request<{ answer: string }>('POST', '/tutor/ask', { question, user_id: userId, context }),

  getQuizHistory: (userId: number) =>
    request<Array<{ id: number; quiz_id: string; chapter_id: number; score: number; is_perfect: boolean; created_at: string }>>('GET', `/quiz/history/${userId}`),

  getWrongAnswers: (userId: number) =>
    request<Array<{ id: number; question: string; correct_index: number; explanation: string; created_at: string }>>('GET', `/quiz/wrong-answers/${userId}`),

  health: () => request<{ status: string; version: string }>('GET', '/health'),
};

export { ApiError };
