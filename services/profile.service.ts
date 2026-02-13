import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import axios from "axios";
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


export const useProfile = (token: string) => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      console.log("enter");
      console.log("tokennnnnnnnnn", token);

      const storedToken = await AsyncStorage.getItem("token")
      console.log(storedToken, " stored token -------------------c")
      try {
        const response = await axios.get(
          "https://api.kabluxe.com/api/v1/users/me/",
          {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          }
        );

        console.log("from profile service=====", response);
        return response.data.data;
      } catch (error: any) {
        console.log("AXIOS ERROR:", error.message);
        console.log("AXIOS RESPONSE:", error.response);
        throw error;
      }
    }
  });
};
// export const useProfile = () => {
//   return useQuery({
//     queryKey: ["profile"],
//     queryFn: () =>
//       api
//         .get<{ data: ProfileResponse }>("users/me")
//         .then((res) => res.data.data),
//   });
// };

//Check123check**
