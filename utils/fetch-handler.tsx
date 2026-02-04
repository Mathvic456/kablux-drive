import { useState, useCallback } from "react";

interface FetchOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    headers?: Record<string, string>;
    token?: string;
}

interface UseFetchReturn {
    request: (url: string, options?: FetchOptions) => Promise<any>;
    loading: boolean;
    error: string | null;
    clearError: () => void;
}

export const useFetch = (): UseFetchReturn => {
    const baseURL = process.env.EXPO_PUBLIC_API_URL || 'https://api.kabluxe.com/api/v1';
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearError = useCallback(() => setError(null), []);

    const request = useCallback(async (
        url: string,
        options: FetchOptions = {}
    ): Promise<any> => {
        const { method = 'GET', body, headers = {}, token } = options;

        setLoading(true);
        setError(null);

        try {
            const config: RequestInit = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                    ...headers,
                },
                ...(body && { body: JSON.stringify(body) }),
            };

            console.log('full url', `${baseURL}${url}`)

            const response = await fetch(`${baseURL}${url}`, config);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (err: any) {
            const errorMessage = err.message || 'Network request failed';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [baseURL]);

    return { request, loading, error, clearError };
};