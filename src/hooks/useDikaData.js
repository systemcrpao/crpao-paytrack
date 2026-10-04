import { useCallback, useEffect } from 'react';
import { useDikaStore } from '../store/dikaStore';

export function useDikaData({ autoLoad = true } = {}) {
  const allItems = useDikaStore((state) => state.items);
  const users = useDikaStore((state) => state.users);
  const loading = useDikaStore((state) => state.loading);
  const error = useDikaStore((state) => state.error);
  const loadBootstrap = useDikaStore((state) => state.loadBootstrap);
  const revalidateBootstrap = useDikaStore((state) => state.revalidateBootstrap);

  useEffect(() => {
    if (!autoLoad) return;
    void loadBootstrap();
  }, [autoLoad, loadBootstrap]);

  const refresh = useCallback(async () => {
    await revalidateBootstrap({ blocking: true });
  }, [revalidateBootstrap]);

  return {
    allItems,
    users,
    loading,
    error,
    refresh,
  };
}
