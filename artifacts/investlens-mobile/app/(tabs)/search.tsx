import { getGetStockQuoteQueryKey, getSearchStocksQueryKey, useGetStockQuote, useSearchStocks } from '@workspace/api-client-react';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/auth';

const money = (value: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value);

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isSignedIn } = useAuth();
  const params = useLocalSearchParams<{ q?: string }>();
  const [term, setTerm] = useState(params.q ?? '');
  const [selected, setSelected] = useState('');
  useEffect(() => {
    if (params.q) {
      setTerm(params.q);
      setSelected('');
    }
  }, [params.q]);
  const search = useSearchStocks({ q: term.trim() }, { query: { enabled: isSignedIn && term.trim().length >= 2, staleTime: 30_000, queryKey: getSearchStocksQueryKey({ q: term.trim() }) } });
  const quote = useGetStockQuote(selected, { query: { enabled: isSignedIn && !!selected, queryKey: getGetStockQuoteQueryKey(selected) } });

  if (!isSignedIn) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top + 30 }]}>
        <Feather name="search" size={25} color={colors.mutedForeground} />
        <Text style={[styles.title, { color: colors.foreground }]}>Rechercher un titre</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>Connectez-vous pour rechercher des entreprises et consulter leurs cours.</Text>
        <Pressable testID="search-login" onPress={() => router.push('/(auth)/login')} style={[styles.primaryButton, { backgroundColor: colors.primary }]}><Text style={{ color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }}>Se connecter</Text></Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 22, paddingTop: Platform.OS === 'web' ? 67 : insets.top + 18, paddingBottom: Platform.OS === 'web' ? 112 : insets.bottom + 30 }}>
        <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>MARCHÉS</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Rechercher</Text>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput testID="stock-search-input" accessibilityLabel="Nom d’entreprise ou symbole boursier" value={term} onChangeText={(value) => { setTerm(value); setSelected(''); }} placeholder="Entreprise ou symbole" placeholderTextColor={colors.mutedForeground} autoCapitalize="characters" autoCorrect={false} returnKeyType="search" style={[styles.input, { color: colors.foreground }]} />
          {!!term && <Pressable accessibilityLabel="Effacer la recherche" onPress={() => { setTerm(''); setSelected(''); }}><Feather name="x-circle" size={18} color={colors.mutedForeground} /></Pressable>}
        </View>

        {selected ? (
          <View style={[styles.quoteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable onPress={() => setSelected('')} style={styles.backRow}><Feather name="arrow-left" size={16} color={colors.foreground} /><Text style={[styles.backText, { color: colors.foreground }]}>Résultats</Text></Pressable>
            {quote.isLoading ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} /> : quote.isError ? (
              <Text style={[styles.body, { color: colors.mutedForeground }]}>Cours temporairement indisponible. Réessayez plus tard.</Text>
            ) : quote.data ? (
              <>
                <Text style={[styles.symbol, { color: colors.foreground }]}>{quote.data.symbol}</Text>
                <Text style={[styles.lastPrice, { color: colors.foreground }]}>{money(quote.data.currentPrice)}</Text>
                <View style={[styles.changePill, { backgroundColor: quote.data.changePct >= 0 ? colors.success : colors.destructive }]}>
                  <Feather name={quote.data.changePct >= 0 ? 'trending-up' : 'trending-down'} size={14} color="#ffffff" />
                  <Text style={styles.changeText}>{quote.data.change >= 0 ? '+' : ''}{money(quote.data.change)} · {quote.data.changePct.toFixed(2)} %</Text>
                </View>
                <View style={[styles.rangeRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.rangeLabel, { color: colors.mutedForeground }]}>Plus haut</Text><Text style={[styles.rangeValue, { color: colors.foreground }]}>{money(quote.data.high)}</Text>
                  <Text style={[styles.rangeLabel, { color: colors.mutedForeground }]}>Plus bas</Text><Text style={[styles.rangeValue, { color: colors.foreground }]}>{money(quote.data.low)}</Text>
                </View>
              </>
            ) : null}
          </View>
        ) : term.trim().length < 2 ? (
          <View style={styles.hint}><Feather name="bar-chart-2" size={23} color={colors.mutedForeground} /><Text style={[styles.body, { color: colors.mutedForeground }]}>Saisissez au moins deux caractères pour trouver une action.</Text></View>
        ) : search.isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 34 }} /> : search.isError ? (
          <View style={styles.hint}><Text style={[styles.body, { color: colors.mutedForeground }]}>Recherche indisponible. Vérifiez votre connexion puis réessayez.</Text><Pressable onPress={() => search.refetch()}><Text style={[styles.backText, { color: colors.foreground }]}>Réessayer</Text></Pressable></View>
        ) : (search.data ?? []).length === 0 ? (
          <View style={styles.hint}><Text style={[styles.body, { color: colors.mutedForeground }]}>Aucun résultat trouvé pour « {term} ».</Text></View>
        ) : (
          <View style={{ marginTop: 16 }}>
            {(search.data ?? []).slice(0, 12).map((item) => (
              <Pressable accessibilityRole="button" testID={`stock-result-${item.symbol}`} key={`${item.symbol}-${item.description}`} onPress={() => setSelected(item.symbol)} style={[styles.resultRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.symbolBox, { backgroundColor: colors.muted }]}><Text style={[styles.symbolMini, { color: colors.foreground }]}>{item.symbol.slice(0, 2)}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.symbolMini, { color: colors.foreground }]}>{item.displaySymbol || item.symbol}</Text>
                  <Text numberOfLines={1} style={[styles.company, { color: colors.mutedForeground }]}>{item.description}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28, gap: 12 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 2, marginBottom: 8 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 25, letterSpacing: -0.5 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  primaryButton: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14, marginTop: 8 },
  searchBox: { height: 54, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, borderWidth: 1, borderRadius: 16, gap: 10, marginTop: 22 },
  input: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15, paddingVertical: 12 },
  hint: { minHeight: 200, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 26, gap: 12 },
  resultRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  symbolBox: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  symbolMini: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  company: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 4 },
  quoteCard: { borderRadius: 20, borderWidth: 1, padding: 18, marginTop: 20 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 18 },
  backText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  symbol: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  lastPrice: { fontFamily: 'Inter_700Bold', fontSize: 32, letterSpacing: -0.8, marginTop: 10 },
  changePill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 7, marginTop: 11 },
  changeText: { color: '#ffffff', fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  rangeRow: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14, marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 8 },
  rangeLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  rangeValue: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
});
