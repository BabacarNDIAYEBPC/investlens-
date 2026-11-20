import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { InvestScreen, LoginRequired } from '@/components/InvestScreen';
import { useAuth } from '@/context/auth';
import { useSubscription } from '@/context/subscription';
import { useColors } from '@/hooks/useColors';

const APPLE_EULA = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

const benefits = [
  { icon: 'shield' as const, title: 'Profil de risque détaillé', text: 'Comprenez ce que votre tolérance implique, ligne par ligne.' },
  { icon: 'pie-chart' as const, title: 'Analyse de portefeuille', text: 'Concentration, diversification et points d’attention expliqués.' },
  { icon: 'globe' as const, title: 'Radar mondial complet', text: 'Les actualités qui comptent pour vos positions, sans bruit.' },
];

function periodLabel(pkg: PurchasesPackage): string {
  switch (pkg.packageType) {
    case 'MONTHLY': return 'par mois';
    case 'ANNUAL': return 'par an';
    case 'WEEKLY': return 'par semaine';
    case 'SIX_MONTH': return 'tous les 6 mois';
    case 'THREE_MONTH': return 'tous les 3 mois';
    case 'TWO_MONTH': return 'tous les 2 mois';
    case 'LIFETIME': return 'paiement unique';
    default: return '';
  }
}

function unitFr(unit: string, n: number) {
  const map: Record<string, [string, string]> = { DAY: ['jour', 'jours'], WEEK: ['semaine', 'semaines'], MONTH: ['mois', 'mois'], YEAR: ['an', 'ans'] };
  const m = map[unit] ?? [unit.toLowerCase(), unit.toLowerCase()];
  return `${n} ${n > 1 ? m[1] : m[0]}`;
}

type Feedback = { tone: 'success' | 'info' | 'error'; text: string } | null;

