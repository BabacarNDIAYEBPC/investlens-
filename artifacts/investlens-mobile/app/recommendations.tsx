import { getGetRecommendationsQueryKey, useGetRecommendations } from '@workspace/api-client-react';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { InvestScreen, LoadingState, LoginRequired, useSignedIn } from '@/components/InvestScreen';
import { useColors } from '@/hooks/useColors';

const profileLabels: Record<string, string> = {
  prudent: 'Prudent',
  croissance_prudente: 'Croissance prudente',
  croissance: 'Croissance',
  agressif: 'Agressif',
};

export default function RecommendationsScreen() {
  const colors = useColors();
  const isSignedIn = useSignedIn();
  const query = useGetRecommendations({ query: { enabled: isSignedIn, retry: false, queryKey: getGetRecommendationsQueryKey(), staleTime: 120_000 } });

  return (
    <InvestScreen title="Recommandations" subtitle="Sélection calculée selon votre profil investisseur." refreshing={query.isRefetching} onRefresh={() => { void query.refetch(); }}>
      {!isSignedIn ? <LoginRequired /> : query.isLoading ? <LoadingState /> : query.isError ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>Impossible de charger les recommandations.</Text>
          <Pressable onPress={() => { void query.refetch(); }}><Text style={[styles.link, { color: colors.primary }]}>Réessayer</Text></Pressable>
        </View>
      ) : (
        <>
          <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
            <Feather name="target" size={18} color={colors.primaryForeground} />
            <Text style={[styles.profileText, { color: colors.primaryForeground }]}>Profil {profileLabels[query.data?.profileKey ?? ''] ?? 'investisseur'}</Text>
          </View>
          <Text style={[styles.section, { color: colors.foreground }]}>Actions recommandées</Text>
          {(query.data?.topPicks ?? []).slice(0, 12).map((item) => (
            <Pressable key={item.symbol} onPress={() => router.push({ pathname: '/(tabs)/search', params: { q: item.symbol } })} style={[styles.stockCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.stockMain}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.symbol, { color: colors.foreground }]}>{item.symbol}</Text>
                  <Text numberOfLines={1} style={[styles.name, { color: colors.mutedForeground }]}>{item.name} · {item.sector}</Text>
                </View>
                <View style={styles.scoreBox}>
                  <Text style={[styles.compatibility, { color: colors.primary }]}>{item.compatibility}%</Text>
                  <Text style={[styles.meta, { color: colors.mutedForeground }]}>compatibilité</Text>
                </View>
              </View>
              <View style={styles.stockFooter}>
                <Text style={[styles.meta, { color: colors.mutedForeground }]}>{item.riskTier ? `Risque ${item.riskTier}` : 'Recommandation'}</Text>
                <Text style={[styles.quoteLink, { color: colors.primary }]}>Voir le cours <Feather name="arrow-up-right" size={13} color={colors.primary} /></Text>
              </View>
            </Pressable>
          ))}
          {(query.data?.topPicks.length ?? 0) === 0 ? <Text style={[styles.body, { color: colors.mutedForeground }]}>Aucune recommandation disponible pour le moment.</Text> : null}
          {(query.data?.gems.length ?? 0) > 0 ? (
            <>
              <Text style={[styles.section, { color: colors.foreground }]}>À découvrir</Text>
              {query.data?.gems.slice(0, 5).map((item) => (
                <Pressable key={`gem-${item.symbol}`} onPress={() => router.push({ pathname: '/(tabs)/search', params: { q: item.symbol } })} style={[styles.gemRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.symbol, { color: colors.foreground }]}>{item.symbol} · {item.name}</Text>
                    <Text style={[styles.meta, { color: colors.mutedForeground }]}>{item.sector} · compatibilité {item.compatibility}%</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                </Pressable>
              ))}
            </>
          ) : null}
          <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>Ces suggestions sont informatives et ne constituent pas un conseil en investissement.</Text>
        </>
      )}
    </InvestScreen>
  );
}

const styles = StyleSheet.create({
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 15, borderRadius: 15 },
  profileText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  section: { fontFamily: 'Inter_700Bold', fontSize: 18, marginTop: 7 },
  stockCard: { borderWidth: 1, borderRadius: 16, padding: 15, gap: 13 },
  stockMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  symbol: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  name: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 4 },
  scoreBox: { alignItems: 'flex-end' },
  compatibility: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  stockFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quoteLink: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  gemRow: { borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center' },
  disclaimer: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, marginTop: 3 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  link: { fontFamily: 'Inter_600SemiBold', paddingVertical: 6 },
});
