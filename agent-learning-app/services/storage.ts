import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER_ID: '@hello_agent_user_id',
  ONBOARDING_COMPLETE: '@hello_agent_onboarding_complete',
  AUTH_TOKEN: '@hello_agent_token',
  THEME_MODE: '@hello_agent_theme',
};

export const storage = {
  async getUserId(): Promise<number | null> {
    const id = await AsyncStorage.getItem(KEYS.USER_ID);
    return id ? parseInt(id, 10) : null;
  },

  async setUserId(id: number): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER_ID, id.toString());
  },

  async isOnboardingComplete(): Promise<boolean> {
    const val = await AsyncStorage.getItem(KEYS.ONBOARDING_COMPLETE);
    return val === 'true';
  },

  async setOnboardingComplete(): Promise<void> {
    await AsyncStorage.setItem(KEYS.ONBOARDING_COMPLETE, 'true');
  },

  async getThemeMode(): Promise<'light' | 'dark' | 'system'> {
    const val = await AsyncStorage.getItem(KEYS.THEME_MODE);
    return (val as 'light' | 'dark' | 'system') || 'system';
  },

  async setThemeMode(mode: 'light' | 'dark' | 'system'): Promise<void> {
    await AsyncStorage.setItem(KEYS.THEME_MODE, mode);
  },
};
