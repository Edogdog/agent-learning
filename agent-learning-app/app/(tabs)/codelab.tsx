import { View, Text, StyleSheet } from 'react-native';
import { GameColors } from '@/constants/theme';

export default function CodeLabScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>💻</Text>
      <Text style={styles.title}>代码实验室</Text>
      <Text style={styles.subtitle}>即将在 V0.2 版本上线</Text>
      <View style={styles.card}>
        <Text style={styles.feature}>✨ 内置 Python 代码编辑器</Text>
        <Text style={styles.feature}>🔧 一键环境配置向导</Text>
        <Text style={styles.feature}>▶️ 代码即学即练（观摩/填空/挑战模式）</Text>
        <Text style={styles.feature}>🤖 AI 代码纠错助手</Text>
      </View>
      <Text style={styles.hint}>请先完成第1-4章的学习，掌握Agent基础知识~</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', padding: 32 },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 16, color: GameColors.accent, marginBottom: 32 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', marginBottom: 24, elevation: 2 },
  feature: { fontSize: 15, color: '#374151', marginBottom: 12, lineHeight: 22 },
  hint: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
});
