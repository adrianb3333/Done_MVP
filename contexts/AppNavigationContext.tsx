import { useState, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';

export type AppSection = 'mygame' | 'data-overview' | 'community';

export const [AppNavigationProvider, useAppNavigation] = createContextHook(() => {
  const [currentSection, setCurrentSection] = useState<AppSection>('mygame');
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(false);

  const openSidebar = useCallback(() => {
    setSidebarVisible(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarVisible(false);
  }, []);

  const navigateTo = useCallback((section: AppSection) => {
    console.log('[AppNav] Navigating to:', section);
    setCurrentSection(section);
    setSidebarVisible(false);
  }, []);

  return {
    currentSection,
    sidebarVisible,
    openSidebar,
    closeSidebar,
    navigateTo,
  };
});
