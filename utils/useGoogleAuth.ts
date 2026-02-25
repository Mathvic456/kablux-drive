import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import * as AuthSession from 'expo-auth-session';


WebBrowser.maybeCompleteAuthSession();

interface UseGoogleAuthOptions {
  onSuccess: () => void;
  onError?: (message: string) => void;
}

export function useGoogleAuth({ onSuccess, onError }: UseGoogleAuthOptions) {
  // console.log(AuthSession.makeRedirectUri());

  const { setTokens } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  const exchangeWithBackend = async (idToken: string) => {
    console.log('token before req', idToken)
    try {

      const res = await api.post('auth/google_auth/', {
        id_token: idToken,
        role: 'driver',
      });

      console.log('res from be req', res)

      const accessToken: string | undefined = res.data?.access;
      const refreshToken: string | undefined = res.data?.refresh;

      if (!accessToken || !refreshToken) {
        throw new Error('Server did not return valid tokens.');
      }

      await setTokens(accessToken, refreshToken, false);
      onSuccess();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Authentication failed.';
      console.log('eerrrr', err)
      setError(msg);
      onError?.(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {

    if (!response || response.type !== 'success') return;

    const idToken =
      response.params?.id_token ?? response.authentication?.idToken;

    console.log('id token', idToken)

    if (!idToken) {
      const msg = 'Google sign-in succeeded but returned no ID token.';
      setError(msg);
      onError?.(msg);
      setIsLoading(false);
      return;
    }

    void exchangeWithBackend(idToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const promptGoogleSignIn = async () => {
    if (!request) return;
    setError(null);
    setIsLoading(true);

    const promptResult = await promptAsync();

    if (promptResult.type !== 'success') {
      setIsLoading(false);
      if (promptResult.type === 'error') {
        const msg = promptResult.error?.message ?? 'Google sign-in failed.';
        setError(msg);
        onError?.(msg);
      }
    }
  };

  return {
    promptGoogleSignIn,
    isLoading: isLoading || !request,
    error,
  };
}
