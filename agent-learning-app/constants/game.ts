export const XP_REWARDS = {
  complete_node: 10,
  pass_quiz: 20,
  perfect_quiz_bonus: 10,
  complete_stage: 100,
  complete_chapter: 300,
  streak_3: 50,
  streak_7: 150,
};

export const LEVELS = [
  { level: 1, title: '新手小白', xp: 0, emoji: '🌱' },
  { level: 2, title: '代码学徒', xp: 200, emoji: '🌿' },
  { level: 3, title: 'Agent萌新', xp: 500, emoji: '🍀' },
  { level: 4, title: '调参侠', xp: 900, emoji: '🌲' },
  { level: 5, title: 'Prompt法师', xp: 1500, emoji: '🌳' },
  { level: 6, title: '工具匠人', xp: 2300, emoji: '🛠️' },
  { level: 7, title: 'ReAct达人', xp: 3400, emoji: '⚡' },
  { level: 8, title: '架构师', xp: 5000, emoji: '🏗️' },
  { level: 9, title: 'Multi-Agent', xp: 7200, emoji: '👥' },
  { level: 10, title: 'Agent大师', xp: 10000, emoji: '🏆' },
  { level: 11, title: '传奇构建者', xp: 15000, emoji: '👑' },
  { level: 12, title: 'Agent之神', xp: 25000, emoji: '🌟' },
];

export const ACHIEVEMENTS: Record<string, { name: string; desc: string; emoji: string; rarity: string }> = {
  first_lesson: { name: '初次见面', desc: '完成第一个知识点', emoji: '🎓', rarity: '普通' },
  chapter1_complete: { name: '入门者', desc: '完成第一章', emoji: '📚', rarity: '普通' },
  chapter2_complete: { name: '历史学家', desc: '完成第二章', emoji: '📜', rarity: '普通' },
  chapter3_complete: { name: 'LLM探索者', desc: '完成第三章', emoji: '🧠', rarity: '普通' },
  chapter4_complete: { name: '范式大师', desc: '完成第四章', emoji: '⚡', rarity: '普通' },
  perfect_10: { name: '百发百中', desc: '连续10次测验全对', emoji: '🎯', rarity: '稀有' },
  quiz_streak_10: { name: '连击大师', desc: '连续10次测验全部正确', emoji: '🔥', rarity: '稀有' },
  streak_3: { name: '三日之约', desc: '连续学习3天', emoji: '📅', rarity: '普通' },
  streak_7: { name: '周勤奋之星', desc: '连续学习7天', emoji: '🔥', rarity: '稀有' },
  first_code: { name: '程序员', desc: '首次运行代码成功', emoji: '💻', rarity: '普通' },
  night_owl: { name: '夜猫子', desc: '在深夜学习', emoji: '🌙', rarity: '普通' },
};

export function getLevelInfo(xp: number) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xp) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || LEVELS[i];
      break;
    }
  }
  const range = next.xp - current.xp;
  const progress = range > 0 ? (xp - current.xp) / range : 1;
  return { ...current, progress: Math.min(progress, 1), nextLevel: next.level, xpToNext: next.xp - xp };
}
