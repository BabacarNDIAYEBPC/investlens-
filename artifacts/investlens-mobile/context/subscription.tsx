import { useQueryClient } from '@tanstack/react-query';
import { getGetUserPlanQueryKey, useGetUserPlan } from '@workspace/api-client-react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import Purchases, {
  INTRO_ELIGIBILITY_STATUS,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';
import { useAuth } from '@/context/auth';

export const PRO_ENTITLEMENT = 'pro';

type KeyResolution =
  | { kind: 'test'; apiKey: string }
  | { kind: 'ios'; apiKey: string }
  | { kind: 'unavailable'; reason: string };

function resolveApiKey(): KeyResolution {
  const testKey = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
  const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  if (__DEV__ || Platform.OS === 'web' || isExpoGo) {
    return testKey ? { kind: 'test', apiKey: testKey } : { kind: 'unavailable', reason: 'Clé RevenueCat de test absente de la configuration.' };
  }
  if (Platform.OS === 'ios') {
    return iosKey ? { kind: 'ios', apiKey: iosKey } : { kind: 'unavailable', reason: 'Clé RevenueCat iOS absente de la configuration.' };
  }
  return { kind: 'unavailable', reason: 'Les abonnements ne sont pas encore disponibles sur cette plateforme.' };
}

export type TrialStatus = 'eligible' | 'ineligible' | 'unknown' | 'none';
export type PurchaseOutcome = 'success' | 'cancelled' | 'pending' | 'error' | 'blocked';

