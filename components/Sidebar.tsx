import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { X, Gamepad2, BarChart3, Users } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppNavigation, AppSection } from '@/contexts/AppNavigationContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.75;

interface SidebarItem {
  key: AppSection;
  label: string;
  icon: React.ReactNode;
  subItems?: string[];
}

const sections: SidebarItem[] = [
  {
    key: 'mygame',
    label: 'MyGame',
    icon: <Gamepad2 size={20} color="#00E676" />,
    subItems: ['Profile', 'PLAY', 'PRACTICE'],
  },
  {
    key: 'data-overview',
    label: 'Data Overview',
    icon: <BarChart3 size={20} color="#4FC3F7" />,
    subItems: ['Stats', 'SG', 'Shots', 'Details', 'Video'],
  },
  {
    key: 'community',
    label: 'Community',
    icon: <Users size={20} color="#FFB74D" />,
    subItems: ['Tour', 'Affiliate', 'Entertainment'],
  },
];

export default function Sidebar() {
  const { sidebarVisible, closeSidebar, navigateTo, currentSection } = useAppNavigation();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (sidebarVisible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 20,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SIDEBAR_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [sidebarVisible, slideAnim, overlayAnim]);

  return (
    <Modal
      visible={sidebarVisible}
      transparent
      animationType="none"
      onRequestClose={closeSidebar}
    >
      <View style={styles.root}>
        <Animated.View
          style={[
            styles.overlay,
            { opacity: overlayAnim },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={closeSidebar}
            activeOpacity={1}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sidebar,
            {
              width: SIDEBAR_WIDTH,
              transform: [{ translateX: slideAnim }],
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + 20,
            },
          ]}
        >
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>Navigation</Text>
            <TouchableOpacity onPress={closeSidebar} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={22} color="#8A9B90" />
            </TouchableOpacity>
          </View>

          <View style={styles.sectionsList}>
            {sections.map((section) => {
              const isActive = currentSection === section.key;
              return (
                <TouchableOpacity
                  key={section.key}
                  style={[styles.sectionItem, isActive && styles.sectionItemActive]}
                  onPress={() => navigateTo(section.key)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sectionRow}>
                    <View style={[styles.sectionIconWrap, isActive && styles.sectionIconWrapActive]}>
                      {section.icon}
                    </View>
                    <View style={styles.sectionInfo}>
                      <Text style={[styles.sectionLabel, isActive && styles.sectionLabelActive]}>
                        {section.label}
                      </Text>
                      {section.subItems && (
                        <Text style={styles.sectionSubs}>
                          {section.subItems.join(' · ')}
                        </Text>
                      )}
                    </View>
                  </View>
                  {isActive && <View style={styles.activeIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.sidebarFooter}>
            <View style={styles.footerDivider} />
            <Text style={styles.footerText}>Golf App v1.0</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sidebar: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#0D1410',
    borderRightWidth: 1,
    borderRightColor: '#1C2922',
    justifyContent: 'space-between' as const,
  },
  sidebarHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sidebarTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#F5F7F6',
    letterSpacing: 0.3,
  },
  closeBtn: {
    padding: 6,
  },
  sectionsList: {
    flex: 1,
    paddingHorizontal: 12,
    gap: 6,
  },
  sectionItem: {
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  sectionItemActive: {
    backgroundColor: '#141C18',
    borderWidth: 1,
    borderColor: '#243028',
  },
  sectionRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    gap: 14,
  },
  sectionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#141C18',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: '#243028',
  },
  sectionIconWrapActive: {
    backgroundColor: '#1A2520',
    borderColor: '#00E67630',
  },
  sectionInfo: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#8A9B90',
  },
  sectionLabelActive: {
    color: '#F5F7F6',
  },
  sectionSubs: {
    fontSize: 12,
    color: '#5A6B60',
    marginTop: 3,
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00E676',
  },
  sidebarFooter: {
    paddingHorizontal: 20,
  },
  footerDivider: {
    height: 1,
    backgroundColor: '#1C2922',
    marginBottom: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#5A6B60',
    textAlign: 'center' as const,
  },
});
