import React, { useState } from "react";
import { StyleSheet, Text, ScrollView, View, Pressable, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LiquidGlassCard from "@/components/reusables/LiquidGlassCard";

import SwingThoughtsModal from "@/app/modals/swing-thoughts-modal";
import ClubModal from "@/app/modals/club-modal";
import MentalGameModal from "@/app/modals/mental-game-modal";
import GolfIQModal from "@/app/modals/golf-iq-modal";
import GeneralModal from "@/app/modals/general-modal";
import PreRoundModal from "@/app/modals/pre-round-modal";

type ModalKey = 'swing-thoughts' | 'club' | 'mental-game' | 'golf-iq' | 'general' | 'pre-round' | null;

const NOTES_DATA: { title: string; description: string; modalKey: ModalKey }[] = [
  { title: "Swing Thoughts", description: "Describe Every Detail Of Your Swing", modalKey: "swing-thoughts" },
  { title: "Club", description: "Learn your Club Difference", modalKey: "club" },
  { title: "Mental Game", description: '"Golf is 90% mental and 10% physical."', modalKey: "mental-game" },
  { title: "Golf IQ", description: "Manage Yourself On The Course", modalKey: "golf-iq" },
  { title: "General", description: "Your Own Focus", modalKey: "general" },
];

const PREPARATION_DATA = {
  title: "Pre Round",
  description: "Create routines to perform better!",
  modalKey: "pre-round" as ModalKey,
};

export default function MindTab() {
  const [activeModal, setActiveModal] = useState<ModalKey>(null);

  const closeModal = () => setActiveModal(null);

  const renderModal = () => {
    switch (activeModal) {
      case 'swing-thoughts': return <SwingThoughtsModal onClose={closeModal} />;
      case 'club': return <ClubModal onClose={closeModal} />;
      case 'mental-game': return <MentalGameModal onClose={closeModal} />;
      case 'golf-iq': return <GolfIQModal onClose={closeModal} />;
      case 'general': return <GeneralModal onClose={closeModal} />;
      case 'pre-round': return <PreRoundModal onClose={closeModal} />;
      default: return null;
    }
  };

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>Documentation & The Technical!</Text>
          
          {NOTES_DATA.map((note, index) => (
            <Pressable 
              key={index} 
              onPress={() => setActiveModal(note.modalKey)}
              style={styles.cardContainer}
            >
              <LiquidGlassCard containerStyle={styles.card}>
                <View style={styles.cardContent}>
                  <View style={styles.textContainer}>
                    <Text style={styles.cardTitle}>{note.title}</Text>
                    <Text style={styles.cardDescription}>{note.description}</Text>
                  </View>
                </View>
              </LiquidGlassCard>
            </Pressable>
          ))}

          <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Preparation!</Text>

          <Pressable 
            onPress={() => setActiveModal(PREPARATION_DATA.modalKey)}
            style={styles.cardContainer}
          >
            <LiquidGlassCard containerStyle={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.textContainer}>
                  <Text style={styles.cardTitle}>{PREPARATION_DATA.title}</Text>
                  <Text style={styles.cardDescription}>{PREPARATION_DATA.description}</Text>
                </View>
              </View>
            </LiquidGlassCard>
          </Pressable>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={activeModal !== null}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeModal}
      >
        {renderModal()}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#020d12' },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 100 },
  sectionTitle: { fontSize: 28, fontWeight: "700" as const, color: '#006735', marginBottom: 16, textAlign: 'center' },
  cardContainer: { marginBottom: 12 },
  card: { width: '100%' },
  cardContent: { flexDirection: 'row' as const, alignItems: 'center' as const, padding: 16 },
  textContainer: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 18, fontWeight: "700" as const, color: '#FFCC00' },
  cardDescription: { fontSize: 14, color: '#FFFFFF', lineHeight: 18 },
});
