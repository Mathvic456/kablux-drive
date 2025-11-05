import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { api } from "./api";
import { CREATEACCOUNT_TYPE } from "./type";


// Types for modal control
export type AuthResult = {
  success: boolean;
  message: string;
  data?: any;
};


export const useRegisterEndPoint = () => {
  const mutation = useMutation<AxiosResponse<any>, any, CREATEACCOUNT_TYPE>({
    mutationFn: (data) => api.post("auth/register/", data),
    onSuccess: (res) => {
      console.log("Registration successful:", res.data);
    },
    onError: (error: any) => {
      console.error("Registration error:", error);
    },
  });

  return mutation;
};

export const useLoginEndPoint = (navigation: any, remember: boolean) => {
  return useMutation({
    mutationFn: (data) => api.post("auth/login/", data),
    onSuccess: async (res) => {
      const token = res.data?.data?.access;
      const refreshToken = res.data?.data?.refresh;
      const userId = res.data?.data?.user?.id;
      //if (remember) {
    
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("refreshToken", refreshToken);
      await AsyncStorage.setItem("userId", userId)
      console.log("✅ Token saved!");
     // } else {
      //   console.log("Token not saved, remember me not checked.")
     // }
     
      navigation.replace('Tabs');

    },
    onError: (error) => {
      console.error("Login error:", error);
    },
  });
};


export const useLogoutEndPoint = () => {
  return useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem("token");
      return true;
    },
    onSuccess: () => {
      console.log("User logged out");
      // Don't show alert here - let component handle the modal
    },
    onError: (error: any) => {
      console.error("Logout error:", error);
      // Return error for component to handle
    },
  });
};
