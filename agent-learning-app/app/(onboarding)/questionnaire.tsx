import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { GameColors } from '@/constants/theme';
import { api, RegisterRequest } from '@/services/api';
import { useUser } from '@/hooks/use-user';

interface Question {
  key: keyof RegisterRequest;
  title: string;
  options: string[];
}

const QUESTIONS: Question[] = [
  { key: 'python_level', title: '你的 Python 功力如何？', options: ['完全小白', '会写脚本', '项目经验丰富', '开源贡献者'] },
  { key: 'llm_knowledge', title: '你和大语言模型打过交道吗？', options: ['听说过', '用过ChatGPT', '调过API', '微调过模型'] },
  { key: 'agent_awareness', title: '智能体(Agent)对你来说是？', options: ['完全陌生', '略有耳闻', '玩过Coze/Dify', '动手做过'] },
  { key: 'math_basis', title: '看到公式和算法你会？', options: ['直接跳过', '勉强看看', '慢慢理解', '享受推导'] },
  { key: 'learning_goal', title: '学Agent最想做什么？', options: ['做个有趣的项目', '解决工作问题', '深入研究', '面试求职'] },
  { key: 'available_time', title: '每周你能投入多少时间？', options: ['<3小时', '3-5小时', '5-10小时', '不限'] },
  { key: 'preferred_style', title: '你喜欢的学习方式是？', options: ['先看理论再实践', '直接动手边做边学', '看视频', '读文档'] },
];

export default function QuestionnaireScreen() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { setUser } = useUser();

  const currentQ = QUESTIONS[step];
  const progress = (step + 1) / QUESTIONS.length;

  const selectOption = async (option: string) => {
    const newAnswers = { ...answers, [currentQ.key]: option };
    setAnswers(newAnswers);
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setIsSubmitting(true);
      try {
        const req: RegisterRequest = {
          username: `user_${Date.now()}`,
          nickname: '',
          python_level: newAnswers.python_level || '',
          llm_knowledge: newAnswers.llm_knowledge || '',
          agent_awareness: newAnswers.agent_awareness || '',
          math_basis: newAnswers.math_basis || '',
          learning_goal: newAnswers.learning_goal || '',
          available_time: newAnswers.available_time || '',
          preferred_style: newAnswers.preferred_style || '',
        };
        const result = await api.register(req);
        setUser(result.id, result.username, result.nickname);
        router.replace({
          pathname: '/(onboarding)/recommendation',
          params: { path: result.recommended_path, desc: result.path_description },
        });
      } catch { /* handle error */ }
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.stepIndicator}>{step + 1} / {QUESTIONS.length}</Text>
      <View style={styles.card}>
        <Text style={styles.question}>{currentQ.title}</Text>
        <ScrollView style={styles.optionsContainer}>
          {currentQ.options.map((opt, i) => (
            <Pressable
              key={i}
              style={[styles.option, answers[currentQ.key] === opt && styles.optionSelected]}
              onPress={() => selectOption(opt)}
              disabled={isSubmitting}>
              <Text style={[styles.optionText, answers[currentQ.key] === opt && styles.optionTextSelected]}>
                {opt}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      {isSubmitting && <Text style={styles.loading}>正在生成学习路径...</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20, paddingTop: 60 },
  progressBar: { height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, marginBottom: 12 },
  progressFill: { height: 4, backgroundColor: GameColors.primary, borderRadius: 2 },
  stepIndicator: { color: '#6B7280', fontSize: 14, textAlign: 'center', marginBottom: 32 },
  card: { flex: 1 },
  question: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 24, textAlign: 'center' },
  optionsContainer: { flex: 1 },
  option: { backgroundColor: '#fff', padding: 18, borderRadius: 12, marginBottom: 12, borderWidth: 2, borderColor: '#E5E7EB' },
  optionSelected: { borderColor: GameColors.primary, backgroundColor: '#EFF6FF' },
  optionText: { fontSize: 16, color: '#374151', textAlign: 'center' },
  optionTextSelected: { color: GameColors.primary, fontWeight: '600' },
  loading: { color: GameColors.primary, fontSize: 16, textAlign: 'center', padding: 20 },
});
