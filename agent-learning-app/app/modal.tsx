import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { api } from '@/services/api';
import { useUser } from '@/hooks/use-user';
import { GameColors } from '@/constants/theme';

export default function TutorModal() {
  const { id: userId, level } = useUser();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || !userId) return;
    const question = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setLoading(true);
    try {
      const res = await api.askTutor(question, userId, { user_level: level });
      setMessages(prev => [...prev, { role: 'assistant', content: res.answer }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，AI导师暂时无法回应 😅' }]);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>🤖</Text>
        <Text style={styles.headerTitle}>AI 导师 AgentBot</Text>
      </View>
      <ScrollView style={styles.chatArea} contentContainerStyle={styles.chatContent}>
        {messages.length === 0 && (
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeEmoji}>👋</Text>
            <Text style={styles.welcomeText}>你好！我是 AgentBot，你的AI学习导师。{'\n\n'}有任何关于Agent学习的问题，随时问我！</Text>
          </View>
        )}
        {messages.map((msg, i) => (
          <View key={i} style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
            <Text style={styles.bubbleText}>{msg.content}</Text>
          </View>
        ))}
        {loading && <ActivityIndicator style={styles.loading} />}
      </ScrollView>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="问 AgentBot 任何问题..."
          placeholderTextColor="#9CA3AF"
          multiline
          onSubmitEditing={sendMessage}
        />
        <Pressable style={styles.sendBtn} onPress={sendMessage} disabled={loading}>
          <Text style={styles.sendBtnText}>发送</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#fff' },
  headerEmoji: { fontSize: 28, marginRight: 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  chatArea: { flex: 1 },
  chatContent: { padding: 16 },
  welcomeCard: { alignItems: 'center', padding: 24, backgroundColor: '#fff', borderRadius: 12, marginTop: 20 },
  welcomeEmoji: { fontSize: 40, marginBottom: 12 },
  welcomeText: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 14, marginBottom: 10 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: GameColors.primary },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: '#fff' },
  bubbleText: { fontSize: 14, lineHeight: 20, color: '#111827' },
  loading: { alignSelf: 'center', marginTop: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#fff' },
  input: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, maxHeight: 80 },
  sendBtn: { backgroundColor: GameColors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginLeft: 8 },
  sendBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
