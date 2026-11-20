import { getGetSimulationQueryKey, useGetSimulation } from '@workspace/api-client-react';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { InvestScreen, LoginRequired, useSignedIn } from '@/components/InvestScreen';
import { useColors } from '@/hooks/useColors';

const money = (value: number, currency = 'EUR') => new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
const durations = [1, 3, 5, 10];

export default function SimulationScreen() {
  const colors = useColors();
  const isSignedIn = useSignedIn();
  const [symbol, setSymbol] = useState('AAPL');
  const [amountText, setAmountText] = useState('1000');
  const [duration, setDuration] = useState(3);
  const [submitted, setSubmitted] = useState(false);
  const normalizedSymbol = symbol.trim().toUpperCase();
  const amount = Number(amountText.replace(',', '.'));
  const params = { amount, duration, currency: 'EUR' };
  const query = useGetSimulation(normalizedSymbol || 'AAPL', params, {
    query: { enabled: isSignedIn && submitted && normalizedSymbol.length > 0 && Number.isFinite(amount) && amount > 0, retry: false, queryKey: getGetSimulationQueryKey(normalizedSymbol || 'AAPL', params) },
  });

  return (
    <InvestScreen title="Simulateur" subtitle="Comparez plusieurs scénarios avant de prendre une décision.">
      {!isSignedIn ? <LoginRequired /> : (
        <>
          <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.foreground }]}>Symbole boursier</Text>
            <TextInput accessibilityLabel="Symbole boursier" value={symbol} onChangeText={(value) => { setSymbol(value.toUpperCase()); setSubmitted(false); }} autoCapitalize="characters" autoCorrect={false} style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]} placeholder="Ex. AAPL" placeholderTextColor={colors.mutedForeground} />
            <Text style={[styles.label, { color: colors.foreground }]}>Montant à investir</Text>
            <View style={[styles.amountInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <TextInput accessibilityLabel="Montant en euros" value={amountText} onChangeText={(value) => { setAmountText(value); setSubmitted(false); }} keyboardType="decimal-pad" style={[styles.inputAmount, { color: colors.foreground }]} />
              <Text style={[styles.currency, { color: colors.mutedForeground }]}>EUR</Text>
            </View>
            <Text style={[styles.label, { color: colors.foreground }]}>Durée de placement</Text>
            <View style={styles.durationRow}>
              {durations.map((year) => {
                const selected = duration === year;
                return (
                  <Pressable key={year} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => { setDuration(year); setSubmitted(false); }} style={[styles.duration, { backgroundColor: selected ? colors.primary : colors.background, borderColor: selected ? colors.primary : colors.border }]}>
                    <Text style={[styles.durationText, { color: selected ? colors.primaryForeground : colors.foreground }]}>{year} an{year > 1 ? 's' : ''}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable accessibilityRole="button" testID="run-simulation" disabled={!normalizedSymbol || !Number.isFinite(amount) || amount <= 0} onPress={() => setSubmitted(true)} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
              <Feather name="activity" size={17} color={colors.primaryForeground} />
              <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Lancer la simulation</Text>
            </Pressable>
          </View>
          {submitted && query.isLoading ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View> : null}
          {submitted && query.isError ? (
            <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.body, { color: colors.mutedForeground }]}>Simulation indisponible pour ce symbole. Vérifiez le code boursier puis réessayez.</Text>
              <Pressable onPress={() => { void query.refetch(); }}><Text style={[styles.link, { color: colors.primary }]}>Réessayer</Text></Pressable>
            </View>
          ) : null}
          {submitted && query.data ? (
            <>
              <View style={[styles.resultHeader, { backgroundColor: colors.primary }]}>
                <Text style={[styles.resultLabel, { color: colors.primaryForeground }]}>SCÉNARIOS POUR {query.data.symbol}</Text>
                <Text style={[styles.resultAmount, { color: colors.primaryForeground }]}>{money(query.data.amount, query.data.currency)}</Text>
                <Text style={[styles.resultSub, { color: colors.primaryForeground }]}>Investis aujourd’hui · cours actuel {money(query.data.currentPrice, query.data.currency)}</Text>
              </View>
              {query.data.scenarios.map((scenario) => {
                const positive = scenario.gainLoss >= 0;
                return (
                  <View key={scenario.label} style={[styles.scenario, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.scenarioLabel, { color: colors.foreground }]}>{scenario.label}</Text>
                      <Text style={[styles.body, { color: colors.mutedForeground }]}>{scenario.pct >= 0 ? '+' : ''}{scenario.pct.toFixed(1)}% estimé</Text>
                    </View>
                    <View style={styles.scenarioValues}>
                      <Text style={[styles.finalAmount, { color: colors.foreground }]}>{money(scenario.finalAmount, query.data.currency)}</Text>
                      <Text style={[styles.change, { color: positive ? colors.success : colors.destructive }]}>{positive ? '+' : ''}{money(scenario.gainLoss, query.data.currency)}</Text>
                    </View>
                  </View>
                );
              })}
              <View style={[styles.notice, { backgroundColor: colors.muted }]}>
                <Feather name={query.data.profileCompatible ? 'check-circle' : 'alert-triangle'} size={17} color={query.data.profileCompatible ? colors.success : colors.destructive} />
                <Text style={[styles.body, { color: colors.foreground }]}>{query.data.profileNote}</Text>
              </View>
              <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>Simulation statistique indicative. Les performances passées et les scénarios ne garantissent pas les résultats futurs.</Text>
            </>
          ) : null}
        </>
      )}
    </InvestScreen>
  );
}

const styles = StyleSheet.create({
  form: { borderWidth: 1, borderRadius: 17, padding: 16, gap: 10 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginTop: 3 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, fontFamily: 'Inter_500Medium', fontSize: 15 },
  amountInput: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center' },
  inputAmount: { flex: 1, minHeight: 46, fontFamily: 'Inter_500Medium', fontSize: 15 },
  currency: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  durationRow: { flexDirection: 'row', gap: 7 },
  duration: { flex: 1, minHeight: 40, borderRadius: 11, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  durationText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  primaryButton: { minHeight: 49, borderRadius: 13, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  primaryText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  loading: { minHeight: 120, alignItems: 'center', justifyContent: 'center' },
  resultHeader: { padding: 18, borderRadius: 17, gap: 8 },
  resultLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.2 },
  resultAmount: { fontFamily: 'Inter_700Bold', fontSize: 28 },
  resultSub: { fontFamily: 'Inter_400Regular', fontSize: 12, opacity: 0.8 },
  scenario: { minHeight: 75, borderRadius: 15, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  scenarioLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, marginBottom: 4 },
  scenarioValues: { alignItems: 'flex-end', gap: 4 },
  finalAmount: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  change: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  notice: { padding: 13, borderRadius: 13, flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  body: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  disclaimer: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  resultCard: { borderWidth: 1, borderRadius: 15, padding: 15, gap: 8 },
  link: { fontFamily: 'Inter_600SemiBold', paddingVertical: 6 },
});
