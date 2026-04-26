import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { useAuth } from "../context/AuthContext";

export interface ProfileResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  address?: string;
  phone_number?: string;
  referral_code?: string;
  profile_image?: string | null;
  rating?: number;
  type?: string;
  has_completed_kyc?: boolean;
  is_online?: boolean;
  upload_id?: string;
}

/**
 * Standalone fetch for use outside React components (e.g. WebSocketProvider init).
 * Returns the server's current online status for the authenticated driver.
 */
export const fetchProfileStatus = async (): Promise<{ is_online: boolean }> => {
  const response = await api.get("users/me/");
  const data = response.data?.data ?? response.data;
  return { is_online: data?.is_online ?? false };
};

export const useProfile = (tokenOverride?: string) => {
  // Default: read token from AuthContext so the query auto-enables once the
  // user is authenticated. Callers can still pass an explicit token to force.
  const { token: contextToken } = useAuth();
  const token = tokenOverride ?? contextToken;

  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await api.get("users/me/");
      console.log('es user---', response.data);
      return response.data.data;
    },
    enabled: !!token,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<ProfileResponse>) => {
      const response = await api.post("users/set-profile-picture/", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

export const useEditProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<ProfileResponse> & { id: string }) => {
      const { id, ...data } = payload;
      const response = await api.put(`users/${id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};
