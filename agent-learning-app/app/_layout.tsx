import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useUser, UserProvider } from '@/hooks/use-user';
import { GameColors } from '@/constants/theme';
import { useEffect } from 'react';

function RootNavigator() {
  const colorScheme = useColorScheme();
  const { isOnboarding, isLoading } = useUser();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inOnboardingGroup = segments[0] === '(onboarding)';
    if (isOnboarding && !inOnboardingGroup) {
      router.replace('/(onboarding)/welcome');
    } else if (!isOnboarding && inOnboardingGroup) {
      router.replace('/(tabs)/dashboard');
    }
  }, [isOnboarding, isLoading, segments]);

  if (isLoading) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="chapter/[id]" options={{ headerShown: true, title: '章节学习', headerBackTitle: '返回' }} />
        <Stack.Screen name="quiz/[stageId]" options={{ headerShown: true, title: '知识测验', headerBackTitle: '返回' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'AI 导师' }} />
      </Stack>
      <TutorFAB />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

function TutorFAB() {
  const router = useRouter();
  const segments = useSegments();
  const { isOnboarding } = useUser();
  if (isOnboarding || segments[0] === '(onboarding)') return null;

  return (
    <Pressable
      style={styles.fab}
      onPress={() => router.push('/modal')}>
      <StatusBar style="auto" />
    </Pressable>
  );
}

export default function RootLayout() {
  return (
    <UserProvider>
      <RootNavigator />
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GameColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    zIndex: 100,
  },
});
