import { useState } from 'react';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface UseGoogleAuthOptions {
  onSuccess: () => void;
  onError?: (message: string) => void;
}

export function useGoogleAuth({ onSuccess, onError }: UseGoogleAuthOptions) {
  const { setTokens } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const promptGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      const result: any = await GoogleSignin.signIn();

      // v16 returns { type: 'success' | 'cancelled', data: User }; older shapes
      // return the user directly. Handle both without leaning on type narrowing.
      if (result?.type === 'cancelled') {
        return;
      }
      const idToken: string | undefined = result?.data?.idToken ?? result?.idToken;
      if (!idToken) {
        throw new Error('Google sign-in returned no ID token.');
      }

      const res = await api.post('auth/google_auth/', {
        id_token: idToken,
        role: 'driver',
      });

      const accessToken: string | undefined = res.data?.access;
      const refreshToken: string | undefined = res.data?.refresh;
      if (!accessToken || !refreshToken) {
        throw new Error('Server did not return valid tokens.');
      }

      await setTokens(accessToken, refreshToken, false);
      onSuccess();
    } catch (err: any) {
      // Silently swallow user-initiated cancellations.
      if (
        err?.code === statusCodes.SIGN_IN_CANCELLED ||
        err?.code === statusCodes.IN_PROGRESS
      ) {
        return;
      }
      const msg =
        err instanceof Error ? err.message : 'Authentication failed.';
      console.warn('[useGoogleAuth] sign-in failed', {
        code: err?.code,
        message: err?.message,
      });
      setError(msg);
      onError?.(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    promptGoogleSignIn,
    isLoading,
    error,
  };
}
