import { View, StyleSheet } from 'react-native';

export function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <View style={styles.container}>
      {Array.from({ length: lines }).map((_, i) => (
        <View key={i} style={[styles.line, { width: `${70 + Math.random() * 30}%` }]} />
      ))}
    </View>
  );
}

export function CardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar} />
        <View style={styles.title} />
      </View>
      <View style={styles.line} />
      <View style={[styles.line, { width: '60%' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  line: { height: 14, backgroundColor: '#E5E7EB', borderRadius: 7, marginBottom: 10, opacity: 0.5 },
  card: { backgroundColor: '#F3F4F6', borderRadius: 14, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5E7EB' },
  title: { flex: 1, height: 16, backgroundColor: '#E5E7EB', borderRadius: 8, marginLeft: 12 },
});
