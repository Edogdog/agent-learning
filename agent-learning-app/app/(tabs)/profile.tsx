import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@/hooks/use-user';
import { GameColors } from '@/constants/theme';
import { getLevelInfo } from '@/constants/game';

export default function ProfileScreen() {
  const { level, xp, levelTitle, levelEmoji, streakDays, stats } = useUser();
  const info = getLevelInfo(xp);
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarSection}>
        <Text style={styles.avatar}>{levelEmoji}</Text>
        <Text style={styles.name}>Lv.{level} {levelTitle}</Text>
        <Text style={styles.xpInfo}>{xp} XP · 距下一级还需 {info.xpToNext} XP</Text>
      </View>
      <View style={styles.statsGrid}>
        <StatBox label="连续打卡" value={`${streakDays}天`} />
        <StatBox label="完成测验" value={`${stats?.quizzes_completed || 0}次`} />
        <StatBox label="总学时" value={`${Math.floor((stats?.total_study_seconds || 0) / 3600)}h`} />
        <StatBox label="知识点" value={`${stats?.nodes_completed || 0}个`} />
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 成就徽章</Text>
        {stats?.achievements && stats.achievements.length > 0 ? (
          stats.achievements.map((a, i) => (
            <View key={i} style={styles.achievement}>
              <Text>🏅</Text>
              <Text style={styles.achName}>{a.id}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>还没有获得成就，开始学习吧！</Text>
        )}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 学习工具</Text>
        <Pressable style={styles.actionItem} onPress={() => router.push('/wrong-answers')}>
          <Text style={styles.actionIcon}>📝</Text>
          <Text style={styles.actionText}>错题本</Text>
          <Text style={styles.actionArrow}>→</Text>
        </Pressable>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ 设置</Text>
        <Text style={styles.settingItem}>🌙 深色模式（即将上线）</Text>
        <Text style={styles.settingItem}>🔔 学习提醒（即将上线）</Text>
        <Text style={styles.settingItem}>📤 数据导出（即将上线）</Text>
      </View>
    </ScrollView>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { fontSize: 64, marginBottom: 8 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  xpInfo: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statBox: { width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', elevation: 1 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: GameColors.primary },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  achievement: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  achName: { fontSize: 14, color: '#374151' },
  empty: { fontSize: 14, color: '#9CA3AF' },
  actionItem: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#EFF6FF', borderRadius: 10, marginTop: 8 },
  actionIcon: { fontSize: 20, marginRight: 12 },
  actionText: { flex: 1, fontSize: 15, fontWeight: '600', color: GameColors.primary },
  actionArrow: { fontSize: 16, color: GameColors.primary },
  settingItem: { fontSize: 14, color: '#6B7280', paddingVertical: 8 },
});
