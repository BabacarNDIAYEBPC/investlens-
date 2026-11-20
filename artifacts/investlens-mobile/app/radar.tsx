import { getGetRadarMondialQueryKey, useGetRadarMondial } from '@workspace/api-client-react';
import { Feather } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { InvestScreen, LoadingState, LoginRequired, useSignedIn } from '@/components/InvestScreen';
import { useColors } from '@/hooks/useColors';

export default function RadarScreen() {
  const colors = useColors();
  const isSignedIn = useSignedIn();
  const query = useGetRadarMondial({ query: { enabled: isSignedIn, retry: false, queryKey: getGetRadarMondialQueryKey(), staleTime: 120_000 } });
  const score = query.data?.geoRiskScore;
  const riskColor = score == null ? colors.mutedForeground : score < 40 ? colors.destructive : score < 65 ? colors.accent : colors.success;

  return (
    <InvestScreen title="Radar mondial" subtitle="Actualités et impacts potentiels sur les marchés." refreshing={query.isRefetching} onRefresh={() => { void query.refetch(); }}>
      {!isSignedIn ? <LoginRequired /> : query.isLoading ? <LoadingState /> : query.isError ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>Le radar est momentanément indisponible.</Text>
          <Pressable onPress={() => { void query.refetch(); }}><Text style={[styles.link, { color: colors.primary }]}>Réessayer</Text></Pressable>
        </View>
      ) : (
        <>
          <View style={[styles.scoreCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.scoreHead}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>INDICE DE RISQUE GÉOPOLITIQUE</Text>
                <Text style={[styles.riskLabel, { color: colors.foreground }]}>{query.data?.geoRiskLabel}</Text>
              </View>
              <Text style={[styles.score, { color: riskColor }]}>{score ?? '—'}</Text>
            </View>
            <View style={[styles.track, { backgroundColor: colors.muted }]}>
              <View style={[styles.progress, { width: `${Math.max(0, Math.min(100, score ?? 0))}%`, backgroundColor: riskColor }]} />
            </View>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>Indicateur calculé à partir des actualités mondiales. Consultez les sources pour le contexte.</Text>
          </View>
          <Text style={[styles.section, { color: colors.foreground }]}>Événements récents</Text>
          {(query.data?.events ?? []).length === 0 ? (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.body, { color: colors.mutedForeground }]}>Aucun événement récent à afficher.</Text></View>
          ) : query.data?.events.slice(0, 20).map((event) => {
            const impactColor = event.impact === 'negative' ? colors.destructive : event.impact === 'positive' ? colors.success : colors.mutedForeground;
            return (
              <Pressable key={event.id} accessibilityRole="button" onPress={() => { if (event.url.startsWith('https://') || event.url.startsWith('http://')) void Linking.openURL(event.url); }} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.eventMeta}>
                  <Text style={[styles.category, { color: colors.primary }]}>{event.category}</Text>
                  <Text style={[styles.impact, { color: impactColor }]}>{event.impact === 'negative' ? 'Impact négatif' : event.impact === 'positive' ? 'Impact positif' : 'Impact neutre'}</Text>
                </View>
                <Text style={[styles.eventTitle, { color: colors.foreground }]}>{event.headline}</Text>
                {event.summary ? <Text numberOfLines={3} style={[styles.body, { color: colors.mutedForeground }]}>{event.summary}</Text> : null}
                <View style={styles.footer}>
                  <Text numberOfLines={1} style={[styles.source, { color: colors.mutedForeground }]}>{event.source} · {event.sectors.join(', ') || 'Marchés'}</Text>
                  <Feather name="external-link" size={15} color={colors.mutedForeground} />
                </View>
              </Pressable>
            );
          })}
        </>
      )}
    </InvestScreen>
  );
}

const styles = StyleSheet.create({
  scoreCard: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 14 },
  scoreHead: { flexDirection: 'row', alignItems: 'center' },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.2 },
  riskLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 16, marginTop: 7 },
  score: { fontFamily: 'Inter_700Bold', fontSize: 36 },
  track: { height: 8, borderRadius: 8, overflow: 'hidden' },
  progress: { height: 8, borderRadius: 8 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  section: { fontFamily: 'Inter_700Bold', fontSize: 18, marginTop: 8 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  eventMeta: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  category: { fontFamily: 'Inter_600SemiBold', fontSize: 11, textTransform: 'uppercase', flex: 1 },
  impact: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  eventTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, lineHeight: 21 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  source: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11 },
  link: { fontFamily: 'Inter_600SemiBold', paddingVertical: 6 },
});
