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
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Camera, User } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/contexts/ProfileContext';
import SignOutButton from '@/components/SignOutButton';

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
    loadProfile();
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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Settings saved successfully');
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (err: any) {
        console.error('[Settings] Avatar upload error:', err.message);
        Alert.alert('Error', 'Could not upload image. Try again.');
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  }, [uploadAvatar]);

  const updateField = (field: keyof ProfileData, value: string) => {
    const truncated = value.slice(0, 200);
    setFormData(prev => ({ ...prev, [field]: truncated }));
  };

  const initials = (profile?.username || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

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
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#2E7D32" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
                  <User size={32} color="#888" />
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
            <Text style={styles.changePhotoText}>Change Profile Photo</Text>
          </View>

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
                    placeholderTextColor="#999"
                    keyboardType={field.keyboardType || 'default'}
                    autoCapitalize={field.key === 'username' ? 'none' : 'sentences'}
                    autoCorrect={field.key === 'username' ? false : true}
                    maxLength={200}
                  />
                </View>
                {index < fields.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>

          <View style={styles.signOutContainer}>
             <SignOutButton />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#333',
  },
  saveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#2E7D32',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center' as const,
    paddingVertical: 24,
  },
  avatarTouchable: {
    position: 'relative' as const,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: '#D0D0D0',
  },
  cameraBadge: {
    position: 'absolute' as const,
    bottom: 0,
    right: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2E7D32',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: '#F5F5F5',
  },
  changePhotoText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2E7D32',
  },
  formContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  fieldRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#333',
    flex: 1,
  },
  fieldInput: {
    fontSize: 16,
    color: '#2E7D32',
    textAlign: 'right' as const,
    flex: 1,
    paddingVertical: 0,
  },
  divider: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginLeft: 20,
  },
  signOutContainer: {
    marginTop: 30,
    marginBottom: 40,
    paddingHorizontal: 16,
  },
});
