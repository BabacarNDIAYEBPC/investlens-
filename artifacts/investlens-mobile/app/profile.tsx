import {
  getGetInvestProfileQueryKey,
  useCompleteOnboarding,
  useGetInvestProfile,
  useUpdateInvestProfile,
} from '@workspace/api-client-react';
import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { InvestScreen, LoadingState, LoginRequired, useSignedIn } from '@/components/InvestScreen';
import { useColors } from '@/hooks/useColors';

type PanicResponse = 'sell' | 'wait' | 'buy';
type Experience = 'debutant' | 'intermediaire' | 'confirme';
type Horizon = 'court' | 'moyen' | 'long';
type Choice = { label: string; value: string };

function ChoiceGroup({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: Choice[];
  onChange: (value: string) => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.group}>
      <Text style={[styles.question, { color: colors.foreground }]}>{label}</Text>
      <View style={styles.options}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={[styles.option, { backgroundColor: selected ? colors.primary : colors.card, borderColor: selected ? colors.primary : colors.border }]}
            >
              <Text style={[styles.optionText, { color: selected ? colors.primaryForeground : colors.foreground }]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function InvestorProfileScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const isSignedIn = useSignedIn();
  const profile = useGetInvestProfile({ query: { enabled: isSignedIn, retry: false, queryKey: getGetInvestProfileQueryKey() } });
  const update = useUpdateInvestProfile();
  const complete = useCompleteOnboarding();
  const [editing, setEditing] = useState(false);
  const [panic, setPanic] = useState<PanicResponse>('wait');
  const [experience, setExperience] = useState<Experience>('intermediaire');
  const [horizon, setHorizon] = useState<Horizon>('long');
  const [hadLoss, setHadLoss] = useState(false);
  const [soldInPanic, setSoldInPanic] = useState(false);
  const saving = update.isPending || complete.isPending;

  const submit = async () => {
    try {
      await update.mutateAsync({ data: {
        panicResponse: panic,
        investmentExperience: experience,
        timeHorizon: horizon,
        hadBigLoss: hadLoss,
        soldInPanic: hadLoss && soldInPanic,
      } });
      await complete.mutateAsync();
      await queryClient.invalidateQueries({ queryKey: getGetInvestProfileQueryKey() });
      setEditing(false);
    } catch {
      Alert.alert('Enregistrement impossible', 'Vérifiez votre connexion puis réessayez.');
    }
  };

  return (
    <InvestScreen title="Profil investisseur" subtitle="Quelques réponses pour adapter les analyses à votre tolérance au risque." refreshing={profile.isRefetching} onRefresh={() => { void profile.refetch(); }}>
      {!isSignedIn ? <LoginRequired /> : profile.isLoading ? <LoadingState /> : profile.isError ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.copy, { color: colors.mutedForeground }]}>Impossible de charger votre profil.</Text>
          <Pressable onPress={() => { void profile.refetch(); }}><Text style={[styles.link, { color: colors.primary }]}>Réessayer</Text></Pressable>
        </View>
      ) : profile.data?.onboardingCompleted && !editing ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.profileHeading}>
            <View style={[styles.profileIcon, { backgroundColor: colors.muted }]}><Feather name="shield" size={21} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>VOTRE PROFIL</Text>
              <Text style={[styles.profileTitle, { color: colors.foreground }]}>{profile.data.generatedProfile?.typeLabel ?? 'Profil établi'}</Text>
            </View>
          </View>
          <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.copy, { color: colors.mutedForeground }]}>Horizon</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>{profile.data.generatedProfile?.timeHorizonLabel ?? '—'}</Text>
          </View>
          <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.copy, { color: colors.mutedForeground }]}>Risque maximal estimé</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>{profile.data.generatedProfile?.maxRiskPct ?? '—'}{profile.data.generatedProfile?.maxRiskPct != null ? '%' : ''}</Text>
          </View>
          <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.copy, { color: colors.mutedForeground }]}>Secteurs privilégiés</Text>
            <Text style={[styles.infoValue, { color: colors.foreground, flex: 1, textAlign: 'right' }]}>{profile.data.generatedProfile?.preferredSectors.join(', ') || '—'}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => setEditing(true)} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
            <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Refaire le test</Text>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.copy, { color: colors.mutedForeground }]}>Ce questionnaire aide à adapter les recommandations. Il ne remplace pas un conseil financier.</Text>
          <ChoiceGroup label="Si les marchés chutent fortement, vous…" value={panic} onChange={(value) => setPanic(value as PanicResponse)} options={[
            { label: 'Vendez pour limiter les pertes', value: 'sell' },
            { label: 'Attendez une évolution', value: 'wait' },
            { label: 'Achetez davantage', value: 'buy' },
          ]} />
          <ChoiceGroup label="Votre expérience en investissement" value={experience} onChange={(value) => setExperience(value as Experience)} options={[
            { label: 'Débutant', value: 'debutant' },
            { label: 'Intermédiaire', value: 'intermediaire' },
            { label: 'Confirmé', value: 'confirme' },
          ]} />
          <ChoiceGroup label="Votre horizon de placement" value={horizon} onChange={(value) => setHorizon(value as Horizon)} options={[
            { label: 'Moins de 2 ans', value: 'court' },
            { label: '2 à 5 ans', value: 'moyen' },
            { label: 'Plus de 5 ans', value: 'long' },
          ]} />
          <ChoiceGroup label="Avez-vous déjà subi une forte perte ?" value={hadLoss ? 'yes' : 'no'} onChange={(value) => setHadLoss(value === 'yes')} options={[
            { label: 'Oui', value: 'yes' },
            { label: 'Non', value: 'no' },
          ]} />
          {hadLoss ? (
            <ChoiceGroup label="Avez-vous vendu sous l’effet de la panique ?" value={soldInPanic ? 'yes' : 'no'} onChange={(value) => setSoldInPanic(value === 'yes')} options={[
              { label: 'Oui', value: 'yes' },
              { label: 'Non', value: 'no' },
            ]} />
          ) : null}
          <Pressable accessibilityRole="button" testID="save-investor-profile" disabled={saving} onPress={() => { void submit(); }} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}>
            {saving ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Voir mon profil</Text>}
          </Pressable>
        </View>
      )}
    </InvestScreen>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, padding: 17, gap: 16 },
  profileHeading: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 4 },
  profileIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.2 },
  profileTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, marginTop: 4 },
  infoRow: { minHeight: 44, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  infoValue: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  copy: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  group: { gap: 9 },
  question: { fontFamily: 'Inter_600SemiBold', fontSize: 14, lineHeight: 20 },
  options: { gap: 7 },
  option: { minHeight: 42, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, justifyContent: 'center' },
  optionText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  primaryButton: { minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 5 },
  primaryText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  link: { fontFamily: 'Inter_600SemiBold', paddingVertical: 6 },
});
