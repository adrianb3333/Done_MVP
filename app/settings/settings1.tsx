import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
// --- NEW IMPORT ---
import SignOutButton from '@/components/SignOutButton'; 

interface ProfileData {
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
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

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
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
        Alert.alert('Success', 'Settings saved successfully');
      }
    } catch (error) {
      console.log('Error:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof ProfileData, value: string) => {
    const truncated = value.slice(0, 200);
    setFormData(prev => ({ ...prev, [field]: truncated }));
  };

  const fields: { key: keyof ProfileData; label: string; placeholder: string; keyboardType?: 'default' | 'email-address' }[] = [
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
        <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={saving}>
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
                    maxLength={200}
                  />
                </View>
                {index < fields.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>

          {/* --- ADDED SIGN OUT BUTTON HERE --- */}
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
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    backgroundColor: '#fff',
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  fieldInput: {
    fontSize: 16,
    color: '#2E7D32',
    textAlign: 'right',
    flex: 1,
    paddingVertical: 0,
  },
  divider: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginLeft: 20,
  },
  // --- ADDED STYLE ---
  signOutContainer: {
    marginTop: 30,
    marginBottom: 40,
    paddingHorizontal: 16,
  },
});
