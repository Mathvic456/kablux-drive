import { useMutation } from "@tanstack/react-query";
import { api } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useUploadFile() {
  return useMutation({
    mutationFn: async (data: FormData) => {
      const token = await AsyncStorage.getItem("token");

      const headers: Record<string, string> = {

        "Content-Type": "multipart/form-data",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      return api.post("uploads/", data, {
        headers,

        transformRequest: (data) => {
          return data;
        },
      });
    },
  });
}