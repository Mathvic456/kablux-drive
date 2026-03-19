import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

interface ImageAsset {
  uri: string;
  fileName?: string | null;
}

export const useUpdateProfileImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (asset: ImageAsset) => {
      // Step 1: Upload file to uploads/
      const formData = new FormData();
      const filename = asset.fileName || asset.uri.split("/").pop() || "profile.jpg";
      formData.append("files", {
        uri: asset.uri,
        type: "image/jpeg",
        name: filename,
      } as any);
      formData.append("name", "profile_image");

      const token = await AsyncStorage.getItem("token");
      const headers: Record<string, string> = {
        "Content-Type": "multipart/form-data",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const uploadRes = await api.post("uploads/", formData, {
        headers,
        transformRequest: (data: any) => data,
      });

      const fileId = uploadRes.data?.results?.[0]?.id;
      if (!fileId) {
        throw new Error("Upload succeeded but no file ID returned");
      }

      // Step 2: Update profile with file ID
      const updateRes = await api.patch("users/me/", {
        profile_image: fileId,
      });

      return updateRes.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};
