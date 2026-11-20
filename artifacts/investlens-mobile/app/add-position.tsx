import { getGetPortfolioSummaryQueryKey, getListPositionsQueryKey, useAddPosition } from '@workspace/api-client-react';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/auth';

export default function AddPositionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { isSignedIn } = useAuth();
  const mutation = useAddPosition();
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');

  const submit = async () => {
    const parsedQuantity = Number(quantity.replace(',', '.'));
    const parsedPrice = Number(buyPrice.replace(',', '.'));
    if (!symbol.trim() || !Number.isFinite(parsedQuantity) || parsedQuantity <= 0 || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      Alert.alert('Vérifiez les informations', 'Saisissez un symbole, une quantité et un prix d’achat valides.');
      return;
    }
    try {
      await mutation.mutateAsync({ data: { symbol: symbol.trim().toUpperCase(), quantity: parsedQuantity, buyPrice: parsedPrice } });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getListPositionsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetPortfolioSummaryQueryKey() }),
      ]);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      Alert.alert('Ajout impossible', error instanceof Error ? error.message : 'Réessayez dans un instant.');
    }
  };

  if (!isSignedIn) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><Text style={[styles.title, { color: colors.foreground }]}>Connectez-vous pour ajouter une position.</Text><Pressable onPress={() => router.replace('/(auth)/login')}><Text style={[styles.link, { color: colors.foreground }]}>Se connecter</Text></Pressable></View>;
  }

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 24, paddingHorizontal: 22 }}
      bottomOffset={20}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>PORTEFEUILLE</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Ajouter une position</Text>
        </View>
        <Pressable accessibilityLabel="Fermer" onPress={() => router.back()} style={[styles.close, { backgroundColor: colors.muted }]}><Feather name="x" size={19} color={colors.foreground} /></Pressable>
      </View>
      <Text style={[styles.caption, { color: colors.mutedForeground }]}>Renseignez les détails de votre achat. Le cours actuel sera récupéré automatiquement.</Text>

      <Text style={[styles.label, { color: colors.foreground }]}>Symbole boursier</Text>
      <TextInput testID="position-symbol" value={symbol} onChangeText={setSymbol} placeholder="Ex. AAPL" placeholderTextColor={colors.mutedForeground} autoCapitalize="characters" autoCorrect={false} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />

      <Text style={[styles.label, { color: colors.foreground }]}>Quantité détenue</Text>
      <TextInput testID="position-quantity" value={quantity} onChangeText={setQuantity} placeholder="Ex. 5" placeholderTextColor={colors.mutedForeground} keyboardType="decimal-pad" style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />

      <Text style={[styles.label, { color: colors.foreground }]}>Prix moyen d’achat (EUR)</Text>
      <TextInput testID="position-buy-price" value={buyPrice} onChangeText={setBuyPrice} placeholder="Ex. 185,50" placeholderTextColor={colors.mutedForeground} keyboardType="decimal-pad" style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />

      {!!mutation.error && <Text style={[styles.errorText, { color: colors.destructive }]}>{mutation.error.message}</Text>}
      <Pressable accessibilityRole="button" testID="save-position" disabled={mutation.isPending} onPress={submit} style={[styles.submit, { backgroundColor: colors.primary, opacity: mutation.isPending ? 0.6 : 1 }]}>
        {mutation.isPending ? <Text style={[styles.submitText, { color: colors.primaryForeground }]}>Enregistrement…</Text> : <><Text style={[styles.submitText, { color: colors.primaryForeground }]}>Enregistrer</Text><Feather name="check" size={17} color={colors.primaryForeground} /></>}
      </Pressable>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28, gap: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 2, marginBottom: 7 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 23, letterSpacing: -0.5 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, marginBottom: 20 },
  close: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginBottom: 8, marginTop: 14 },
  input: { minHeight: 52, borderWidth: 1, borderRadius: 14, paddingHorizontal: 15, fontFamily: 'Inter_400Regular', fontSize: 15 },
  submit: { minHeight: 54, borderRadius: 15, marginTop: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  submitText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  errorText: { fontFamily: 'Inter_500Medium', fontSize: 13, marginTop: 12 },
  link: { fontFamily: 'Inter_600SemiBold' },
});
