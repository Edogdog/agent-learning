import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { api } from '@/services/api';
import { useUser } from '@/hooks/use-user';
import { GameColors } from '@/constants/theme';

export default function WrongAnswersScreen() {
  const { id } = useUser();
  const [wrongList, setWrongList] = useState<Array<{ id: number; question: string; correct_index: number; explanation: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const data = await api.getWrongAnswers(id);
        setWrongList(data);
      } catch { /* handle */ }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <ActivityIndicator style={styles.loader} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>📝 错题本</Text>
      <Text style={styles.subtitle}>共 {wrongList.length} 道错题，及时复习巩固</Text>
      {wrongList.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyText}>还没有错题！继续保持~</Text>
        </View>
      ) : (
        wrongList.map((item, i) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardNum}>#{i + 1}</Text>
              <Text style={styles.cardDate}>{item.created_at?.slice(0, 10)}</Text>
            </View>
            <Text style={styles.question}>{item.question}</Text>
            <View style={styles.answerRow}>
              <Text style={styles.label}>正确答案：</Text>
              <Text style={styles.answer}>{String.fromCharCode(65 + (item.correct_index || 0))}</Text>
            </View>
            <Text style={styles.explanation}>{item.explanation}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 40 },
  loader: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#9CA3AF', marginBottom: 20 },
  emptyCard: { alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#6B7280' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1, borderLeftWidth: 4, borderLeftColor: GameColors.error },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardNum: { fontSize: 12, color: GameColors.primary, fontWeight: '600' },
  cardDate: { fontSize: 11, color: '#9CA3AF' },
  question: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 8, lineHeight: 22 },
  answerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  label: { fontSize: 13, color: '#6B7280' },
  answer: { fontSize: 14, fontWeight: 'bold', color: GameColors.success },
  explanation: { fontSize: 13, color: '#4B5563', lineHeight: 20, backgroundColor: '#F9FAFB', padding: 10, borderRadius: 8 },
});