export default function SubscribeScreen() {
  const colors = useColors();
  const { isSignedIn, isLoaded } = useAuth();
  const sub = useSubscription();
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState<'purchase' | 'restore' | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const packages = sub.offering?.availablePackages ?? [];
  useEffect(() => {
    if (packages.length && !packages.some((p) => p.identifier === selected)) setSelected(packages[0].identifier);
  }, [packages, selected]);
  const pkg = packages.find((p) => p.identifier === selected) ?? null;
  const locked = !sub.isReady || sub.isSwitchingIdentity || busy !== null;

  const onPurchase = async () => {
    if (!pkg) return;
    setBusy('purchase');
    setFeedback(null);
    const r = await sub.purchase(pkg);
    setBusy(null);
    if (r.outcome === 'success') setFeedback({ tone: 'success', text: 'Bienvenue dans Pro. Votre accès est actif.' });
    else if (r.outcome === 'cancelled') setFeedback({ tone: 'info', text: 'Achat annulé. Aucun montant n’a été débité.' });
    else if (r.outcome === 'pending') setFeedback({ tone: 'info', text: r.message ?? 'Paiement en attente.' });
    else setFeedback({ tone: 'error', text: r.message ?? 'L’achat n’a pas abouti.' });
  };

  const onRestore = async () => {
    setBusy('restore');
    setFeedback(null);
    const r = await sub.restore();
    setBusy(null);
    if (r.outcome === 'success') setFeedback({ tone: 'success', text: 'Restauration terminée. Les achats liés à ce compte ont été vérifiés.' });
    else setFeedback({ tone: 'error', text: r.message ?? 'Restauration impossible.' });
  };

  const onManage = async () => {
    const ok = await sub.openManagement();
    if (!ok) setFeedback({ tone: 'info', text: sub.customerInfo?.entitlements.active.pro
      ? 'Gérez votre abonnement depuis les réglages de votre compte Apple (Réglages > Identifiant Apple > Abonnements).'
      : 'Votre accès est déjà actif sur votre compte InvestLens. Sa gestion dépend du service utilisé lors de la souscription.' });
  };

  const toneColor = (t: 'success' | 'info' | 'error') => (t === 'success' ? colors.success : t === 'error' ? colors.destructive : colors.foreground);

  const proEnt = sub.customerInfo?.entitlements.active.pro;
  const trial = pkg?.product.introPrice && sub.trialStatus[pkg.product.identifier] === 'eligible' ? pkg.product.introPrice : null;

  return (
    <InvestScreen title="InvestLens Pro" subtitle="Des outils plus profonds pour décider avec méthode. Pas de promesse de rendement, pas de signaux spéculatifs.">
      {sub.isTestStore ? (
        <View testID="subscribe-test-notice" style={[styles.notice, { borderColor: colors.border, backgroundColor: colors.muted }]}>
          <Feather name="info" size={16} color={colors.foreground} />
          <Text style={[styles.noticeText, { color: colors.foreground }]}>Aperçu Test Store : aucun argent réel n’est débité. Les essais gratuits ne peuvent pas être simulés dans ce mode.</Text>
        </View>
      ) : null}

      {!isLoaded ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : !isSignedIn ? (
        <LoginRequired />
      ) : !sub.available ? (
        <StateCard icon="slash" title="Abonnement indisponible" text={sub.unavailableReason ?? 'Indisponible sur cette plateforme.'} />
      ) : sub.isSwitchingIdentity || (!sub.isReady && !sub.error) || (sub.isLoading && !sub.offering) ? (
        <View testID="subscribe-loading" style={{ gap: 10 }}>
          {[96, 76, 76].map((h, i) => <View key={i} style={[styles.skeleton, { height: h, backgroundColor: colors.muted }]} />)}
        </View>
      ) : sub.error && !sub.offering ? (
        <StateCard icon="alert-triangle" title="Chargement impossible" text={sub.error} action="Réessayer" onAction={sub.refresh} testID="subscribe-retry" />
      ) : sub.isPro ? (
        <View testID="subscribe-active" style={[styles.hero, { backgroundColor: colors.primary }]}>
          <Text style={[styles.heroEyebrow, { color: colors.primaryForeground }]}>STATUT</Text>
          <Text style={[styles.heroTitle, { color: colors.primaryForeground }]}>Pro est actif</Text>
          <Text style={[styles.heroText, { color: colors.primaryForeground }]}>
            {proEnt?.expirationDate
              ? `${proEnt.willRenew ? 'Renouvellement' : 'Fin d’accès'} le ${new Date(proEnt.expirationDate).toLocaleDateString('fr-FR')}`
              : 'Accès lié à votre compte InvestLens.'}
          </Text>
          <Pressable testID="subscribe-manage" accessibilityRole="button" onPress={onManage} style={[styles.secondaryBtn, { borderColor: colors.primaryForeground }]}>
            <Text style={[styles.secondaryText, { color: colors.primaryForeground }]}>Gérer l’abonnement</Text>
          </Pressable>
        </View>
      ) : packages.length === 0 ? (
        <StateCard icon="package" title="Aucune offre pour le moment" text="Les formules Pro ne sont pas encore publiées. Revenez un peu plus tard." action="Actualiser" onAction={sub.refresh} testID="subscribe-empty-refresh" />
      ) : (
        <>
          <View style={{ gap: 12 }}>
            {benefits.map((b) => (
              <View key={b.title} style={styles.benefit}>
                <View style={[styles.iconBox, { backgroundColor: colors.muted }]}><Feather name={b.icon} size={17} color={colors.foreground} /></View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.benefitTitle, { color: colors.foreground }]}>{b.title}</Text>
                  <Text style={[styles.small, { color: colors.mutedForeground }]}>{b.text}</Text>
                </View>
              </View>
            ))}
          </View>

          <View accessibilityRole="radiogroup" style={{ gap: 10 }}>
            {packages.map((p) => {
              const active = p.identifier === selected;
              return (
                <Pressable
                  key={p.identifier}
                  testID={`subscribe-package-${p.identifier}`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active, disabled: locked }}
                  disabled={locked}
                  onPress={() => setSelected(p.identifier)}
                  style={[styles.pkg, { backgroundColor: colors.card, borderColor: active ? colors.primary : colors.border, borderWidth: active ? 2 : 1 }]}
                >
                  <View style={[styles.radio, { borderColor: active ? colors.primary : colors.border }]}>{active ? <View style={[styles.radioDot, { backgroundColor: colors.primary }]} /> : null}</View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={[styles.benefitTitle, { color: colors.foreground }]}>{p.product.title}</Text>
                    {p.product.description ? <Text numberOfLines={2} style={[styles.small, { color: colors.mutedForeground }]}>{p.product.description}</Text> : null}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.price, { color: colors.foreground }]}>{p.product.priceString}</Text>
                    <Text style={[styles.small, { color: colors.mutedForeground }]}>{periodLabel(p)}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {trial ? (
            <Text testID="subscribe-trial" style={[styles.small, { color: colors.success }]}>
              {trial.price === 0
                ? `Essai gratuit de ${unitFr(trial.periodUnit, trial.periodNumberOfUnits)}, puis ${pkg?.product.priceString} ${pkg ? periodLabel(pkg) : ''}.`
                : `Offre de lancement : ${trial.priceString} pendant ${unitFr(trial.periodUnit, trial.periodNumberOfUnits * Math.max(1, trial.cycles))}.`}
            </Text>
          ) : null}

          <Pressable
            testID="subscribe-purchase"
            accessibilityRole="button"
            accessibilityState={{ disabled: locked || !pkg, busy: busy === 'purchase' }}
            disabled={locked || !pkg}
            onPress={onPurchase}
            style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: locked || !pkg ? 0.55 : 1 }]}
          >
            {busy === 'purchase' ? <ActivityIndicator color={colors.primaryForeground} /> : (
              <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>
                {trial && trial.price === 0 ? 'Commencer l’essai' : pkg ? `S’abonner pour ${pkg.product.priceString}` : 'S’abonner'}
              </Text>
            )}
          </Pressable>
        </>
      )}

      {feedback ? (
        <View testID="subscribe-feedback" accessibilityLiveRegion="polite" style={[styles.notice, { borderColor: toneColor(feedback.tone), backgroundColor: colors.card }]}>
          <Feather name={feedback.tone === 'success' ? 'check-circle' : feedback.tone === 'error' ? 'alert-circle' : 'info'} size={16} color={toneColor(feedback.tone)} />
          <Text style={[styles.noticeText, { color: colors.foreground }]}>{feedback.text}</Text>
        </View>
      ) : null}

      {isSignedIn && sub.available ? (
        <View style={styles.row}>
          <Pressable testID="subscribe-restore" accessibilityRole="button" disabled={locked} onPress={onRestore} style={[styles.linkBtn, { opacity: locked ? 0.5 : 1 }]}>
            {busy === 'restore' ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={[styles.link, { color: colors.primary }]}>Restaurer les achats</Text>}
          </Pressable>
          {!sub.isPro && sub.customerInfo?.managementURL ? (
            <Pressable testID="subscribe-manage-link" accessibilityRole="button" onPress={onManage} style={styles.linkBtn}>
              <Text style={[styles.link, { color: colors.primary }]}>Gérer</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <Text style={[styles.legal, { color: colors.mutedForeground }]}>
        L’abonnement se renouvelle automatiquement à la fin de chaque période, au prix affiché, sauf annulation au moins 24 heures avant la date de renouvellement. Le paiement est prélevé sur votre compte de la boutique à la confirmation. Vous pouvez gérer ou annuler l’abonnement dans les réglages de votre compte. InvestLens fournit des informations pédagogiques et ne constitue pas un conseil en investissement personnalisé.
      </Text>
      <View style={styles.row}>
        <Pressable testID="subscribe-eula" accessibilityRole="link" onPress={() => Linking.openURL(APPLE_EULA)} style={styles.linkBtn}>
          <Text style={[styles.link, { color: colors.mutedForeground }]}>Conditions d’utilisation (EULA Apple)</Text>
        </Pressable>
        <Pressable testID="subscribe-privacy" accessibilityRole="link" onPress={() => router.push({ pathname: '/privacy', params: { from: 'subscribe' } })} style={styles.linkBtn}>
          <Text style={[styles.link, { color: colors.mutedForeground }]}>Confidentialité</Text>
        </Pressable>
      </View>
    </InvestScreen>
  );
}

function StateCard({ icon, title, text, action, onAction, testID }: { icon: React.ComponentProps<typeof Feather>['name']; title: string; text: string; action?: string; onAction?: () => void; testID?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name={icon} size={22} color={colors.mutedForeground} />
      <Text style={[styles.benefitTitle, { color: colors.foreground, fontSize: 16 }]}>{title}</Text>
      <Text style={[styles.small, { color: colors.mutedForeground, fontSize: 13, lineHeight: 19 }]}>{text}</Text>
      {action && onAction ? (
        <Pressable testID={testID} accessibilityRole="button" onPress={onAction} style={[styles.primaryBtn, { backgroundColor: colors.primary, alignSelf: 'stretch' }]}>
          <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { minHeight: 160, alignItems: 'center', justifyContent: 'center' },
  notice: { flexDirection: 'row', gap: 10, borderWidth: 1, borderRadius: 14, padding: 13, alignItems: 'flex-start' },
  noticeText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12.5, lineHeight: 18 },
  skeleton: { borderRadius: 16 },
  hero: { borderRadius: 20, padding: 22, gap: 8 },
  heroEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 2, opacity: 0.7 },
  heroTitle: { fontFamily: 'Inter_700Bold', fontSize: 24, letterSpacing: -0.4 },
  heroText: { fontFamily: 'Inter_400Regular', fontSize: 14, opacity: 0.85 },
  benefit: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  iconBox: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  benefitTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  small: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 },
  pkg: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 14, minHeight: 72 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  price: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  primaryBtn: { minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, marginTop: 4 },
  primaryText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  secondaryBtn: { minHeight: 46, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  secondaryText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  card: { borderWidth: 1, borderRadius: 18, padding: 20, gap: 8, alignItems: 'flex-start' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center' },
  linkBtn: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 4 },
  link: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  legal: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
});
