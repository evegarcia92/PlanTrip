import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Theme } from '@/constants/theme';
import CustomButton from '@/components/CustomButton';

export default function LoginScreen() {
  const { login, register, error, clearError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    setFieldError(null);
    setSuccessMsg(null);
    clearError();
  }, [isLogin, clearError]);

  const displayError = fieldError || error;

  const handleAuth = async () => {
    setFieldError(null);
    setSuccessMsg(null);
    clearError();

    if (!username || !password) {
      setFieldError('Por favor completa todos los campos.');
      return;
    }

    if (username.trim().length < 3) {
      setFieldError('El nombre de usuario debe tener al menos 3 caracteres.');
      return;
    }

    if (password.length < 6) {
      setFieldError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = isLogin
        ? await login(username.trim(), password)
        : await register(username.trim(), password);

      if (res.success) {
        if (!isLogin) {
          setSuccessMsg('Usuario registrado correctamente');
        }
      }
    } catch {
      setFieldError('Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[Theme.colors.bgStart, Theme.colors.bgEnd]}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <IconSymbol name="airplane.circle.fill" size={80} color={Theme.colors.primary} />
            <Text style={styles.title}>PlanTrip</Text>
            <Text style={styles.subtitle}>Tu viaje soñado, a un toque</Text>
          </View>

          <BlurView intensity={50} tint="light" style={styles.card}>
            <Text style={styles.cardTitle}>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</Text>

            {displayError && (
              <View style={styles.feedbackBox}>
                <IconSymbol name="exclamationmark.circle.fill" size={18} color={Theme.colors.error} />
                <Text style={styles.feedbackErrorText}>{displayError}</Text>
              </View>
            )}

            {successMsg && (
              <View style={[styles.feedbackBox, { backgroundColor: Theme.colors.success + '22', borderColor: Theme.colors.success }]}>
                <IconSymbol name="checkmark.circle.fill" size={18} color={Theme.colors.success} />
                <Text style={styles.feedbackSuccessText}>{successMsg}</Text>
              </View>
            )}
            
            <View style={styles.inputContainer}>
              <IconSymbol name="person.fill" size={20} color={Theme.colors.textSecondary} />
              <TextInput 
                style={styles.input} 
                placeholder="Usuario" 
                placeholderTextColor={Theme.colors.textSecondary}
                value={username}
                onChangeText={(t) => { setUsername(t); setFieldError(null); clearError(); }}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <IconSymbol name="lock.fill" size={20} color={Theme.colors.textSecondary} />
              <TextInput 
                style={styles.input} 
                placeholder="Contraseña" 
                placeholderTextColor={Theme.colors.textSecondary}
                secureTextEntry
                value={password}
                onChangeText={(t) => { setPassword(t); setFieldError(null); clearError(); }}
              />
            </View>

            <CustomButton
              title={isLogin ? 'Ingresar' : 'Registrarse'}
              onPress={handleAuth}
              loading={loading}
              style={styles.button}
            />

            <TouchableOpacity style={styles.switchButton} onPress={() => setIsLogin(!isLogin)}>
              <Text style={styles.switchText}>
                {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
              </Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.6,
  },
  circle1: {
    width: 300,
    height: 300,
    backgroundColor: Theme.colors.color2,
    top: -100,
    right: -100,
    filter: 'blur(50px)' // If supported, else relies on color mixing
  },
  circle2: {
    width: 250,
    height: 250,
    backgroundColor: Theme.colors.secondary,
    bottom: -50,
    left: -100,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: Theme.colors.primary,
    marginTop: 10,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    marginTop: 5,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
    backgroundColor: Theme.colors.surfaceLight
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.textMain,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceLight,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Theme.colors.borderDark,
  },
  input: {
    flex: 1,
    color: Theme.colors.textMain,
    paddingVertical: 14,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  button: {
    marginTop: 10,
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: Theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.error + '22',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Theme.colors.error,
    gap: 8,
  },
  feedbackErrorText: {
    color: Theme.colors.error,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  feedbackSuccessText: {
    color: Theme.colors.success,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  }
});
