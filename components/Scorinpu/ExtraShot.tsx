import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface ExtraShotProps {
  initialBunkerShots: number;
  initialPenaltyShots: number;
  initialChips: number;
  initialSandSave: boolean;
  initialUpAndDown: boolean;
  isLastHole: boolean;
  onDone: (bunkerShots: number, penaltyShots: number, chips: number, sandSave: boolean, upAndDown: boolean) => void;
  onPrevious: () => void;
}

export default function ExtraShot({
  initialBunkerShots,
  initialPenaltyShots,
  initialChips,
  initialSandSave,
  initialUpAndDown,
  isLastHole,
  onDone,
  onPrevious,
}: ExtraShotProps) {
  const [bunkerShots, setBunkerShots] = useState<number>(initialBunkerShots);
  const [penaltyShots, setPenaltyShots] = useState<number>(initialPenaltyShots);
  const [chips, setChips] = useState<number>(initialChips);
  const [sandSave, setSandSave] = useState<boolean>(initialSandSave);
  const [upAndDown, setUpAndDown] = useState<boolean>(initialUpAndDown);

  useEffect(() => {
    setBunkerShots(initialBunkerShots);
    setPenaltyShots(initialPenaltyShots);
    setChips(initialChips);
    setSandSave(initialSandSave);
    setUpAndDown(initialUpAndDown);
  }, [initialBunkerShots, initialPenaltyShots, initialChips, initialSandSave, initialUpAndDown]);

  const handleDone = () => {
    onDone(bunkerShots, penaltyShots, chips, sandSave, upAndDown);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <CounterRow label="Bunkerslag" value={bunkerShots} onDecrement={() => setBunkerShots(Math.max(0, bunkerShots - 1))} onIncrement={() => setBunkerShots(bunkerShots + 1)} />
        <CounterRow label="Pliktslag" value={penaltyShots} onDecrement={() => setPenaltyShots(Math.max(0, penaltyShots - 1))} onIncrement={() => setPenaltyShots(penaltyShots + 1)} />
        <CounterRow label="Chippar" value={chips} onDecrement={() => setChips(Math.max(0, chips - 1))} onIncrement={() => setChips(chips + 1)} />

        <View style={styles.toggleRow}>
          <View style={styles.toggleItem}>
            <Text style={styles.toggleLabel}>Sand Save</Text>
            <Switch
              value={sandSave}
              onValueChange={setSandSave}
              trackColor={{ false: '#3a3a3a', true: '#444444' }}
              thumbColor={sandSave ? '#fff' : '#888'}
            />
          </View>
          <View style={styles.toggleItem}>
            <Text style={styles.toggleLabel}>Up & Down</Text>
            <Switch
              value={upAndDown}
              onValueChange={setUpAndDown}
              trackColor={{ false: '#3a3a3a', true: '#444444' }}
              thumbColor={upAndDown ? '#fff' : '#888'}
            />
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.prevBtn} onPress={onPrevious} activeOpacity={0.7}>
          <Text style={styles.prevBtnText}>Föregående</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.doneBtn} onPress={handleDone} activeOpacity={0.7}>
          <Text style={styles.doneBtnText}>{isLastHole ? 'Klar' : 'Klar'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface CounterRowProps {
  label: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
}

function CounterRow({ label, value, onDecrement, onIncrement }: CounterRowProps) {
  return (
    <View style={styles.counterSection}>
      <Text style={styles.counterLabel}>{label}</Text>
      <View style={styles.counterRow}>
        <TouchableOpacity style={styles.counterBtn} onPress={onDecrement} activeOpacity={0.7}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.counterValue}>{value}</Text>
        <TouchableOpacity style={styles.counterBtn} onPress={onIncrement} activeOpacity={0.7}>
          <ChevronRight size={24} color="#fff" />
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
    paddingTop: 16,
  },
  counterSection: {
    marginBottom: 24,
  },
  counterLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  counterBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#fff',
    minWidth: 40,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginTop: 8,
  },
  toggleItem: {
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#aaa',
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
  doneBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#333333',
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
