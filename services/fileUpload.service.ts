import { useMutation } from "@tanstack/react-query";
import { api } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useUploadFile() {
  return useMutation({
    mutationFn: async (data: FormData) => {
      const token = await AsyncStorage.getItem("token");

      const headers: Record<string, string> = {
        // 1. Force the content type for this specific request
        "Content-Type": "multipart/form-data",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      return api.post("uploads/", data, {
        headers,
        // 2. CRITICAL: Prevent Axios from trying to 
        // stringify the FormData into JSON
        transformRequest: (data) => {
          return data;
        },
      });
    },
  });
}