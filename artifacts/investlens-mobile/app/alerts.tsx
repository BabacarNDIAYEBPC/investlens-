import { getGetAlertsQueryKey, useGetAlerts } from '@workspace/api-client-react';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { InvestScreen, LoadingState, LoginRequired, useSignedIn } from '@/components/InvestScreen';
import { useColors } from '@/hooks/useColors';

export default function AlertsScreen() {
  const colors = useColors();
  const isSignedIn = useSignedIn();
  const query = useGetAlerts({ query: { enabled: isSignedIn, retry: false, queryKey: getGetAlertsQueryKey(), staleTime: 60_000 } });

  return (
    <InvestScreen title="Alertes" subtitle="Signaux et risques liés à votre portefeuille." refreshing={query.isRefetching} onRefresh={() => { void query.refetch(); }}>
      {!isSignedIn ? <LoginRequired /> : query.isLoading ? <LoadingState /> : query.isError ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>Impossible de charger vos alertes.</Text>
          <Pressable onPress={() => { void query.refetch(); }}><Text style={[styles.link, { color: colors.primary }]}>Réessayer</Text></Pressable>
        </View>
      ) : (query.data?.alerts.length ?? 0) === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="check-circle" size={24} color={colors.success} />
          <Text style={[styles.heading, { color: colors.foreground }]}>Aucune alerte active</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>{query.data?.message ?? 'Les signaux de votre portefeuille apparaîtront ici.'}</Text>
        </View>
      ) : (
        <>
          <View style={[styles.summary, { backgroundColor: colors.primary }]}>
            <Text style={[styles.summaryCount, { color: colors.primaryForeground }]}>{query.data?.count ?? 0}</Text>
            <Text style={[styles.summaryText, { color: colors.primaryForeground }]}>signal{query.data?.count === 1 ? '' : 's'} · {query.data?.highPriority ?? 0} prioritaire{query.data?.highPriority === 1 ? '' : 's'}</Text>
          </View>
          {query.data?.alerts.map((alert) => {
            const high = alert.severity === 'high';
            return (
              <View key={alert.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardTop}>
                  <Feather name={high ? 'alert-triangle' : 'bell'} size={17} color={high ? colors.destructive : colors.primary} />
                  <Text style={[styles.severity, { color: high ? colors.destructive : colors.mutedForeground }]}>{high ? 'Prioritaire' : alert.severity === 'medium' ? 'À surveiller' : 'Information'}</Text>
                  {alert.symbol ? <Text style={[styles.symbol, { color: colors.foreground }]}>{alert.symbol}</Text> : null}
                </View>
                <Text style={[styles.heading, { color: colors.foreground }]}>{alert.title}</Text>
                <Text style={[styles.body, { color: colors.mutedForeground }]}>{alert.message}</Text>
              </View>
            );
          })}
        </>
      )}
    </InvestScreen>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  summary: { borderRadius: 17, padding: 18, flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  summaryCount: { fontFamily: 'Inter_700Bold', fontSize: 28 },
  summaryText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  severity: { fontFamily: 'Inter_600SemiBold', fontSize: 12, flex: 1 },
  symbol: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  heading: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  link: { fontFamily: 'Inter_600SemiBold', paddingVertical: 6 },
  empty: { borderWidth: 1, borderRadius: 16, padding: 22, alignItems: 'center', gap: 10 },
});
