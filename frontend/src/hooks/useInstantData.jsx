import { useState, useEffect, useCallback } from 'react';

const createCache = () => {
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for stale data
  const REFRESH_THRESHOLD = 5 * 1000; // 5 seconds for background refresh
  
  return {
    get: (key) => {
      try {
        const cached = localStorage.getItem(`instant_${key}`);
        if (!cached) return null;
        
        const { data, timestamp, lastFetch } = JSON.parse(cached);
        const now = Date.now();
        
        // Data is still valid if within cache duration
        if (now - timestamp < CACHE_DURATION) {
          return { 
            data, 
            needsRefresh: now - lastFetch > REFRESH_THRESHOLD
          };
        }
        
        // Data expired, remove it
        localStorage.removeItem(`instant_${key}`);
        return null;
      } catch { 
        return null; 
      }
    },
    
    set: (key, data) => {
      try {
        const now = Date.now();
        localStorage.setItem(`instant_${key}`, JSON.stringify({
          data, 
          timestamp: now,
          lastFetch: now
        }));
      } catch (error) {
        console.warn('Cache set failed:', error);
      }
    },
    
    touch: (key) => {
      try {
        const cached = localStorage.getItem(`instant_${key}`);
        if (cached) {
          const item = JSON.parse(cached);
          item.lastFetch = Date.now();
          localStorage.setItem(`instant_${key}`, JSON.stringify(item));
        }
      } catch (error) {
        console.warn('Cache touch failed:', error);
      }
    }
  };
};

const cache = createCache();

export const useInstantData = (pageKey, fetchFunction, processFunction) => {
  // 🚀 KEY CHANGE 1: Synchronous cache check BEFORE React state initialization
  // This happens immediately when the hook is called, not in useEffect
  const cached = cache.get(pageKey);
  
  // 🚀 KEY CHANGE 2: Initialize state with cached data immediately
  const [data, setData] = useState(cached?.data || []);
  
  // 🚀 KEY CHANGE 3: Start with loading=false if cached data exists
  const [loading, setLoading] = useState(!cached?.data);
  
  // 🚀 KEY CHANGE 4: Track if this is truly the first load
  const [isInitialLoad, setIsInitialLoad] = useState(!cached?.data);

  const fetchFreshData = useCallback(async (isBackgroundRefresh = false) => {
    try {
      // Only show loading for non-background refreshes when no cached data exists
      if (!isBackgroundRefresh && !cached?.data) {
        setLoading(true);
      }
      
      const rawData = await fetchFunction();
      const processedData = processFunction ? processFunction(rawData) : rawData;
      
      cache.set(pageKey, processedData);
      setData(processedData);
      
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    } catch (error) {
      console.error(`Error fetching data for ${pageKey}:`, error);
      // If we have cached data, don't show error state
      if (!isBackgroundRefresh && !cached?.data) {
        setLoading(false);
      }
    } finally {
      if (!isBackgroundRefresh) {
        setLoading(false);
      }
    }
  }, [pageKey, fetchFunction, processFunction, isInitialLoad, cached?.data]);

  const loadData = useCallback(async () => {
    // 🚀 KEY CHANGE 5: If we already have cached data, skip loading entirely
    if (cached && cached.data) {
      // Data already set synchronously in useState, just handle background refresh
      if (cached.needsRefresh) {
        fetchFreshData(true); // Background refresh only
      }
      return; // Exit early - we already have data
    }
    
    // Only if no cache exists, fetch fresh data
    if (!cached || !cached.data) {
      await fetchFreshData(false);
    }
  }, [pageKey, fetchFreshData, cached]);

  const preloadData = useCallback(() => {
    const currentCache = cache.get(pageKey);
    if (!currentCache || currentCache.needsRefresh) {
      fetchFreshData(true);
    } else {
      cache.touch(pageKey);
    }
  }, [pageKey, fetchFreshData]);

  // Auto-refresh every 30 seconds for fresh data
  useEffect(() => {
    const interval = setInterval(() => {
      const currentCache = cache.get(pageKey);
      if (currentCache && currentCache.needsRefresh) {
        fetchFreshData(true);
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [pageKey, fetchFreshData]);

  // 🚀 KEY CHANGE 6: Only load data if no cached data exists
  useEffect(() => {
    if (!cached?.data) {
      loadData();
    }
  }, [loadData, cached?.data]);

  return { 
    data, 
    loading,
    isInitialLoad,
    preloadData, 
    refreshData: () => fetchFreshData(false) 
  };
};