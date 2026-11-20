import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAuthMe,
  login as apiLogin,
  register as apiRegister,
  type AuthTokenResponse,
  type AuthUser,
} from '@workspace/api-client-react';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const TOKEN_KEY = 'investlens_mobile_token';

export async function getTokenForApi(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

type AuthContextValue = {
  user: AuthUser | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (firstName: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function userFromResponse(response: AuthTokenResponse): AuthUser {
  return { userId: response.userId, email: response.email, role: response.role };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    getTokenForApi()
      .then(async (token) => {
        if (!token) return;
        try {
          const current = await getAuthMe();
          if (active) setUser(current);
        } catch {
          await AsyncStorage.removeItem(TOKEN_KEY);
        }
      })
      .finally(() => {
        if (active) setIsLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const acceptResponse = useCallback(async (response: AuthTokenResponse) => {
    await AsyncStorage.setItem(TOKEN_KEY, response.token);
    setUser(userFromResponse(response));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await acceptResponse(await apiLogin({ email: email.trim(), password }));
  }, [acceptResponse]);

  const signUp = useCallback(async (firstName: string, email: string, password: string) => {
    await acceptResponse(await apiRegister({
      firstName: firstName.trim() || undefined,
      email: email.trim(),
      password,
    }));
  }, [acceptResponse]);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoaded, isSignedIn: !!user, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
