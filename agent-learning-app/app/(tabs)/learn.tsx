import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@/hooks/use-user';
import { useProgress } from '@/hooks/use-progress';
import { GameColors } from '@/constants/theme';

export default function LearnScreen() {
  const { id } = useUser();
  const { chapters, isLoading } = useProgress(id || null);
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>📖 Hello Agent</Text>
      <Text style={styles.subtitle}>共 16 章 · 从基础到实战</Text>
      {chapters.map(ch => {
        const isLocked = ch.status === 'locked';
        return (
          <Pressable
            key={ch.id}
            style={[styles.card, isLocked && styles.cardLocked]}
            onPress={() => !isLocked && router.push({ pathname: '/chapter/[id]', params: { id: ch.id } })}>
            <Text style={styles.emoji}>{ch.emoji}</Text>
            <View style={styles.info}>
              <Text style={[styles.chapterTitle, isLocked && styles.textLocked]}>
                第{ch.id}章 · {ch.title}
              </Text>
              <Text style={styles.meta}>
                {ch.stage_count}个关卡 · 预计{ch.estimated_hours}小时
              </Text>
              {ch.status === 'in_progress' && (
                <View style={styles.progressRow}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${ch.completion_percent}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{ch.completion_percent}%</Text>
                </View>
              )}
            </View>
            <Text style={styles.statusIcon}>
              {ch.status === 'completed' ? '✅' : ch.status === 'in_progress' ? '🔄' : '🔒'}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#9CA3AF', marginBottom: 24 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, elevation: 1 },
  cardLocked: { opacity: 0.5 },
  emoji: { fontSize: 32, marginRight: 14 },
  info: { flex: 1 },
  chapterTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 4 },
  textLocked: { color: '#9CA3AF' },
  meta: { fontSize: 12, color: '#9CA3AF' },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  progressBar: { flex: 1, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: GameColors.success, borderRadius: 2 },
  progressText: { fontSize: 11, color: GameColors.success, marginLeft: 8 },
  statusIcon: { fontSize: 20, marginLeft: 8 },
});
