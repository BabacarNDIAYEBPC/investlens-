import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth';
import { useSubscription } from '@/context/subscription';
import { useColors } from '@/hooks/useColors';

const tools = [
  { title: 'Profil investisseur', subtitle: 'Évaluez votre tolérance au risque', icon: 'user-check' as const, route: '/profile' },
  { title: 'Recommandations', subtitle: 'Des titres adaptés à votre profil', icon: 'star' as const, route: '/recommendations' },
  { title: 'Radar mondial', subtitle: 'Actualités et impacts sur les marchés', icon: 'globe' as const, route: '/radar' },
  { title: 'Alertes', subtitle: 'Signaux sur votre portefeuille', icon: 'bell' as const, route: '/alerts' },
  { title: 'Simulateur', subtitle: 'Comparez plusieurs scénarios', icon: 'trending-up' as const, route: '/simulation' },
];

export default function MoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isSignedIn, signOut, user } = useAuth();
  const { isPro } = useSubscription();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: Platform.OS === 'web' ? 67 : insets.top + 18, paddingBottom: Platform.OS === 'web' ? 112 : insets.bottom + 30 }}>
        <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>INVESTLENS</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Outils investisseurs</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Accédez à toutes les fonctions essentielles de votre espace.</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={isPro ? 'Gérer InvestLens Pro' : 'Découvrir InvestLens Pro'} testID="more-subscribe" onPress={() => router.push('/subscribe')} style={[styles.pro, { backgroundColor: colors.primary }]}>
          <View style={styles.itemCopy}>
            <Text style={[styles.proEyebrow, { color: colors.primaryForeground }]}>{isPro ? 'PRO ACTIF' : 'INVESTLENS PRO'}</Text>
            <Text style={[styles.proTitle, { color: colors.primaryForeground }]}>{isPro ? 'Gérer mon abonnement' : 'Analyses approfondies de votre risque'}</Text>
          </View>
          <Feather name="arrow-right" size={19} color={colors.primaryForeground} />
        </Pressable>
        <View style={styles.menu}>
          {tools.map((item) => (
            <Pressable key={item.route} accessibilityRole="button" testID={`tool-${item.route.slice(1)}`} onPress={() => router.push(item.route as never)} style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.iconBox, { backgroundColor: colors.muted }]}><Feather name={item.icon} size={19} color={colors.foreground} /></View>
              <View style={styles.itemCopy}>
                <Text style={[styles.itemTitle, { color: colors.foreground }]}>{item.title}</Text>
                <Text style={[styles.itemSubtitle, { color: colors.mutedForeground }]}>{item.subtitle}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>
        <Pressable accessibilityRole="link" testID="more-privacy" onPress={() => router.push('/privacy')} style={styles.privacy}>
          <Feather name="lock" size={14} color={colors.mutedForeground} />
          <Text style={[styles.accountText, { color: colors.mutedForeground }]}>Confidentialité</Text>
        </Pressable>
        <View style={[styles.account, { borderTopColor: colors.border }]}>
          <Feather name="user" size={17} color={colors.mutedForeground} />
          <Text numberOfLines={1} style={[styles.accountText, { color: colors.mutedForeground }]}>{isSignedIn ? user?.email ?? 'Compte connecté' : 'Vous n’êtes pas connecté'}</Text>
          <Pressable accessibilityRole="button" testID="more-account-action" onPress={() => isSignedIn ? signOut() : router.push('/(auth)/login')}>
            <Text style={[styles.accountAction, { color: colors.primary }]}>{isSignedIn ? 'Déconnexion' : 'Connexion'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 2, marginBottom: 8 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 26, letterSpacing: -0.5 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, marginTop: 8 },
  menu: { gap: 10, marginTop: 12 },
  pro: { marginTop: 24, borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  proEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10.5, letterSpacing: 1.8, opacity: 0.75 },
  proTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  privacy: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 40, marginTop: 14 },
  item: { minHeight: 75, borderWidth: 1, borderRadius: 16, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  itemCopy: { flex: 1, gap: 4 },
  itemTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  itemSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  account: { flexDirection: 'row', alignItems: 'center', gap: 9, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 25, paddingTop: 18 },
  accountText: { fontFamily: 'Inter_400Regular', fontSize: 12, flex: 1 },
  accountAction: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
});
