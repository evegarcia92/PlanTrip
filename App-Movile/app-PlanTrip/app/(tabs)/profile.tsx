import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Theme } from '@/constants/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.replace('/login');
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

        <View style={styles.content}>
          <BlurView intensity={60} tint="light" style={styles.card}>
            <View style={styles.avatar}>
              <IconSymbol size={48} name="person.circle.fill" color={Theme.colors.primary} />
            </View>
            <Text style={styles.username}>{user?.username || 'Invitado'}</Text>
            <Text style={styles.userId}>ID: {user?.id || '-'}</Text>
          </BlurView>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <IconSymbol size={22} name="rectangle.portrait.and.arrow.right" color="#fff" />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { padding: 24, paddingTop: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: Theme.colors.textMain },
  content: { flex: 1, padding: 20, alignItems: 'center', gap: 30 },
  card: {
    width: '100%',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
    backgroundColor: Theme.colors.surfaceLight,
  },
  avatar: { marginBottom: 16 },
  username: { fontSize: 22, fontWeight: 'bold', color: Theme.colors.textMain, marginBottom: 4 },
  userId: { fontSize: 14, color: Theme.colors.textSecondary },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.error,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    gap: 10,
  },
  logoutText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
