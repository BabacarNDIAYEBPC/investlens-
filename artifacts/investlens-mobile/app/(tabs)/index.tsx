import { getGetPortfolioSummaryQueryKey, getListPositionsQueryKey, useGetPortfolioSummary, useListPositions, type Position } from '@workspace/api-client-react';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/auth';

const money = (value: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value);

function PositionRow({ position }: { position: Position }) {
  const colors = useColors();
  const positive = (position.gainLoss ?? 0) >= 0;
  return (
    <View style={[styles.positionRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.symbolBox, { backgroundColor: colors.muted }]}>
        <Text style={[styles.symbolText, { color: colors.foreground }]}>{position.symbol.slice(0, 2)}</Text>
      </View>
      <View style={styles.positionInfo}>
        <Text style={[styles.symbolText, { color: colors.foreground }]}>{position.symbol}</Text>
        <Text numberOfLines={1} style={[styles.company, { color: colors.mutedForeground }]}>{position.companyName ?? `${position.quantity} titres`}</Text>
      </View>
      <View style={styles.positionValue}>
        <Text style={[styles.price, { color: colors.foreground }]}>{position.currentValue == null ? '—' : money(position.currentValue)}</Text>
        <Text style={[styles.change, { color: positive ? colors.success : colors.destructive }]}>
          {position.gainLossPct == null ? 'Cours indisponible' : `${positive ? '+' : ''}${position.gainLossPct.toFixed(2)} %`}
        </Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user, isLoaded, isSignedIn, signOut } = useAuth();
  const summary = useGetPortfolioSummary({ query: { enabled: isSignedIn, retry: false, queryKey: getGetPortfolioSummaryQueryKey() } });
  const positions = useListPositions({ query: { enabled: isSignedIn, retry: false, queryKey: getListPositionsQueryKey() } });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getGetPortfolioSummaryQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getListPositionsQueryKey() }),
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={summary.isRefetching || positions.isRefetching} onRefresh={refresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: Platform.OS === 'web' ? 67 : insets.top + 16, paddingBottom: Platform.OS === 'web' ? 112 : 42 }}
      >
        <View style={styles.topline}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>INVESTLENS</Text>
            <Text style={[styles.heading, { color: colors.foreground }]}>{user ? 'Bonjour' : 'Votre marché, en clair'}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isSignedIn ? 'Se déconnecter' : 'Se connecter'}
            testID="home-account-button"
            onPress={() => isSignedIn ? signOut() : router.push('/(auth)/login')}
            style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name={isSignedIn ? 'log-out' : 'user'} size={19} color={colors.foreground} />
          </Pressable>
        </View>

        {!isLoaded ? (
          <View style={styles.centered}><ActivityIndicator color={colors.primary} /></View>
        ) : !isSignedIn ? (
          <View style={[styles.guestCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.iconFeature, { backgroundColor: colors.muted }]}>
              <Feather name="trending-up" size={23} color={colors.foreground} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Vos investissements, au même endroit</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>Connectez-vous pour retrouver votre portefeuille et suivre les cours en direct.</Text>
            <Pressable accessibilityRole="button" testID="login-cta" onPress={() => router.push('/(auth)/login')} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Se connecter</Text>
              <Feather name="arrow-right" size={17} color={colors.primaryForeground} />
            </Pressable>
            <Pressable onPress={() => router.push('/(auth)/register')} style={styles.textAction}>
              <Text style={[styles.textActionText, { color: colors.foreground }]}>Créer un compte</Text>
            </Pressable>
          </View>
        ) : summary.isError ? (
          <View style={[styles.errorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="wifi-off" size={21} color={colors.destructive} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Impossible de charger les données</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>{summary.error.message}</Text>
            <Pressable onPress={() => { summary.refetch(); positions.refetch(); }} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Réessayer</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={[styles.valueCard, { backgroundColor: colors.primary }]}>
              <View style={styles.valueTop}>
                <Text style={styles.valueLabel}>Valeur du portefeuille</Text>
                <Feather name="activity" size={18} color={colors.primaryForeground} />
              </View>
              {summary.isLoading ? <ActivityIndicator color={colors.primaryForeground} /> : (
                <>
                  <Text style={[styles.totalValue, { color: colors.primaryForeground }]}>{money(summary.data?.totalValue ?? 0)}</Text>
                  <View style={styles.gainPill}>
                    <Feather name={(summary.data?.totalGainLoss ?? 0) >= 0 ? 'arrow-up-right' : 'arrow-down-right'} size={14} color="#ffffff" />
                    <Text style={styles.gainText}>{money(summary.data?.totalGainLoss ?? 0)} ({(summary.data?.totalGainLossPct ?? 0).toFixed(2)} %)</Text>
                  </View>
                </>
              )}
              <Text style={styles.valueFoot}>{summary.data?.positionCount ?? 0} position{summary.data?.positionCount === 1 ? '' : 's'} suivie{summary.data?.positionCount === 1 ? '' : 's'}</Text>
            </View>

            <View style={styles.sectionHead}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Vos positions</Text>
              <Pressable testID="see-portfolio" onPress={() => router.push('/(tabs)/portfolio')}>
                <Text style={[styles.linkText, { color: colors.mutedForeground }]}>Tout voir</Text>
              </Pressable>
            </View>
            <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {positions.isLoading ? <View style={styles.loadingRow}><ActivityIndicator color={colors.primary} /></View> :
                (positions.data ?? []).slice(0, 4).map((position) => <PositionRow key={position.id} position={position} />)}
              {!positions.isLoading && (positions.data?.length ?? 0) === 0 && (
                <View style={styles.emptyInner}>
                  <Text style={[styles.body, { color: colors.mutedForeground }]}>Votre portefeuille est vide pour le moment.</Text>
                  <Pressable onPress={() => router.push('/add-position')}><Text style={[styles.linkText, { color: colors.foreground }]}>Ajouter une position</Text></Pressable>
                </View>
              )}
            </View>
            <Pressable testID="home-add-position" onPress={() => router.push('/add-position')} style={[styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="plus" size={17} color={colors.foreground} />
              <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>Ajouter une position</Text>
            </Pressable>
          </>
        )}
        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>Les informations présentées ne constituent pas un conseil en investissement.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  eyebrow: { fontSize: 11, letterSpacing: 2, fontFamily: 'Inter_700Bold', marginBottom: 7 },
  heading: { fontSize: 25, fontFamily: 'Inter_700Bold', letterSpacing: -0.6 },
  iconButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  centered: { minHeight: 240, alignItems: 'center', justifyContent: 'center' },
  guestCard: { borderWidth: 1, borderRadius: 22, padding: 22, marginTop: 38 },
  iconFeature: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  cardTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, letterSpacing: -0.3, marginBottom: 8 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
  primaryButton: { minHeight: 52, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 22, paddingHorizontal: 18 },
  primaryButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  textAction: { alignSelf: 'center', padding: 14 },
  textActionText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  errorCard: { borderWidth: 1, borderRadius: 22, padding: 22, gap: 9 },
  valueCard: { borderRadius: 23, padding: 22, minHeight: 186, justifyContent: 'center' },
  valueTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  valueLabel: { color: 'rgba(255,255,255,0.74)', fontFamily: 'Inter_500Medium', fontSize: 13 },
  totalValue: { fontFamily: 'Inter_700Bold', fontSize: 34, letterSpacing: -1.1, marginTop: 12 },
  gainPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.16)', paddingVertical: 7, paddingHorizontal: 10, borderRadius: 99, marginTop: 10 },
  gainText: { color: '#ffffff', fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  valueFoot: { color: 'rgba(255,255,255,0.72)', fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 14 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 12 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  linkText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  listCard: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14 },
  positionRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  symbolBox: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  symbolText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  positionInfo: { flex: 1, gap: 4 },
  company: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  positionValue: { alignItems: 'flex-end', gap: 5 },
  price: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  change: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  loadingRow: { height: 76, alignItems: 'center', justifyContent: 'center' },
  emptyInner: { paddingVertical: 24, alignItems: 'center', gap: 10 },
  secondaryButton: { minHeight: 50, borderWidth: 1, borderRadius: 15, marginTop: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  secondaryButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  disclaimer: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17, marginTop: 26, textAlign: 'center' },
});
