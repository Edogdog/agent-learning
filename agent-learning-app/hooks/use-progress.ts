import { useState, useEffect, useCallback } from 'react';
import { api, ChapterSummary } from '@/services/api';

export function useProgress(userId: number | null) {
  const [chapters, setChapters] = useState<ChapterSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) { setIsLoading(false); return; }
    try {
      const data = await api.getChapters(userId);
      setChapters(data);
    } catch { /* offline */ }
    setIsLoading(false);
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { chapters, isLoading, refetch: fetch };
}
