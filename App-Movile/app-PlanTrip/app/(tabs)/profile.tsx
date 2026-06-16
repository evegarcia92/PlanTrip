import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Modal, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Theme } from '@/constants/theme';
import CalendarPicker from '../../components/CalendarPicker';
import CustomButton from '../../components/CustomButton';

const PRESET_AVATARS = [
  { name: 'Aventurera', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
  { name: 'Mochilero', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
  { name: 'Exploradora', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
  { name: 'Senderista', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
  { name: 'Viajera', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150' },
  { name: 'Nómada', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' },
];

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuth();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  
  const [editGender, setEditGender] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editBirthdate, setEditBirthdate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const openEditModal = () => {
    setEditGender(user?.gender || '');
    setEditImage(user?.image || '');
    setEditBirthdate(user?.birthdate || '');
    setErrorMsg(null);
    setIsEditModalVisible(true);
  };

  const handleSave = async () => {
    setSaveLoading(true);
    setErrorMsg(null);
    try {
      const res = await updateProfile(editGender, editImage, editBirthdate);
      if (res.success) {
        setIsEditModalVisible(false);
      } else {
        setErrorMsg(res.error || 'Error al guardar los cambios');
      }
    } catch {
      setErrorMsg('Error al guardar los cambios');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Theme.colors.bgStart, Theme.colors.bgEnd]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Perfil</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <BlurView intensity={60} tint="light" style={styles.card}>
            <View style={styles.avatarContainer}>
              {user?.image ? (
                <Image source={{ uri: user.image }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <IconSymbol size={64} name="person.circle.fill" color={Theme.colors.primary} />
                </View>
              )}
            </View>
            <Text style={styles.username}>{user?.username || 'Invitado'}</Text>
            <Text style={styles.userId}>ID: {user?.id || '-'}</Text>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <IconSymbol size={20} name="person.fill" color={Theme.colors.primary} />
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Género</Text>
                <Text style={styles.infoValue}>{user?.gender || 'No especificado'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <IconSymbol size={20} name="calendar" color={Theme.colors.primary} />
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Fecha de Nacimiento</Text>
                <Text style={styles.infoValue}>{user?.birthdate || 'No especificada'}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
              <IconSymbol size={18} name="pencil" color="#fff" />
              <Text style={styles.editButtonText}>Editar Perfil</Text>
            </TouchableOpacity>
          </BlurView>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <IconSymbol size={22} name="rectangle.portrait.and.arrow.right" color="#fff" />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      {/* Edit Profile Modal */}
      <Modal visible={isEditModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <BlurView intensity={90} tint="light" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <IconSymbol size={24} name="xmark.circle.fill" color={Theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {errorMsg && (
              <View style={styles.errorBox}>
                <IconSymbol size={16} name="exclamationmark.circle.fill" color={Theme.colors.error} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            <ScrollView style={styles.modalForm} contentContainerStyle={styles.modalFormContent}>
              <Text style={styles.formLabel}>Avatar de Viajero</Text>
              <View style={styles.avatarsGrid}>
                {PRESET_AVATARS.map((av) => {
                  const isSelected = editImage === av.url;
                  return (
                    <TouchableOpacity
                      key={av.name}
                      style={[styles.avatarOption, isSelected && styles.avatarOptionSelected]}
                      onPress={() => setEditImage(av.url)}
                    >
                      <Image source={{ uri: av.url }} style={styles.avatarOptionImage} />
                      <Text style={[styles.avatarOptionText, isSelected && styles.avatarOptionTextSelected]}>
                        {av.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.formLabel}>O URL de Avatar Personalizado</Text>
              <View style={styles.inputContainer}>
                <IconSymbol name="photo" size={18} color={Theme.colors.primary} />
                <TextInput
                  style={styles.textInput}
                  placeholder="https://ejemplo.com/avatar.jpg"
                  placeholderTextColor={Theme.colors.textSecondary}
                  value={editImage}
                  onChangeText={setEditImage}
                  autoCapitalize="none"
                />
              </View>

              <Text style={styles.formLabel}>Género</Text>
              <View style={styles.genderRow}>
                {['Masculino', 'Femenino', 'Otro', 'No especificado'].map((g) => {
                  const isSelected = editGender === g || (g === 'No especificado' && !editGender);
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genderChip, isSelected && styles.genderChipSelected]}
                      onPress={() => setEditGender(g === 'No especificado' ? '' : g)}
                    >
                      <Text style={[styles.genderChipText, isSelected && styles.genderChipTextSelected]}>
                        {g}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.formLabel}>Fecha de Nacimiento</Text>
              <TouchableOpacity style={styles.birthdateButton} onPress={() => setShowCalendar(true)}>
                <IconSymbol name="calendar" size={18} color={Theme.colors.primary} />
                <Text style={[styles.birthdateButtonText, !editBirthdate && styles.placeholderText]}>
                  {editBirthdate || 'Seleccionar fecha'}
                </Text>
                <IconSymbol name="chevron.right" size={14} color={Theme.colors.textSecondary} />
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalFooter}>
              <CustomButton
                title="Guardar Cambios"
                onPress={handleSave}
                loading={saveLoading}
              />
            </View>
          </BlurView>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <CalendarPicker
        visible={showCalendar}
        selected={editBirthdate}
        onSelect={(d) => {
          setEditBirthdate(d);
          setShowCalendar(false);
        }}
        onClose={() => setShowCalendar(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { padding: 24, paddingTop: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: Theme.colors.textMain },
  scrollContent: { padding: 20, alignItems: 'center', gap: 24, paddingBottom: 130 },
  card: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
    backgroundColor: Theme.colors.surfaceLight,
  },
  avatarContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    backgroundColor: Theme.colors.color2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Theme.colors.primary,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: { fontSize: 24, fontWeight: 'bold', color: Theme.colors.textMain, marginBottom: 4 },
  userId: { fontSize: 13, color: Theme.colors.textSecondary, marginBottom: 20 },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: Theme.colors.borderDark,
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 12,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(105, 124, 178, 0.08)',
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 16,
    color: Theme.colors.textMain,
    fontWeight: '600',
    marginTop: 2,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    gap: 8,
    marginTop: 24,
  },
  editButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.error,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
    gap: 10,
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  // Modals Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '85%',
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
    backgroundColor: Theme.colors.surfaceLight,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderDark,
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: Theme.colors.textMain },
  modalForm: {
    maxHeight: 450,
  },
  modalFormContent: {
    paddingBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textMain,
    marginTop: 16,
    marginBottom: 8,
  },
  avatarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  avatarOption: {
    width: '30%',
    alignItems: 'center',
    borderRadius: 12,
    padding: 6,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  avatarOptionSelected: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '10',
  },
  avatarOptionImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 4,
  },
  avatarOptionText: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
  },
  avatarOptionTextSelected: {
    color: Theme.colors.primary,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.borderDark,
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    color: Theme.colors.textMain,
    padding: 12,
    fontSize: 14,
  },
  genderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genderChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: Theme.colors.borderDark,
  },
  genderChipSelected: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  genderChipText: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  genderChipTextSelected: {
    color: '#fff',
  },
  birthdateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.borderDark,
    padding: 12,
    gap: 12,
  },
  birthdateButtonText: {
    flex: 1,
    fontSize: 14,
    color: Theme.colors.textMain,
  },
  placeholderText: {
    color: Theme.colors.textSecondary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.error + '18',
    borderColor: Theme.colors.error,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 8,
    marginBottom: 10,
  },
  errorText: {
    color: Theme.colors.error,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderDark,
    paddingTop: 16,
    marginTop: 16,
  },
});
