import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api, ChapterDetail, StageDetail } from '@/services/api';
import { useUser } from '@/hooks/use-user';
import { GameColors } from '@/constants/theme';

interface TeachMessage {
  role: 'ai' | 'user' | 'system';
  type?: 'teach' | 'quiz' | 'code' | 'encourage' | 'correct' | 'hint';
  content: string;
  options?: string[];
  correct_index?: number;
  explanation?: string;
  code_template?: string;
  xp_reward?: number;
  answered?: boolean;
}

export default function ChapterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { id: userId, refreshStats, xp } = useUser();
  const [chapter, setChapter] = useState<ChapterDetail | null>(null);
  const [stages, setStages] = useState<StageDetail[]>([]);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [currentNodeIdx, setCurrentNodeIdx] = useState(0);
  const [messages, setMessages] = useState<TeachMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [codeResult, setCodeResult] = useState('');
  const [showCodeLab, setShowCodeLab] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getChapterDetail(parseInt(id!), userId || undefined);
        setChapter(data);
        setStages(data.stages.filter(s => s.status !== 'locked'));
      } catch { /* handle */ }
      setLoading(false);
    })();
  }, [id]);

  // Auto-start AI teaching when chapter loads
  useEffect(() => {
    if (!chapter || !userId || messages.length > 0) return;
    startTeaching();
  }, [chapter, userId]);

  const startTeaching = async () => {
    if (!chapter || !userId) return;
    setSending(true);
    const stage = stages[currentStageIdx];
    if (!stage) { setSending(false); return; }
    try {
      const res = await fetch('http://localhost:8000/api/ai-teach/teach', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, chapter_id: chapter.id, stage_id: stage.id, node_id: '', user_message: '' }),
      });
      const data = await res.json();
      setMessages([{ role: 'ai', ...data }]);
      scrollToBottom();
    } catch { /* handle */ }
    setSending(false);
  };

  const handleOptionSelect = async (msgIdx: number, optionIdx: number) => {
    if (!userId) return;
    const msg = messages[msgIdx];
    if (msg.answered) return;
    const isCorrect = optionIdx === msg.correct_index;
    const updated = [...messages];
    updated[msgIdx] = { ...msg, answered: true };
    updated.push({ role: 'user', content: msg.options?.[optionIdx] || '' });
    setMessages(updated);
    setSending(true);
    try {
      const res = await fetch('http://localhost:8000/api/ai-teach/review', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, question: msg.content, user_answer: msg.options?.[optionIdx] || '', correct_answer: msg.options?.[msg.correct_index || 0] || '', explanation: msg.explanation || '' }),
      });
      const review = await res.json();
      setMessages(prev => [...prev, { role: 'ai', type: isCorrect ? 'correct' : 'encourage', content: review.content, xp_reward: review.xp_reward || (isCorrect ? 20 : 5) }]);
      if (review.xp_reward) await refreshStats();
      // Continue teaching next node
      setTimeout(() => advanceNode(), 1500);
    } catch { /* handle */ }
    setSending(false);
  };

  const advanceNode = async () => {
    if (!chapter || !userId) return;
    const nextNode = currentNodeIdx + 1;
    const stage = stages[currentStageIdx];
    if (!stage) return;
    const totalNodes = stage.node_count;
    if (nextNode < totalNodes) {
      setCurrentNodeIdx(nextNode);
    } else {
      // Move to next stage
      if (currentStageIdx + 1 < stages.length) {
        setCurrentStageIdx(currentStageIdx + 1);
        setCurrentNodeIdx(0);
      } else {
        setMessages(prev => [...prev, { role: 'system', content: `🎉 恭喜完成本章所有内容！获得 ${300} XP`, xp_reward: 300 }]);
        await refreshStats();
        return;
      }
    }
    setSending(true);
    const newStage = stages[currentStageIdx + (nextNode >= totalNodes ? 1 : 0)] || stages[currentStageIdx];
    try {
      const res = await fetch('http://localhost:8000/api/ai-teach/teach', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, chapter_id: chapter.id, stage_id: newStage.id, node_id: '', user_message: '继续下一个知识点' }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', ...data }]);
      scrollToBottom();
    } catch { /* handle */ }
    setSending(false);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !userId || !chapter) return;
    const stage = stages[currentStageIdx];
    setMessages(prev => [...prev, { role: 'user', content: inputText }]);
    setInputText('');
    setSending(true);
    try {
      const res = await fetch('http://localhost:8000/api/ai-teach/teach', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, chapter_id: chapter.id, stage_id: stage?.id || '', node_id: '', user_message: inputText }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', ...data }]);
      scrollToBottom();
    } catch { /* handle */ }
    setSending(false);
  };

  const handleRunCode = async () => {
    if (!codeInput.trim()) return;
    setCodeResult('运行中...');
    try {
      const res = await fetch('http://localhost:8000/api/code-lab/run', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeInput }),
      });
      const data = await res.json();
      setCodeResult(data.success ? data.stdout || '(无输出)' : data.stderr);
    } catch (e: any) { setCodeResult('运行失败: ' + e.message); }
  };

  const scrollToBottom = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

  if (loading) return <ActivityIndicator style={styles.loader} />;
  if (!chapter) return <Text style={styles.error}>加载失败</Text>;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>{chapter.emoji}</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{chapter.title}</Text>
          <Text style={styles.progress}>
            关卡 {currentStageIdx + 1}/{stages.length} · 知识点 {currentNodeIdx + 1}
          </Text>
        </View>
        <Pressable onPress={() => router.push({ pathname: '/quiz/[stageId]', params: { stageId: stages[currentStageIdx]?.id || '1-1' } })}>
          <Text style={styles.quizLink}>📝 测验</Text>
        </Pressable>
      </View>

      {/* AI Chat Area */}
      <ScrollView ref={scrollRef} style={styles.chatArea} contentContainerStyle={styles.chatContent}>
        {messages.map((msg, i) => (
          <View key={i} style={[
            styles.msgBubble,
            msg.role === 'ai' ? styles.aiMsg : msg.role === 'system' ? styles.sysMsg : styles.userMsg,
          ]}>
            {msg.role === 'ai' && <Text style={styles.aiAvatar}>🤖</Text>}
            <View style={[styles.msgContent, msg.role === 'user' && styles.userContent]}>
              <Text style={[styles.msgText, msg.role === 'user' && styles.userText]}>{msg.content}</Text>

              {/* Quiz options */}
              {msg.type === 'quiz' && msg.options && !msg.answered && (
                <View style={styles.options}>
                  {msg.options.map((opt, oi) => (
                    <Pressable key={oi} style={styles.optionBtn} onPress={() => handleOptionSelect(i, oi)}>
                      <Text style={styles.optionText}>{String.fromCharCode(65 + oi)}. {opt}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Code block */}
              {msg.type === 'code' && msg.code_template && (
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>{msg.code_template}</Text>
                  <Pressable style={styles.runBtn} onPress={() => { setCodeInput(msg.code_template || ''); setShowCodeLab(true); }}>
                    <Text style={styles.runBtnText}>▶️ 运行代码</Text>
                  </Pressable>
                </View>
              )}

              {/* Answer feedback */}
              {msg.answered !== undefined && (
                <Text style={[styles.answerBadge, msg.correct_index === msg.options?.findIndex((o: string, oi: number) => oi === (msg as any)._selected)]}>
                  {msg.answered ? '✅' : ''}
                </Text>
              )}

              {/* XP reward */}
              {msg.xp_reward && msg.xp_reward > 0 && (
                <Text style={styles.xpBadge}>+{msg.xp_reward} XP</Text>
              )}
            </View>
          </View>
        ))}
        {sending && <ActivityIndicator style={styles.typing} />}
      </ScrollView>

      {/* Code Lab Overlay */}
      {showCodeLab && (
        <View style={styles.codeLab}>
          <View style={styles.codeLabHeader}>
            <Text style={styles.codeLabTitle}>💻 代码实验室</Text>
            <Pressable onPress={() => setShowCodeLab(false)}><Text style={styles.closeBtn}>✕</Text></Pressable>
          </View>
          <TextInput style={styles.codeEditor} value={codeInput} onChangeText={setCodeInput} multiline placeholder="输入Python代码..." placeholderTextColor="#9CA3AF" />
          <View style={styles.codeActions}>
            <Pressable style={styles.runCodeBtn} onPress={handleRunCode}><Text style={styles.runCodeText}>▶️ 运行</Text></Pressable>
          </View>
          {codeResult ? <Text style={styles.codeOutput}>{codeResult}</Text> : null}
        </View>
      )}

      {/* Bottom Input */}
      {!showCodeLab && (
        <View style={styles.inputRow}>
          <TextInput style={styles.chatInput} value={inputText} onChangeText={setInputText} placeholder="输入你的回答或问题..." placeholderTextColor="#9CA3AF" onSubmitEditing={handleSendMessage} />
          <Pressable style={styles.sendBtn} onPress={handleSendMessage}><Text style={styles.sendBtnText}>发送</Text></Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loader: { flex: 1, justifyContent: 'center' },
  error: { textAlign: 'center', marginTop: 40, fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerEmoji: { fontSize: 28, marginRight: 10 },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  progress: { fontSize: 12, color: '#9CA3AF' },
  quizLink: { color: GameColors.accent, fontWeight: '600', fontSize: 14 },
  chatArea: { flex: 1 },
  chatContent: { padding: 12, paddingBottom: 20 },
  msgBubble: { flexDirection: 'row', marginBottom: 14, maxWidth: '90%' },
  aiMsg: { alignSelf: 'flex-start' },
  userMsg: { alignSelf: 'flex-end' },
  sysMsg: { alignSelf: 'center' },
  aiAvatar: { fontSize: 22, marginRight: 8, marginTop: 2 },
  msgContent: { backgroundColor: '#fff', borderRadius: 14, padding: 12, borderTopLeftRadius: 4 },
  userContent: { backgroundColor: GameColors.primary, borderTopLeftRadius: 14, borderTopRightRadius: 4 },
  msgText: { fontSize: 14, color: '#374151', lineHeight: 21 },
  userText: { color: '#fff' },
  options: { marginTop: 10, gap: 6 },
  optionBtn: { backgroundColor: '#F3F4F6', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  optionText: { fontSize: 13, color: '#374151' },
  codeBlock: { backgroundColor: '#1E293B', padding: 12, borderRadius: 8, marginTop: 8 },
  codeText: { color: '#E2E8F0', fontSize: 12, fontFamily: 'monospace', lineHeight: 18 },
  runBtn: { backgroundColor: GameColors.success, padding: 6, borderRadius: 6, marginTop: 8, alignSelf: 'flex-start' },
  runBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  answerBadge: { marginTop: 6, fontSize: 12 },
  xpBadge: { position: 'absolute', top: -8, right: -8, backgroundColor: GameColors.xpBar, color: '#fff', fontSize: 10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, overflow: 'hidden', fontWeight: 'bold' },
  typing: { alignSelf: 'center', marginTop: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#fff' },
  chatInput: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
  sendBtn: { backgroundColor: GameColors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginLeft: 8 },
  sendBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  codeLab: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, elevation: 10, maxHeight: '60%' },
  codeLabHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  codeLabTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  closeBtn: { fontSize: 20, color: '#9CA3AF' },
  codeEditor: { backgroundColor: '#1E293B', color: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 13, fontFamily: 'monospace', minHeight: 120, textAlignVertical: 'top' },
  codeActions: { flexDirection: 'row', marginTop: 10, gap: 10 },
  runCodeBtn: { backgroundColor: GameColors.success, padding: 10, borderRadius: 8, alignItems: 'center', flex: 1 },
  runCodeText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  codeOutput: { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8, marginTop: 8, fontSize: 13, fontFamily: 'monospace', color: '#374151' },
});
