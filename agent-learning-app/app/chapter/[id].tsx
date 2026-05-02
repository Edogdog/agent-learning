import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api, ChapterDetail, StageDetail, NodeDetail } from '@/services/api';
import { useUser } from '@/hooks/use-user';
import { GameColors } from '@/constants/theme';

export default function ChapterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { id: userId, refreshStats } = useUser();
  const [chapter, setChapter] = useState<ChapterDetail | null>(null);
  const [selectedStage, setSelectedStage] = useState<StageDetail | null>(null);
  const [nodes, setNodes] = useState<NodeDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getChapterDetail(parseInt(id!), userId || undefined);
        setChapter(data);
      } catch { /* handle */ }
      setLoading(false);
    })();
  }, [id]);

  const loadStageNodes = async (stage: StageDetail) => {
    setSelectedStage(stage);
    try {
      const data = await api.getStageNodes(stage.id, userId || undefined);
      setNodes(data.nodes);
    } catch { /* handle */ }
  };

  const markNodeComplete = async (nodeId: string) => {
    if (!userId) return;
    try {
      const result = await api.completeNode(selectedStage!.id, { user_id: userId, node_id: nodeId });
      setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, status: 'completed' } : n));
      await refreshStats();
      if (result.level_up) {
        alert(`🎉 升级了！达到 Lv.${result.new_level}`);
      }
      if (result.unlocked_achievements.length > 0) {
        result.unlocked_achievements.forEach(a => alert(`🏆 获得成就: ${a.name}`));
      }
    } catch { /* handle */ }
  };

  if (loading) return <ActivityIndicator style={styles.loader} />;
  if (!chapter) return <Text style={styles.error}>加载失败</Text>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{chapter.emoji}</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{chapter.title}</Text>
          <Text style={styles.meta}>{chapter.stages.length}个关卡 · 预计{chapter.estimated_hours}小时</Text>
        </View>
      </View>
      <Text style={styles.sectionTitle}>关卡列表</Text>
      {chapter.stages.map(stage => (
        <Pressable
          key={stage.id}
          style={[styles.stageCard, selectedStage?.id === stage.id && styles.stageCardActive]}
          onPress={() => loadStageNodes(stage)}>
          <Text style={styles.stageEmoji}>{stage.theme_emoji}</Text>
          <View style={styles.stageInfo}>
            <Text style={styles.stageTitle}>关卡 {stage.order}: {stage.title}</Text>
            <Text style={styles.stageMeta}>⏱️ {stage.estimated_minutes}分钟 · {stage.node_count}个知识点</Text>
            {stage.status === 'completed' && <Text style={styles.completed}>✅ 已完成</Text>}
          </View>
        </Pressable>
      ))}
      {selectedStage && (
        <View style={styles.nodesSection}>
          <Text style={styles.nodeSectionTitle}>📄 {selectedStage.title}</Text>
          {nodes.map((node, i) => (
            <View key={node.id} style={[styles.nodeCard, node.status === 'completed' && styles.nodeDone]}>
              <Text style={styles.nodeTitle}>{node.title}</Text>
              <Text style={styles.nodeContent} numberOfLines={6}>{node.content}</Text>
              <View style={styles.nodeFooter}>
                <Text style={styles.xpLabel}>+{node.xp_reward} XP</Text>
                {node.status === 'unlocked' && (
                  <Pressable style={styles.completeBtn} onPress={() => markNodeComplete(node.id)}>
                    <Text style={styles.completeBtnText}>标记完成 ✓</Text>
                  </Pressable>
                )}
                {node.status === 'completed' && <Text style={styles.doneLabel}>✅ 已完成</Text>}
              </View>
            </View>
          ))}
          <Pressable
            style={styles.quizBtn}
            onPress={() => router.push({ pathname: '/quiz/[stageId]', params: { stageId: selectedStage.id } })}>
            <Text style={styles.quizBtnText}>📝 开始测验</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loader: { flex: 1, justifyContent: 'center' },
  error: { textAlign: 'center', marginTop: 40, color: '#EF4444' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 20, backgroundColor: '#fff' },
  emoji: { fontSize: 48, marginRight: 16 },
  headerInfo: { flex: 1 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  meta: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', margin: 20, marginBottom: 12, color: '#111827' },
  stageCard: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 10, backgroundColor: '#fff', borderRadius: 12, padding: 14, elevation: 1 },
  stageCardActive: { borderColor: GameColors.primary, borderWidth: 2 },
  stageEmoji: { fontSize: 28, marginRight: 12 },
  stageInfo: { flex: 1 },
  stageTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  stageMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  completed: { fontSize: 12, color: GameColors.success, marginTop: 4 },
  nodesSection: { marginTop: 20, paddingHorizontal: 20 },
  nodeSectionTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 12, color: '#111827' },
  nodeCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 1 },
  nodeDone: { opacity: 0.6 },
  nodeTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 8 },
  nodeContent: { fontSize: 13, color: '#4B5563', lineHeight: 20, marginBottom: 12 },
  nodeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xpLabel: { fontSize: 12, color: GameColors.xpBar },
  completeBtn: { backgroundColor: GameColors.success, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  completeBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  doneLabel: { fontSize: 12, color: GameColors.success },
  quizBtn: { backgroundColor: GameColors.accent, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, marginBottom: 40 },
  quizBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
