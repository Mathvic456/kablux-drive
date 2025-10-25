import { useMutation } from "@tanstack/react-query";
import { api } from "./api";

export function useUploadFile() {
  return useMutation({
    mutationFn: (data: FormData) => 
      api.post("uploads/", data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),

    onSuccess: (res) => {
      console.log("File uploaded", res.data);
    },

    onError: (error: any) => {
      console.error("There's an error with uploading the file", error.response?.data || error);
    },
  });
}