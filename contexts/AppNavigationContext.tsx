import { useState, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';

export type AppSection = 'mygame' | 'data-overview' | 'community';

export const [AppNavigationProvider, useAppNavigation] = createContextHook(() => {
  const [currentSection, setCurrentSection] = useState<AppSection>('mygame');
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(false);
  const [dataOverviewInitialTab, setDataOverviewInitialTab] = useState<string | null>(null);

  const openSidebar = useCallback(() => {
    setSidebarVisible(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarVisible(false);
  }, []);

  const navigateTo = useCallback((section: AppSection, options?: { initialTab?: string }) => {
    console.log('[AppNav] Navigating to:', section, options);
    if (options?.initialTab) {
      setDataOverviewInitialTab(options.initialTab);
    }
    setCurrentSection(section);
    setSidebarVisible(false);
  }, []);

  const clearDataOverviewInitialTab = useCallback(() => {
    setDataOverviewInitialTab(null);
  }, []);

  return {
    currentSection,
    sidebarVisible,
    openSidebar,
    closeSidebar,
    navigateTo,
    dataOverviewInitialTab,
    clearDataOverviewInitialTab,
  };
});