type SubscriptionContextValue = {
  available: boolean;
  unavailableReason: string | null;
  isTestStore: boolean;
  isReady: boolean;
  isSwitchingIdentity: boolean;
  isLoading: boolean;
  error: string | null;
  offering: PurchasesOffering | null;
  customerInfo: CustomerInfo | null;
  isPro: boolean;
  trialStatus: Record<string, TrialStatus>;
  purchase: (pkg: PurchasesPackage) => Promise<{ outcome: PurchaseOutcome; message?: string }>;
  restore: () => Promise<{ outcome: PurchaseOutcome; message?: string }>;
  refresh: () => Promise<void>;
  openManagement: () => Promise<boolean>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

function errorMessage(err: unknown): string {
  const e = err as { message?: string } | null;
  return e?.message || 'Une erreur inattendue est survenue.';
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useAuth();
  const queryClient = useQueryClient();
  const keyRef = useRef<KeyResolution>(resolveApiKey());
  const key = keyRef.current;
  const available = key.kind !== 'unavailable';

  const configuredRef = useRef(false);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const activeUserRef = useRef<string | null>(null);
  const generationRef = useRef(0);

  const [isReady, setIsReady] = useState(false);
  const [isSwitchingIdentity, setSwitching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [trialStatus, setTrialStatus] = useState<Record<string, TrialStatus>>({});
  const [retryIdentity, setRetryIdentity] = useState(0);
  const serverPlan = useGetUserPlan({
    query: {
      queryKey: [...getGetUserPlanQueryKey(), user?.userId],
      enabled: isLoaded && !!user,
      staleTime: 15_000,
    },
  });

  const invalidatePlan = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: getGetUserPlanQueryKey() });
  }, [queryClient]);

  const loadData = useCallback(async (generation: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const [info, offerings] = await Promise.all([Purchases.getCustomerInfo(), Purchases.getOfferings()]);
      if (generation !== generationRef.current) return;
      setCustomerInfo(info);
      const current = offerings.current ?? null;
      setOffering(current);
      const statuses: Record<string, TrialStatus> = {};
      const withIntro = (current?.availablePackages ?? []).filter((p) => !!p.product.introPrice);
      for (const p of current?.availablePackages ?? []) statuses[p.product.identifier] = p.product.introPrice ? 'unknown' : 'none';
      if (withIntro.length > 0) {
        try {
          const elig = await Purchases.checkTrialOrIntroductoryPriceEligibility(withIntro.map((p) => p.product.identifier));
          for (const [id, v] of Object.entries(elig)) {
            statuses[id] = v.status === INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE
              ? 'eligible'
              : v.status === INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_INELIGIBLE || v.status === INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_NO_INTRO_OFFER_EXISTS
                ? 'ineligible'
                : 'unknown';
          }
        } catch {
          // keep 'unknown': never promise a trial we could not verify
        }
      }
      if (generation !== generationRef.current) return;
      setTrialStatus(statuses);
    } catch (err) {
      if (generation === generationRef.current) setError(errorMessage(err));
    } finally {
      if (generation === generationRef.current) setIsLoading(false);
    }
  }, []);

  // Serialize identity changes.
  useEffect(() => {
    if (!isLoaded || key.kind === 'unavailable') return;
    const targetId = user?.userId != null ? String(user.userId) : null;
    const generation = ++generationRef.current;
    setSwitching(true);
    setIsReady(false);
    setCustomerInfo(null);
    setOffering(null);
    setTrialStatus({});
    setError(null);
    setIsLoading(false);

    queueRef.current = queueRef.current.then(async () => {
      try {
        if (!targetId) {
          if (configuredRef.current && !(await Purchases.isAnonymous())) await Purchases.logOut();
          activeUserRef.current = null;
          return;
        }
        if (!configuredRef.current) {
          Purchases.configure({ apiKey: key.apiKey, appUserID: targetId });
          configuredRef.current = true;
        } else if ((await Purchases.getAppUserID()) !== targetId) {
          await Purchases.logIn(targetId);
        }
        activeUserRef.current = targetId;
      } catch (err) {
        activeUserRef.current = null;
        if (generation === generationRef.current) setError(errorMessage(err));
      }
    }).then(async () => {
      if (generation !== generationRef.current) return;
      setSwitching(false);
      if (targetId && activeUserRef.current === targetId) {
        setIsReady(true);
        await loadData(generation);
      }
    });
  }, [user?.userId, isLoaded, key, loadData, retryIdentity]);

  useEffect(() => {
    if (!isReady || !user) return;
    const generation = generationRef.current;
    const onInfo = (info: CustomerInfo) => {
      if (generation !== generationRef.current) return;
      setCustomerInfo(info);
      void invalidatePlan();
    };
    Purchases.addCustomerInfoUpdateListener(onInfo);
    const foreground = AppState.addEventListener('change', (state) => {
      if (state === 'active' && generation === generationRef.current) {
        void loadData(generation);
        void invalidatePlan();
      }
    });
    return () => {
      Purchases.removeCustomerInfoUpdateListener(onInfo);
      foreground.remove();
    };
  }, [isReady, user?.userId, invalidatePlan, loadData]);

  const canTransact = useCallback(() => {
    return available && isReady && !isSwitchingIdentity && !!user && activeUserRef.current === String(user.userId);
  }, [available, isReady, isSwitchingIdentity, user]);

  const purchase = useCallback(async (pkg: PurchasesPackage) => {
    if (!canTransact()) return { outcome: 'blocked' as const, message: 'Compte en cours de synchronisation. Réessayez dans un instant.' };
    if (serverPlan.isPending || serverPlan.isError) return { outcome: 'blocked' as const, message: 'Impossible de vérifier votre abonnement actuel. Actualisez avant d’acheter.' };
    if (serverPlan.data?.plan !== 'starter') return { outcome: 'blocked' as const, message: 'Votre compte dispose déjà d’un abonnement actif.' };
    const generation = generationRef.current;
    const operation = queueRef.current.then(async () => {
    if (generation !== generationRef.current) return { outcome: 'blocked' as const, message: 'Votre compte a changé. Réessayez.' };
    try {
      const { customerInfo: info } = await Purchases.purchasePackage(pkg);
      if (generation !== generationRef.current) return { outcome: 'blocked' as const, message: 'Achat enregistré sur le compte initial. Reconnectez-vous à ce compte pour le consulter.' };
      setCustomerInfo(info);
      await invalidatePlan();
      if (!info.entitlements.active[PRO_ENTITLEMENT]) return { outcome: 'pending' as const, message: 'Achat enregistré. L’accès Pro sera activé après confirmation du magasin.' };
      return { outcome: 'success' as const };
    } catch (err) {
      const e = err as { code?: string; userCancelled?: boolean };
      if (e?.userCancelled || e?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return { outcome: 'cancelled' as const };
      if (e?.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
        invalidatePlan();
        return { outcome: 'pending' as const, message: 'Paiement en attente de validation. Pro sera activé dès sa confirmation.' };
      }
      return { outcome: 'error' as const, message: errorMessage(err) };
    }
    });
    queueRef.current = operation.then(() => undefined, () => undefined);
    return operation;
  }, [canTransact, invalidatePlan, serverPlan.isPending, serverPlan.isError, serverPlan.data?.plan]);

  const restore = useCallback(async () => {
    if (!canTransact()) return { outcome: 'blocked' as const, message: 'Compte en cours de synchronisation. Réessayez dans un instant.' };
    const generation = generationRef.current;
    const operation = queueRef.current.then(async () => {
    if (generation !== generationRef.current) return { outcome: 'blocked' as const, message: 'Votre compte a changé. Réessayez.' };
    try {
      const info = await Purchases.restorePurchases();
      if (generation !== generationRef.current) return { outcome: 'blocked' as const, message: 'Votre compte a changé. Reconnectez-vous pour consulter les achats restaurés.' };
      setCustomerInfo(info);
      await invalidatePlan();
      return { outcome: 'success' as const };
    } catch (err) {
      return { outcome: 'error' as const, message: errorMessage(err) };
    }
    });
    queueRef.current = operation.then(() => undefined, () => undefined);
    return operation;
  }, [canTransact, invalidatePlan]);

  const refresh = useCallback(async () => {
    await invalidatePlan();
    if (!canTransact()) {
      if (user && !isSwitchingIdentity) setRetryIdentity((value) => value + 1);
      return;
    }
    await loadData(generationRef.current);
  }, [canTransact, loadData, invalidatePlan, user, isSwitchingIdentity]);

  const openManagement = useCallback(async () => {
    const url = customerInfo?.managementURL;
    if (!url) return false;
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      return false;
    }
  }, [customerInfo]);

  const isPro = !!customerInfo?.entitlements.active[PRO_ENTITLEMENT]
    || (!!user && serverPlan.data != null && serverPlan.data.plan !== 'starter');

  return (
    <SubscriptionContext.Provider
      value={{
        available,
        unavailableReason: key.kind === 'unavailable' ? key.reason : null,
        isTestStore: key.kind === 'test',
        isReady,
        isSwitchingIdentity,
        isLoading,
        error,
        offering,
        customerInfo,
        isPro,
        trialStatus,
        purchase,
        restore,
        refresh,
        openManagement,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextValue {
  const value = useContext(SubscriptionContext);
  if (!value) throw new Error('useSubscription must be used inside SubscriptionProvider');
  return value;
}
