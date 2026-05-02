import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { GameColors } from '@/constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <LinearGradient colors={[GameColors.primary, '#1D4ED8']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🤖</Text>
        <Text style={styles.greeting}>你好，未来的智能体构建者！</Text>
        <Text style={styles.intro}>我是你的学习伙伴 AgentBot</Text>
        <Text style={styles.subtitle}>
          在2088年的赛博世界，你是一名新晋的Agent架构师学徒。{'\n'}
          让我们从零开始，一步步成长为智能体大师！
        </Text>
      </View>
      <Pressable style={styles.button} onPress={() => router.push('/(onboarding)/questionnaire')}>
        <Text style={styles.buttonText}>开始入学测试 🚀</Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  content: { alignItems: 'center', marginBottom: 60 },
  emoji: { fontSize: 80, marginBottom: 24 },
  greeting: { fontSize: 26, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  intro: { fontSize: 18, color: '#BFDBFE', marginBottom: 24, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#93C5FD', textAlign: 'center', lineHeight: 22 },
  button: { backgroundColor: '#fff', paddingHorizontal: 48, paddingVertical: 16, borderRadius: 30, elevation: 4 },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: GameColors.primary },
});
