import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { GreenMiss } from '@/contexts/ScoringContext';

interface GreenProps {
  initialGreenMiss: GreenMiss | null;
  onNext: (greenMiss: GreenMiss) => void;
  onPrevious: () => void;
}

export default function Green({ initialGreenMiss, onNext, onPrevious }: GreenProps) {
  const [selected, setSelected] = useState<GreenMiss | null>(initialGreenMiss);

  useEffect(() => {
    setSelected(initialGreenMiss);
  }, [initialGreenMiss]);

  const handleSelect = (miss: GreenMiss) => {
    setSelected(miss);
  };

  const handleNext = () => {
    if (!selected) return;
    onNext(selected);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Missade du greenen?</Text>
        <Text style={styles.subtitle}>Var?</Text>

        <View style={styles.greenLayout}>
          <TouchableOpacity
            style={[styles.directionBtn, styles.topBtn, selected === 'long' && styles.directionBtnActive]}
            onPress={() => handleSelect('long')}
            activeOpacity={0.7}
          >
            <Text style={[styles.directionText, selected === 'long' && styles.directionTextActive]}>Lång</Text>
          </TouchableOpacity>

          <View style={styles.middleRow}>
            <TouchableOpacity
              style={[styles.directionBtn, selected === 'left' && styles.directionBtnActive]}
              onPress={() => handleSelect('left')}
              activeOpacity={0.7}
            >
              <Text style={[styles.directionText, selected === 'left' && styles.directionTextActive]}>Vänster</Text>
            </TouchableOpacity>

            <View style={styles.greenCircle}>
              <View style={styles.flagPole} />
              <View style={styles.flag} />
              <View style={styles.greenOval} />
            </View>

            <TouchableOpacity
              style={[styles.directionBtn, selected === 'right' && styles.directionBtnActive]}
              onPress={() => handleSelect('right')}
              activeOpacity={0.7}
            >
              <Text style={[styles.directionText, selected === 'right' && styles.directionTextActive]}>Höger</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.directionBtn, styles.bottomBtn, selected === 'short' && styles.directionBtnActive]}
            onPress={() => handleSelect('short')}
            activeOpacity={0.7}
          >
            <Text style={[styles.directionText, selected === 'short' && styles.directionTextActive]}>Kort</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.hitBtn, selected === 'hit' && styles.hitBtnActive]}
            onPress={() => handleSelect('hit')}
            activeOpacity={0.7}
          >
            <Text style={[styles.hitBtnText, selected === 'hit' && styles.hitBtnTextActive]}>Missade inte</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.prevBtn} onPress={onPrevious} activeOpacity={0.7}>
          <Text style={styles.prevBtnText}>Föregående</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextBtn, !selected && styles.nextBtnDisabled]}
          onPress={handleNext}
          activeOpacity={0.7}
          disabled={!selected}
        >
          <Text style={styles.nextBtnText}>Nästa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 24,
  },
  greenLayout: {
    alignItems: 'center',
    gap: 12,
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  directionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#2a3a2e',
    borderWidth: 1.5,
    borderColor: '#3a4a3e',
    minWidth: 90,
    alignItems: 'center',
  },
  directionBtnActive: {
    backgroundColor: '#1B5E20',
    borderColor: '#2e7d32',
  },
  topBtn: {},
  bottomBtn: {},
  directionText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#aaa',
  },
  directionTextActive: {
    color: '#fff',
  },
  greenCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4caf50',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  greenOval: {
    width: 60,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#66bb6a',
    position: 'absolute',
    bottom: 8,
  },
  flagPole: {
    width: 2,
    height: 30,
    backgroundColor: '#333',
    position: 'absolute',
    top: 10,
    zIndex: 2,
  },
  flag: {
    width: 14,
    height: 10,
    backgroundColor: '#e53935',
    position: 'absolute',
    top: 10,
    left: 41,
    zIndex: 2,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  hitBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#2a3a2e',
    borderWidth: 1.5,
    borderColor: '#3a4a3e',
  },
  hitBtnActive: {
    backgroundColor: '#1B5E20',
    borderColor: '#2e7d32',
  },
  hitBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#aaa',
  },
  hitBtnTextActive: {
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  prevBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2a3a2e',
    alignItems: 'center',
  },
  prevBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  nextBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1B5E20',
    alignItems: 'center',
  },
  nextBtnDisabled: {
    opacity: 0.5,
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
