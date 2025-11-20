import { useMutation } from "@tanstack/react-query";
import { api } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useUploadFile() {
  return useMutation({
    mutationFn: async (data: FormData) => {
      const token = await AsyncStorage.getItem('token');

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      return api.post("uploads/", data, {
        headers: {
          ...headers,
        },
      });

    },

    onSuccess: (res) => {
      console.log("File uploaded", res.data);
    },

    onError: (error: any) => {
      console.error("There's an error with uploading the file", error.response?.data || error);
    },
  });
}