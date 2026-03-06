import { useState, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';

export type AppSection = 'mygame' | 'data-overview' | 'community';

export const [AppNavigationProvider, useAppNavigation] = createContextHook(() => {
  const [currentSection, setCurrentSection] = useState<AppSection>('mygame');
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(false);
  const [dataOverviewInitialTab, setDataOverviewInitialTab] = useState<string | null>(null);
  const [dataOverviewInitialStatsSegment, setDataOverviewInitialStatsSegment] = useState<'round' | 'practice' | null>(null);

  const openSidebar = useCallback(() => {
    setSidebarVisible(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarVisible(false);
  }, []);

  const navigateTo = useCallback((section: AppSection, options?: { initialTab?: string; initialStatsSegment?: 'round' | 'practice' }) => {
    console.log('[AppNav] Navigating to:', section, options);
    if (options?.initialTab) {
      setDataOverviewInitialTab(options.initialTab);
    }
    if (options?.initialStatsSegment) {
      setDataOverviewInitialStatsSegment(options.initialStatsSegment);
    }
    setCurrentSection(section);
    setSidebarVisible(false);
  }, []);

  const clearDataOverviewInitialTab = useCallback(() => {
    setDataOverviewInitialTab(null);
  }, []);

  const clearDataOverviewInitialStatsSegment = useCallback(() => {
    setDataOverviewInitialStatsSegment(null);
  }, []);

  return useMemo(() => ({
    currentSection,
    sidebarVisible,
    openSidebar,
    closeSidebar,
    navigateTo,
    dataOverviewInitialTab,
    clearDataOverviewInitialTab,
    dataOverviewInitialStatsSegment,
    clearDataOverviewInitialStatsSegment,
  }), [
    currentSection,
    sidebarVisible,
    openSidebar,
    closeSidebar,
    navigateTo,
    dataOverviewInitialTab,
    clearDataOverviewInitialTab,
    dataOverviewInitialStatsSegment,
    clearDataOverviewInitialStatsSegment,
  ]);
});
