import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { InvestScreen } from '@/components/InvestScreen';
import { useColors } from '@/hooks/useColors';

const sections = [
  { title: 'Compte', text: 'Vous créez un compte avec une adresse e-mail et un mot de passe (et, facultativement, un prénom). Ces données servent à vous authentifier. Un jeton de session est conservé sur votre appareil.' },
  { title: 'Profil et portefeuille', text: 'Les réponses au questionnaire de profil investisseur, les positions que vous saisissez et vos alertes sont enregistrées sur notre serveur afin de vous les afficher et de calculer les analyses.' },
  { title: 'Données de marché', text: 'Les cours et actualités proviennent de Finnhub. Les requêtes portent sur des symboles boursiers ; votre identité n’est pas transmise à Finnhub.' },
  { title: 'Analyses par IA', text: 'Certaines explications sont générées par un modèle d’OpenAI. Les informations nécessaires à l’analyse (par exemple votre profil de risque et la composition de votre portefeuille) peuvent lui être transmises.' },
  { title: 'Abonnements', text: 'Les achats sont traités par Apple et gérés via RevenueCat, qui reçoit votre identifiant InvestLens interne et l’historique d’achat. Nous ne recevons pas vos coordonnées bancaires.' },
  { title: 'Suppression', text: 'La suppression de compte n’est pas proposée dans cette application. Elle est disponible depuis la version web d’InvestLens.' },
];

export default function PrivacyScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const colors = useColors();
  return (
    <InvestScreen title="Confidentialité" subtitle="Ce que l’application collecte, et pourquoi." onBack={() => router.replace(from === 'subscribe' ? '/subscribe' : '/(tabs)/more')}>
      <View testID="privacy-draft-notice" style={[styles.notice, { borderColor: colors.border, backgroundColor: colors.muted }]}>
        <Feather name="edit-3" size={16} color={colors.foreground} />
        <Text style={[styles.noticeText, { color: colors.foreground }]}>
          Document en préparation. L’identité de l’éditeur et ses coordonnées de contact doivent encore être complétées par l’exploitant ; cette politique ne doit pas être considérée comme publiée avant cela.
        </Text>
      </View>
      {sections.map((s, i) => (
        <View key={s.title} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.index, { color: colors.mutedForeground }]}>{String(i + 1).padStart(2, '0')}</Text>
          <View style={{ flex: 1, gap: 5 }}>
            <Text style={[styles.title, { color: colors.foreground }]}>{s.title}</Text>
            <Text style={[styles.text, { color: colors.mutedForeground }]}>{s.text}</Text>
          </View>
        </View>
      ))}
    </InvestScreen>
  );
}

const styles = StyleSheet.create({
  notice: { flexDirection: 'row', gap: 10, borderWidth: 1, borderRadius: 14, padding: 13 },
  noticeText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12.5, lineHeight: 18 },
  card: { flexDirection: 'row', gap: 14, borderWidth: 1, borderRadius: 16, padding: 16 },
  index: { fontFamily: 'Inter_700Bold', fontSize: 12, letterSpacing: 1, marginTop: 2 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  text: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
});
