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

export const useLoginEndPoint = (navigation: any) => {
  return useMutation({
    mutationFn: (data) => api.post("auth/login/", data),
    onSuccess: async (res) => {
      const token = res.data?.data?.access;
      await AsyncStorage.setItem("token", token);
      console.log("✅ Token saved!");
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
