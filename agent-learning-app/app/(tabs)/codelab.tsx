import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { GameColors } from '@/constants/theme';

const EXAMPLES: Record<string, { title: string; code: string; hint: string }> = {
  hello: { title: '🌤️ 天气查询函数', code: 'def get_weather(city: str) -> str:\n    """查询城市天气"""\n    # 实际应用中这里会调用API\n    weather_data = {"北京": "晴天 26°C", "上海": "多云 24°C"}\n    return weather_data.get(city, "未知城市")\n\n# 测试\nprint(get_weather("北京"))\nprint(get_weather("上海"))', hint: '定义一个函数，根据城市名返回天气信息' },
  agent: { title: '🤖 简单Agent循环', code: 'def agent_loop(query: str) -> str:\n    """最简单的Agent循环\"\"\"\n    print(f"🤖 Agent收到任务: {query}")\n    \n    # Thought: 思考阶段\n    print("💭 Thought: 我需要理解这个查询")\n    \n    # Action: 行动阶段\n    if "天气" in query:\n        result = "查询到天气信息：晴天"\n    elif "时间" in query:\n        import datetime\n        result = f"当前时间：{datetime.datetime.now()}"\n    else:\n        result = "我理解你的问题，让我想想..."\n    \n    print(f"⚡ Action: {result}")\n    return result\n\nprint(agent_loop("今天天气怎么样？"))', hint: '实现一个简单的Agent感知-思考-行动循环' },
  react: { title: '🔄 ReAct模式演示', code: '# ReAct = Reasoning + Acting\nimport json\n\ndef react_agent(task):\n    print(f"📋 任务: {task}")\n    steps = []\n    \n    # Step 1: Thought\n    print("💭 Thought: 我需要分析这个任务...")\n    steps.append("分析任务")\n    \n    # Step 2: Action\n    print("⚡ Action: 搜索相关信息...")\n    steps.append("搜索信息")\n    \n    # Step 3: Observation\n    print("👁️ Observation: 找到相关信息")\n    steps.append("观察结果")\n    \n    # Step 4: Final Thought\n    print("💭 Thought: 现在我有足够信息回答")\n    \n    return f"✅ 完成！执行了{len(steps)}个步骤: {steps}"\n\nresult = react_agent("帮我查一下北京的天气和景点")\nprint(result)', hint: '模拟ReAct模式的完整循环：Thought→Action→Observation→Answer' },
};

export default function CodeLabScreen() {
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [activeExample, setActiveExample] = useState<string | null>(null);

  const loadExample = (key: string) => {
    const ex = EXAMPLES[key];
    setCode(ex.code);
    setActiveExample(key);
    setOutput('');
  };

  const runCode = async () => {
    if (!code.trim()) return;
    setRunning(true);
    setOutput('⏳ 运行中...');
    try {
      const res = await fetch('http://localhost:8000/api/code-lab/run', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.success) {
        setOutput(data.stdout || '(无输出)');
      } else {
        setOutput(`❌ 错误:\n${data.stderr}`);
      }
    } catch (e: any) {
      setOutput(`❌ 网络错误: ${e.message}`);
    }
    setRunning(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💻 代码实验室</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.exampleRow}>
        {Object.entries(EXAMPLES).map(([key, ex]) => (
          <Pressable key={key} style={[styles.exampleChip, activeExample === key && styles.exampleActive]} onPress={() => loadExample(key)}>
            <Text style={styles.exampleText}>{ex.title}</Text>
            <Text style={styles.exampleHint}>{ex.hint}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.editorContainer}>
        <TextInput style={styles.editor} value={code} onChangeText={setCode} multiline placeholder="在这里编写 Python 代码..." placeholderTextColor="#6B7280" textAlignVertical="top" />
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.runBtn} onPress={runCode} disabled={running}>
          <Text style={styles.runText}>{running ? '⏳' : '▶️'} 运行代码</Text>
        </Pressable>
        <Pressable style={styles.clearBtn} onPress={() => { setCode(''); setOutput(''); }}>
          <Text style={styles.clearText}>清空</Text>
        </Pressable>
      </View>
      {output ? (
        <View style={styles.outputContainer}>
          <Text style={styles.outputTitle}>📤 输出</Text>
          <ScrollView style={styles.outputScroll}>
            <Text style={styles.outputText}>{output}</Text>
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 16, paddingTop: 50 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#F1F5F9', marginBottom: 14 },
  exampleRow: { maxHeight: 80, marginBottom: 12 },
  exampleChip: { backgroundColor: '#1E293B', borderRadius: 10, padding: 10, marginRight: 10, width: 180 },
  exampleActive: { borderColor: GameColors.success, borderWidth: 2 },
  exampleText: { color: '#E2E8F0', fontSize: 13, fontWeight: '600' },
  exampleHint: { color: '#94A3B8', fontSize: 11, marginTop: 2 },
  editorContainer: { flex: 1, backgroundColor: '#1E293B', borderRadius: 12, overflow: 'hidden' },
  editor: { flex: 1, color: '#E2E8F0', fontSize: 13, fontFamily: 'monospace', padding: 14, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  runBtn: { flex: 1, backgroundColor: GameColors.success, padding: 14, borderRadius: 10, alignItems: 'center' },
  runText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  clearBtn: { backgroundColor: '#334155', padding: 14, borderRadius: 10, alignItems: 'center', width: 80 },
  clearText: { color: '#CBD5E1', fontSize: 14 },
  outputContainer: { backgroundColor: '#1E293B', borderRadius: 12, padding: 14, marginTop: 12, maxHeight: 180 },
  outputTitle: { color: GameColors.success, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  outputScroll: { maxHeight: 140 },
  outputText: { color: '#CBD5E1', fontSize: 12, fontFamily: 'monospace', lineHeight: 18 },
});
