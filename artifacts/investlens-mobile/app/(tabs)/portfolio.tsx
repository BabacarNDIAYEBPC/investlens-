import { getGetPortfolioSummaryQueryKey, getListPositionsQueryKey, useDeletePosition, useListPositions, type Position } from '@workspace/api-client-react';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/auth';

const money = (value: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value);

export default function PortfolioScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { isSignedIn } = useAuth();
  const positions = useListPositions({ query: { enabled: isSignedIn, retry: false, queryKey: getListPositionsQueryKey() } });
  const removePosition = useDeletePosition();

  const remove = (item: Position) => {
    Alert.alert('Supprimer cette position ?', `${item.symbol} sera retiré de votre portefeuille.`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => {
        void removePosition.mutateAsync({ id: item.id }).then(async () => {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: getListPositionsQueryKey() }),
            queryClient.invalidateQueries({ queryKey: getGetPortfolioSummaryQueryKey() }),
          ]);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }).catch(() => Alert.alert('Erreur', 'La position n’a pas pu être supprimée.'));
      } },
    ]);
  };

  if (!isSignedIn) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top + 30 }]}>
        <Feather name="lock" size={25} color={colors.mutedForeground} />
        <Text style={[styles.title, { color: colors.foreground }]}>Votre portefeuille</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>Connectez-vous pour consulter vos positions.</Text>
        <Pressable testID="portfolio-login" onPress={() => router.push('/(auth)/login')} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
          <Text style={{ color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }}>Se connecter</Text>
        </Pressable>
      </View>
    );
  }

  const renderPosition = ({ item }: { item: Position }) => {
    const positive = (item.gainLoss ?? 0) >= 0;
    return (
      <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.symbolBox, { backgroundColor: colors.muted }]}><Text style={[styles.symbol, { color: colors.foreground }]}>{item.symbol.slice(0, 2)}</Text></View>
        <View style={styles.info}>
          <Text style={[styles.symbol, { color: colors.foreground }]}>{item.symbol}</Text>
          <Text numberOfLines={1} style={[styles.company, { color: colors.mutedForeground }]}>{item.companyName ?? `${item.quantity} titres`}</Text>
        </View>
        <View style={styles.amounts}>
          <Text style={[styles.price, { color: colors.foreground }]}>{item.currentValue == null ? '—' : money(item.currentValue)}</Text>
          <Text style={{ color: positive ? colors.success : colors.destructive, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>
            {item.gainLossPct == null ? 'Cours indisponible' : `${positive ? '+' : ''}${item.gainLossPct.toFixed(2)} %`}
          </Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Supprimer ${item.symbol}`} testID={`delete-position-${item.symbol}`} onPress={() => remove(item)} style={styles.deleteButton}>
          <Feather name="trash-2" size={17} color={colors.mutedForeground} />
        </Pressable>
      </View>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: Platform.OS === 'web' ? 67 : insets.top + 18, paddingHorizontal: 22 }}>
        <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>INVESTISSEMENTS</Text>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Portefeuille</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Ajouter une position" testID="add-position-button" onPress={() => router.push('/add-position')} style={[styles.addButton, { backgroundColor: colors.primary }]}>
            <Feather name="plus" size={19} color={colors.primaryForeground} />
          </Pressable>
        </View>
      </View>
      {positions.isLoading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : positions.isError ? (
        <View style={styles.center}>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>Chargement impossible. Vérifiez votre connexion puis réessayez.</Text>
          <Pressable onPress={() => positions.refetch()}><Text style={[styles.link, { color: colors.foreground }]}>Réessayer</Text></Pressable>
        </View>
      ) : (
        <FlatList
          data={positions.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderPosition}
          contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 12, paddingBottom: Platform.OS === 'web' ? 112 : insets.bottom + 24, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={positions.isRefetching} onRefresh={async () => { await positions.refetch(); }} tintColor={colors.primary} />}
          ListEmptyComponent={<View style={styles.empty}><Feather name="briefcase" size={25} color={colors.mutedForeground} /><Text style={[styles.title, { color: colors.foreground }]}>Aucune position</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>Ajoutez votre premier investissement pour suivre sa valeur.</Text><Pressable onPress={() => router.push('/add-position')} style={[styles.primaryButton, { backgroundColor: colors.primary }]}><Text style={{ color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }}>Ajouter une position</Text></Pressable></View>}
          scrollEnabled={(positions.data?.length ?? 0) > 0}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28, gap: 12 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 2, marginBottom: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 25, letterSpacing: -0.5 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  primaryButton: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14, marginTop: 8 },
  addButton: { width: 42, height: 42, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  row: { minHeight: 82, borderRadius: 17, borderWidth: 1, marginBottom: 10, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  symbolBox: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  symbol: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  info: { flex: 1, gap: 5 },
  company: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  amounts: { alignItems: 'flex-end', gap: 5 },
  price: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  deleteButton: { padding: 8, marginLeft: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 13, paddingHorizontal: 20 },
  link: { fontFamily: 'Inter_600SemiBold', marginTop: 8 },
});
