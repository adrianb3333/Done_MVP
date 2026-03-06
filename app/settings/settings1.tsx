import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, User, ChevronRight, LogOut } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/contexts/ProfileContext';
import Colors from '@/constants/colors';

interface ProfileData {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string;
  sex: string;
  home_course: string;
  country: string;
}

export default function Settings1Screen() {
  const router = useRouter();
  const { profile, uploadAvatar, updateProfile, refetchAll } = useProfile();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    date_of_birth: '',
    sex: '',
    home_course: '',
    country: '',
  });

  useEffect(() => {
    void loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.log('Error loading profile:', error);
      }

      if (data) {
        setFormData({
          username: data.username || '',
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || user.email || '',
          date_of_birth: data.date_of_birth || '',
          sex: data.sex || '',
          home_course: data.home_course || '',
          country: data.country || '',
        });
      } else {
        setFormData(prev => ({
          ...prev,
          email: user.email || '',
        }));
      }
    } catch (error) {
      console.log('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to save settings');
        return;
      }

      await updateProfile({
        username: formData.username.trim(),
      });

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: formData.username.trim(),
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          date_of_birth: formData.date_of_birth,
          sex: formData.sex,
          home_course: formData.home_course,
          country: formData.country,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.log('Save error:', error);
        Alert.alert('Error', 'Failed to save settings');
      } else {
        refetchAll();
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Saved', 'Your settings have been updated.');
      }
    } catch (error) {
      console.log('Error:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handlePickAvatar = useCallback(async () => {
    console.log('[Settings] Picking avatar');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need access to your photo library.');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setIsUploadingAvatar(true);
      try {
        await uploadAvatar(result.assets[0].uri);
        console.log('[Settings] Avatar uploaded successfully');
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (err: any) {
        console.error('[Settings] Avatar upload error:', err.message);
        Alert.alert('Error', 'Could not upload image. Try again.');
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  }, [uploadAvatar]);

  const handleGoBack = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }, [router]);

  const handleSignOut = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
              Alert.alert('Error', error.message);
            } else {
              console.log('User signed out successfully');
            }
          },
        },
      ]
    );
  }, []);

  const updateField = (field: keyof ProfileData, value: string) => {
    const truncated = value.slice(0, 200);
    setFormData(prev => ({ ...prev, [field]: truncated }));
  };

  const fields: { key: keyof ProfileData; label: string; placeholder: string; keyboardType?: 'default' | 'email-address' }[] = [
    { key: 'username', label: 'Username', placeholder: 'Enter username' },
    { key: 'first_name', label: 'First Name', placeholder: 'Enter first name' },
    { key: 'last_name', label: 'Last Name', placeholder: 'Enter last name' },
    { key: 'email', label: 'Email', placeholder: 'Enter email', keyboardType: 'email-address' },
    { key: 'date_of_birth', label: 'Date of Birth', placeholder: 'YYYY-MM-DD' },
    { key: 'sex', label: 'Sex', placeholder: 'Enter sex' },
    { key: 'home_course', label: 'Home Course', placeholder: 'Enter home course' },
    { key: 'country', label: 'Country', placeholder: 'Enter country' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable
            onPress={handleGoBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            testID="settings-back-button"
          >
            <ArrowLeft size={22} color={Colors.textPrimary} />
            <Text style={styles.backLabel}>Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            disabled={saving}
            activeOpacity={0.7}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.accent} />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.avatarSection}>
              <TouchableOpacity
                onPress={handlePickAvatar}
                style={styles.avatarTouchable}
                activeOpacity={0.8}
                testID="settings-avatar-button"
              >
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <User size={36} color={Colors.textMuted} />
                  </View>
                )}
                <View style={styles.cameraBadge}>
                  {isUploadingAvatar ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Camera size={14} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </View>

            <Text style={styles.sectionLabel}>PROFILE</Text>
            <View style={styles.formContainer}>
              {fields.map((field, index) => (
                <View key={field.key}>
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={formData[field.key]}
                      onChangeText={(value) => updateField(field.key, value)}
                      placeholder={field.placeholder}
                      placeholderTextColor={Colors.textMuted}
                      keyboardType={field.keyboardType || 'default'}
                      autoCapitalize={field.key === 'username' ? 'none' : 'sentences'}
                      autoCorrect={field.key === 'username' ? false : true}
                      maxLength={200}
                      selectionColor={Colors.accent}
                    />
                  </View>
                  {index < fields.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>

            <Text style={styles.sectionLabel}>ACCOUNT</Text>
            <TouchableOpacity
              style={styles.signOutRow}
              onPress={handleSignOut}
              activeOpacity={0.6}
            >
              <View style={styles.signOutLeft}>
                <LogOut size={18} color={Colors.error} />
                <Text style={styles.signOutText}>Sign Out</Text>
              </View>
              <ChevronRight size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            <Text style={styles.versionText}>Version 1.0.0</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 12,
    borderRadius: 8,
    minWidth: 70,
  },
  backButtonPressed: {
    opacity: 0.5,
  },
  backLabel: {
    fontSize: 16,
    color: Colors.textPrimary,
    marginLeft: 4,
    fontWeight: '500' as const,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.accentDim,
    minWidth: 70,
    alignItems: 'center' as const,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  avatarSection: {
    alignItems: 'center' as const,
    paddingVertical: 28,
  },
  avatarTouchable: {
    position: 'relative' as const,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.surface,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  cameraBadge: {
    position: 'absolute' as const,
    bottom: 0,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 3,
    borderColor: Colors.background,
  },
  changePhotoText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginLeft: 20,
    marginBottom: 8,
    marginTop: 8,
  },
  formContainer: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  fieldRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    flex: 0.45,
  },
  fieldInput: {
    fontSize: 15,
    color: Colors.textPrimary,
    textAlign: 'right' as const,
    flex: 0.55,
    paddingVertical: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginLeft: 16,
  },
  signOutRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  signOutLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.error,
  },
  versionText: {
    textAlign: 'center' as const,
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 32,
  },
});
