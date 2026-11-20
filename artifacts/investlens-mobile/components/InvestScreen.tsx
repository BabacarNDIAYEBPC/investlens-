import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { type ReactNode } from 'react';
import { ActivityIndicator, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth';
import { useColors } from '@/hooks/useColors';

export function InvestScreen({
  title,
  subtitle,
  children,
  refreshing,
  onRefresh,
  onBack,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  onBack?: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined}
        contentContainerStyle={{
          paddingHorizontal: 22,
          paddingTop: Platform.OS === 'web' ? 67 : insets.top + 12,
          paddingBottom: Platform.OS === 'web' ? 112 : insets.bottom + 28,
        }}
      >
        <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={onBack ?? (() => router.canGoBack() ? router.back() : router.replace('/(tabs)/more'))} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
          <Text style={[styles.backText, { color: colors.foreground }]}>Retour</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text> : null}
        <View style={styles.content}>{children}</View>
      </ScrollView>
    </View>
  );
}

export function LoginRequired() {
  const colors = useColors();

  return (
    <View style={[styles.authCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name="lock" size={23} color={colors.primary} />
      <Text style={[styles.authTitle, { color: colors.foreground }]}>Connectez-vous pour continuer</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Vos outils et données personnelles sont réservés à votre compte.</Text>
      <Pressable accessibilityRole="button" testID="invest-login" onPress={() => router.push('/(auth)/login')} style={[styles.loginButton, { backgroundColor: colors.primary }]}>
        <Text style={[styles.loginButtonText, { color: colors.primaryForeground }]}>Se connecter</Text>
      </Pressable>
    </View>
  );
}

export function useSignedIn() {
  return useAuth().isSignedIn;
}

export function LoadingState() {
  const colors = useColors();
  return <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 38, alignSelf: 'flex-start', marginBottom: 18 },
  backText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 26, letterSpacing: -0.5 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, marginTop: 7 },
  content: { marginTop: 22, gap: 14 },
  authCard: { borderWidth: 1, borderRadius: 18, padding: 20, alignItems: 'flex-start', gap: 10 },
  authTitle: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  loginButton: { alignSelf: 'stretch', minHeight: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  loginButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  loading: { minHeight: 180, alignItems: 'center', justifyContent: 'center' },
});
