import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/auth';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Informations manquantes', 'Saisissez votre adresse e-mail et votre mot de passe.');
      return;
    }
    setPending(true);
    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Connexion impossible', error instanceof Error ? error.message : 'Vérifiez vos identifiants.');
    } finally {
      setPending(false);
    }
  };

  return (
    <KeyboardAwareScrollViewCompat style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingTop: insets.top + 18, paddingBottom: insets.bottom + 20, paddingHorizontal: 24 }} bottomOffset={32} keyboardShouldPersistTaps="handled">
      <Pressable accessibilityLabel="Fermer" onPress={() => router.back()} style={[styles.close, { backgroundColor: colors.muted }]}><Feather name="x" size={19} color={colors.foreground} /></Pressable>
      <View style={[styles.mark, { backgroundColor: colors.muted }]}><Feather name="activity" size={26} color={colors.foreground} /></View>
      <Text style={[styles.brand, { color: colors.mutedForeground }]}>INVESTLENS</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>Ravi de vous revoir.</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Connectez-vous pour retrouver votre portefeuille.</Text>

      <Text style={[styles.label, { color: colors.foreground }]}>Adresse e-mail</Text>
      <TextInput testID="login-email" accessibilityLabel="Adresse e-mail" value={email} onChangeText={setEmail} placeholder="vous@exemple.fr" placeholderTextColor={colors.mutedForeground} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textContentType="emailAddress" style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
      <Text style={[styles.label, { color: colors.foreground }]}>Mot de passe</Text>
      <TextInput testID="login-password" accessibilityLabel="Mot de passe" value={password} onChangeText={setPassword} placeholder="Votre mot de passe" placeholderTextColor={colors.mutedForeground} secureTextEntry textContentType="password" onSubmitEditing={submit} returnKeyType="go" style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />

      <Pressable accessibilityRole="button" testID="login-submit" disabled={pending} onPress={submit} style={[styles.submit, { backgroundColor: colors.primary, opacity: pending ? 0.65 : 1 }]}>
        {pending ? <ActivityIndicator color={colors.primaryForeground} /> : <><Text style={[styles.submitText, { color: colors.primaryForeground }]}>Se connecter</Text><Feather name="arrow-right" size={17} color={colors.primaryForeground} /></>}
      </Pressable>
      <View style={styles.footer}><Text style={[styles.footerText, { color: colors.mutedForeground }]}>Nouveau sur InvestLens ?</Text><Pressable testID="go-to-register" onPress={() => router.replace('/(auth)/register')}><Text style={[styles.link, { color: colors.foreground }]}>Créer un compte</Text></Pressable></View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  close: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end', marginBottom: 18 },
  mark: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 17 },
  brand: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 2, marginBottom: 12 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 29, letterSpacing: -0.7 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 22 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginBottom: 8, marginTop: 13 },
  input: { minHeight: 53, borderWidth: 1, borderRadius: 14, paddingHorizontal: 15, fontFamily: 'Inter_400Regular', fontSize: 15 },
  submit: { minHeight: 54, borderRadius: 15, marginTop: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  submitText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 24 },
  footerText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  link: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
});
