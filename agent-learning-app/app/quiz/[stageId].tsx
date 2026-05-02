import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api, QuizData, QuizResult } from '@/services/api';
import { useUser } from '@/hooks/use-user';
import { GameColors } from '@/constants/theme';

export default function QuizScreen() {
  const { stageId } = useLocalSearchParams<{ stageId: string }>();
  const router = useRouter();
  const { id: userId, refreshStats } = useUser();
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getQuiz(stageId!);
        setQuiz(data);
      } catch { /* handle */ }
    })();
  }, [stageId]);

  const currentQ = quiz?.questions[qIndex];
  const isLast = qIndex === (quiz?.questions.length || 0) - 1;

  const handleAnswer = (optionIndex: number) => {
    setSelectedOption(optionIndex);
    setAnswers(prev => ({ ...prev, [currentQ!.id]: optionIndex }));
  };

  const handleNext = async () => {
    setSelectedOption(null);
    if (isLast) {
      if (!userId) return;
      try {
        const res = await api.submitQuiz({ quiz_id: quiz!.quiz_id, user_id: userId, answers });
        setResult(res);
        await refreshStats();
      } catch { /* handle */ }
    } else {
      setQIndex(qIndex + 1);
    }
  };

  if (result) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.resultContent}>
        <Text style={styles.resultEmoji}>{result.is_perfect ? '🎉' : result.score >= 60 ? '👍' : '💪'}</Text>
        <Text style={styles.resultTitle}>测验完成！</Text>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreNum}>{result.score}%</Text>
        </View>
        <Text style={styles.resultDetail}>{result.correct_count}/{result.total_questions} 题正确</Text>
        <Text style={styles.xpText}>+{result.xp_awarded} XP</Text>
        {result.new_level_up && <Text style={styles.levelUp}>⬆️ 升级到 Lv.{result.new_level}！</Text>}
        {result.unlocked_achievements.map((a, i) => (
          <Text key={i} style={styles.achievement}>{a.emoji} 获得成就: {a.name}</Text>
        ))}
        <Text style={styles.feedbackTitle}>📋 详细解析</Text>
        {result.feedback.map((fb, i) => (
          <View key={i} style={[styles.feedbackCard, fb.is_correct ? styles.fbCorrect : styles.fbWrong]}>
            <Text style={styles.fbStatus}>{fb.is_correct ? '✅' : '❌'} 第{i+1}题</Text>
            {!fb.is_correct && <Text style={styles.fbExplanation}>{fb.explanation}</Text>}
          </View>
        ))}
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>返回章节</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (!quiz || !currentQ) return <ActivityIndicator style={styles.loader} />;

  return (
    <View style={styles.container}>
      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>第 {qIndex + 1}/{quiz.questions.length} 题</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((qIndex + 1) / quiz.questions.length) * 100}%` }]} />
        </View>
      </View>
      <View style={styles.questionCard}>
        <Text style={styles.question}>{currentQ.question}</Text>
        <View style={styles.options}>
          {currentQ.options.map((opt, i) => {
            const isSelected = i === selectedOption;
            return (
              <Pressable
                key={i}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => handleAnswer(i)}>
                <Text style={styles.optionLetter}>{String.fromCharCode(65 + i)}</Text>
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{opt}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <Pressable
        style={[styles.nextBtn, selectedOption === null && styles.nextBtnDisabled]}
        onPress={handleNext}
        disabled={selectedOption === null}>
        <Text style={styles.nextBtnText}>{isLast ? '提交结果 📤' : '下一题 →'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20 },
  loader: { flex: 1, justifyContent: 'center' },
  progressRow: { marginBottom: 20 },
  progressLabel: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  progressBar: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: GameColors.primary, borderRadius: 3 },
  questionCard: { flex: 1 },
  question: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 24, lineHeight: 28 },
  options: { gap: 12 },
  option: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  optionSelected: { borderColor: GameColors.primary, backgroundColor: '#EFF6FF' },
  optionLetter: { fontSize: 16, fontWeight: 'bold', color: '#6B7280', marginRight: 12, width: 24 },
  optionText: { fontSize: 15, color: '#374151', flex: 1 },
  optionTextSelected: { color: GameColors.primary, fontWeight: '600' },
  nextBtn: { backgroundColor: GameColors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  resultEmoji: { fontSize: 64, textAlign: 'center', marginTop: 60 },
  resultContent: { padding: 20, paddingBottom: 40 },
  resultTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginTop: 12 },
  scoreCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: GameColors.primary, alignSelf: 'center', marginTop: 16, justifyContent: 'center', alignItems: 'center' },
  scoreNum: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  resultDetail: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginTop: 8 },
  xpText: { fontSize: 18, color: GameColors.xpBar, textAlign: 'center', marginTop: 12, fontWeight: '600' },
  levelUp: { fontSize: 16, color: GameColors.accent, textAlign: 'center', marginTop: 8 },
  achievement: { fontSize: 14, color: GameColors.success, textAlign: 'center', marginTop: 4 },
  feedbackTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 24, marginBottom: 12, color: '#111827' },
  feedbackCard: { padding: 14, borderRadius: 10, marginBottom: 8 },
  fbCorrect: { backgroundColor: '#ECFDF5' },
  fbWrong: { backgroundColor: '#FEF2F2' },
  fbStatus: { fontSize: 14, fontWeight: '600', color: '#374151' },
  fbExplanation: { fontSize: 13, color: '#6B7280', marginTop: 6, lineHeight: 19 },
  backBtn: { backgroundColor: GameColors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
