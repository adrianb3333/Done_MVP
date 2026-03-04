import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { ChevronUp } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSession } from '@/contexts/SessionContext';

export default function MiniSessionModal() {
  const { sessionType, expandSession, finishSession } = useSession();
  const [showConfirm, setShowConfirm] = useState(false);

  const sessionLabel = sessionType === 'play' ? 'Round in Progress' : 'Practice Session';

  const handleFinishPress = () => {
    setShowConfirm(true);
  };

  const handleConfirmYes = () => {
    setShowConfirm(false);
    finishSession();
  };

  const handleConfirmNo = () => {
    setShowConfirm(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.modal}>
        <TouchableOpacity
          style={styles.expandButton}
          onPress={expandSession}
          activeOpacity={0.7}
        >
          <ChevronUp size={28} color={Colors.primary} strokeWidth={2.5} />
          <Text style={styles.sessionLabel}>{sessionLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.finishButton}
          onPress={handleFinishPress}
          activeOpacity={0.8}
        >
          <Text style={styles.finishText}>Finish</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={handleConfirmNo}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Are you sure?</Text>
            <Text style={styles.confirmMessage}>
              {sessionType === 'play'
                ? 'Do you want to finish this round?'
                : 'Do you want to finish this practice session?'}
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmNo}
                onPress={handleConfirmNo}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmNoText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmYes}
                onPress={handleConfirmYes}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmYesText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  modal: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sessionLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  finishButton: {
    backgroundColor: Colors.error,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  finishText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBox: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 15,
    color: '#aaa',
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row' as const,
    gap: 12,
    width: '100%',
  },
  confirmNo: {
    flex: 1,
    backgroundColor: Colors.border,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center' as const,
  },
  confirmNoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  confirmYes: {
    flex: 1,
    backgroundColor: Colors.error,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center' as const,
  },
  confirmYesText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
