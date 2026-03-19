import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

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

export const useProfile = (token?: string) => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await api.get("users/me/");
      return response.data.data;
    },
    enabled: !!token,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<ProfileResponse>) => {
      const response = await api.patch("users/me/", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};
