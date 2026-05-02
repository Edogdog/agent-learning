import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { GameColors } from '@/constants/theme';
import { useUser } from '@/hooks/use-user';

export default function RecommendationScreen() {
  const router = useRouter();
  const { path, desc } = useLocalSearchParams<{ path: string; desc: string }>();
  const { completeOnboarding } = useUser();

  const pathNames: Record<string, string> = {
    full: '全能路线',
    speed: '速成路线',
    deep: '深度路线',
    interview: '面试路线',
    lowcode: '低代码路线',
  };

  const handleStart = async () => {
    await completeOnboarding();
    router.replace('/(tabs)/dashboard');
  };

  return (
    <LinearGradient colors={['#F8FAFC', '#EFF6FF']} style={styles.container}>
      <Text style={styles.emoji}>🎯</Text>
      <Text style={styles.title}>为你定制的学习路径</Text>
      <View style={styles.pathCard}>
        <Text style={styles.pathName}>{pathNames[path || 'full'] || '全能路线'}</Text>
        <Text style={styles.pathDesc}>{desc || '系统性从零开始，按章节顺序完整学习全部16章内容。'}</Text>
      </View>
      <View style={styles.infoRow}>
        <View style={styles.infoItem}><Text style={styles.infoValue}>4章</Text><Text style={styles.infoLabel}>已解锁</Text></View>
        <View style={styles.infoItem}><Text style={styles.infoValue}>16章</Text><Text style={styles.infoLabel}>总计</Text></View>
        <View style={styles.infoItem}><Text style={styles.infoValue}>~16周</Text><Text style={styles.infoLabel}>预计</Text></View>
      </View>
      <Pressable style={styles.button} onPress={handleStart}>
        <Text style={styles.buttonText}>开始学习 🚀</Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 24 },
  pathCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, marginBottom: 24, width: '100%', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  pathName: { fontSize: 20, fontWeight: 'bold', color: GameColors.primary, marginBottom: 8 },
  pathDesc: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
  infoRow: { flexDirection: 'row', marginBottom: 40, gap: 24 },
  infoItem: { alignItems: 'center' },
  infoValue: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  infoLabel: { fontSize: 13, color: '#9CA3AF' },
  button: { backgroundColor: GameColors.primary, paddingHorizontal: 48, paddingVertical: 16, borderRadius: 30 },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
});
