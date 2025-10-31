import { useQuery } from "@tanstack/react-query";
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


export const useProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () =>
      api
        .get<{ data: ProfileResponse }>("users/me")
        .then((res) => res.data.data),
  });
};

//Check123check**
