import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, UserStats } from '@/services/api';
import { storage } from '@/services/storage';
import { getLevelInfo } from '@/constants/game';

interface UserState {
  id: number;
  username: string;
  nickname: string;
  level: number;
  xp: number;
  levelTitle: string;
  levelEmoji: string;
  xpPercent: number;
  streakDays: number;
  stats: UserStats | null;
  isLoading: boolean;
  isOnboarding: boolean;
}

interface UserContextType extends UserState {
  setUser: (id: number, username: string, nickname: string) => void;
  refreshStats: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<UserState>({
    id: 0, username: '', nickname: '', level: 1, xp: 0,
    levelTitle: '新手小白', levelEmoji: '🌱', xpPercent: 0, streakDays: 0,
    stats: null, isLoading: true, isOnboarding: true,
  });

  useEffect(() => {
    (async () => {
      const userId = await storage.getUserId();
      const onboarded = await storage.isOnboardingComplete();
      if (userId && onboarded) {
        try {
          const stats = await api.getUserStats(userId);
          const info = getLevelInfo(stats.xp);
          setState(prev => ({
            ...prev, id: userId, username: '', nickname: '', level: info.level,
            xp: stats.xp, levelTitle: info.title, levelEmoji: info.emoji,
            xpPercent: info.progress * 100, streakDays: stats.streak_days,
            stats, isLoading: false, isOnboarding: false,
          }));
        } catch {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } else {
        setState(prev => ({ ...prev, isLoading: false, isOnboarding: !onboarded }));
      }
    })();
  }, []);

  const setUser = useCallback((id: number, username: string, nickname: string) => {
    storage.setUserId(id);
    setState(prev => ({ ...prev, id, username, nickname }));
  }, []);

  const refreshStats = useCallback(async () => {
    if (!state.id) return;
    try {
      const stats = await api.getUserStats(state.id);
      const info = getLevelInfo(stats.xp);
      setState(prev => ({
        ...prev, level: info.level, xp: stats.xp, levelTitle: info.title,
        levelEmoji: info.emoji, xpPercent: info.progress * 100,
        streakDays: stats.streak_days, stats,
      }));
    } catch { /* offline */ }
  }, [state.id]);

  const completeOnboarding = useCallback(async () => {
    await storage.setOnboardingComplete();
    setState(prev => ({ ...prev, isOnboarding: false }));
  }, []);

  return (
    <UserContext.Provider value={{ ...state, setUser, refreshStats, completeOnboarding }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be inside UserProvider');
  return ctx;
}
