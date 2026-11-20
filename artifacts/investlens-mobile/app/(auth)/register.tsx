import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/auth';

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);

  const submit = async () => {
    if (!email.trim() || password.length < 8) {
      Alert.alert('Vérifiez le formulaire', 'Saisissez une adresse e-mail et un mot de passe d’au moins 8 caractères.');
      return;
    }
    setPending(true);
    try {
      await signUp(firstName, email, password);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Inscription impossible', error instanceof Error ? error.message : 'Réessayez dans un instant.');
    } finally {
      setPending(false);
    }
  };

  return (
    <KeyboardAwareScrollViewCompat style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingTop: insets.top + 18, paddingBottom: insets.bottom + 20, paddingHorizontal: 24 }} bottomOffset={36} keyboardShouldPersistTaps="handled">
      <Pressable accessibilityLabel="Fermer" onPress={() => router.back()} style={[styles.close, { backgroundColor: colors.muted }]}><Feather name="x" size={19} color={colors.foreground} /></Pressable>
      <Text style={[styles.brand, { color: colors.mutedForeground }]}>INVESTLENS</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>Créez votre compte.</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Suivez vos investissements au même endroit.</Text>

      <Text style={[styles.label, { color: colors.foreground }]}>Prénom (facultatif)</Text>
      <TextInput testID="register-first-name" value={firstName} onChangeText={setFirstName} placeholder="Votre prénom" placeholderTextColor={colors.mutedForeground} autoCapitalize="words" style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
      <Text style={[styles.label, { color: colors.foreground }]}>Adresse e-mail</Text>
      <TextInput testID="register-email" value={email} onChangeText={setEmail} placeholder="vous@exemple.fr" placeholderTextColor={colors.mutedForeground} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textContentType="emailAddress" style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
      <Text style={[styles.label, { color: colors.foreground }]}>Mot de passe</Text>
      <TextInput testID="register-password" value={password} onChangeText={setPassword} placeholder="8 caractères minimum" placeholderTextColor={colors.mutedForeground} secureTextEntry textContentType="newPassword" onSubmitEditing={submit} returnKeyType="go" style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />

      <Pressable accessibilityRole="button" testID="register-submit" disabled={pending} onPress={submit} style={[styles.submit, { backgroundColor: colors.primary, opacity: pending ? 0.65 : 1 }]}>
        {pending ? <ActivityIndicator color={colors.primaryForeground} /> : <><Text style={[styles.submitText, { color: colors.primaryForeground }]}>Créer mon compte</Text><Feather name="arrow-right" size={17} color={colors.primaryForeground} /></>}
      </Pressable>
      <Pressable testID="go-to-login" onPress={() => router.replace('/(auth)/login')} style={styles.footer}><Text style={[styles.footerText, { color: colors.mutedForeground }]}>Déjà inscrit ? </Text><Text style={[styles.link, { color: colors.foreground }]}>Se connecter</Text></Pressable>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  close: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end', marginBottom: 18 },
  brand: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 2, marginBottom: 12 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 27, letterSpacing: -0.7 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 16 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginBottom: 8, marginTop: 12 },
  input: { minHeight: 51, borderWidth: 1, borderRadius: 14, paddingHorizontal: 15, fontFamily: 'Inter_400Regular', fontSize: 15 },
  submit: { minHeight: 54, borderRadius: 15, marginTop: 23, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  submitText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 22, padding: 7 },
  footerText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  link: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
});
