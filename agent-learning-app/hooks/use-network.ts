import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

export function useNetwork() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const update = () => setIsOnline(navigator.onLine);
      window.addEventListener('online', update);
      window.addEventListener('offline', update);
      return () => {
        window.removeEventListener('online', update);
        window.removeEventListener('offline', update);
      };
    }
  }, []);

  return isOnline;
}
