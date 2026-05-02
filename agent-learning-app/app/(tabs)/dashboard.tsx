import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useUser } from '@/hooks/use-user';
import { useProgress } from '@/hooks/use-progress';
import { GameColors } from '@/constants/theme';
import { getLevelInfo } from '@/constants/game';

export default function DashboardScreen() {
  const { id, level, xp, levelTitle, levelEmoji, streakDays, stats, refreshStats } = useUser();
  const { chapters } = useProgress(id || null);
  const info = getLevelInfo(xp);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>AgentBot 的修行之路</Text>
      <View style={styles.levelCard}>
        <Text style={styles.levelEmoji}>{levelEmoji}</Text>
        <View style={styles.levelInfo}>
          <Text style={styles.levelTitle}>等级 {level} · {levelTitle}</Text>
          <View style={styles.xpBar}>
            <View style={[styles.xpFill, { width: `${Math.min(info.progress * 100, 100)}%` }]} />
          </View>
          <Text style={styles.xpText}>{xp} / {xp + info.xpToNext} XP</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <StatCard label="总学时" value={`${Math.floor((stats?.total_study_seconds || 0) / 3600)}h`} />
        <StatCard label="测验数" value={`${stats?.quizzes_completed || 0}道`} />
        <StatCard label="知识点" value={`${stats?.nodes_completed || 0}个`} />
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 连续打卡 {streakDays} 天</Text>
        <Text style={styles.sectionSubtext}>{streakDays >= 7 ? '🔥 太棒了，保持下去！' : '每天进步一点点 💪'}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📖 学习进度</Text>
        {chapters.slice(0, 4).map(ch => (
          <View key={ch.id} style={styles.chapterRow}>
            <Text style={styles.chapterEmoji}>{ch.emoji}</Text>
            <View style={styles.chapterInfo}>
              <Text style={styles.chapterTitle}>{ch.title}</Text>
              <View style={styles.chapterBar}>
                <View style={[styles.chapterFill, { width: `${ch.completion_percent}%` }]} />
              </View>
            </View>
            <Text style={styles.chapterPercent}>{ch.completion_percent}%</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingTop: 60 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
  levelCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4 },
  levelEmoji: { fontSize: 48, marginRight: 16 },
  levelInfo: { flex: 1 },
  levelTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 },
  xpBar: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, marginBottom: 4 },
  xpFill: { height: 8, backgroundColor: GameColors.xpBar, borderRadius: 4 },
  xpText: { fontSize: 12, color: '#9CA3AF' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', elevation: 1 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: GameColors.primary },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  sectionSubtext: { fontSize: 13, color: GameColors.accent },
  chapterRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  chapterEmoji: { fontSize: 24, marginRight: 12 },
  chapterInfo: { flex: 1 },
  chapterTitle: { fontSize: 14, color: '#374151', marginBottom: 4 },
  chapterBar: { height: 4, backgroundColor: '#E5E7EB', borderRadius: 2 },
  chapterFill: { height: 4, backgroundColor: GameColors.success, borderRadius: 2 },
  chapterPercent: { fontSize: 12, color: '#9CA3AF', marginLeft: 8 },
});
