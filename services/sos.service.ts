import { useMutation } from "@tanstack/react-query";
import { api } from "./api";

export const sendSOSRequest = async (id: string) => {
    const response = await api.post("/rides/sos/", { ride_id: id });
    return response.data;
};

export const useSOS = (id: string) => {
    return useMutation({
        mutationFn: () => sendSOSRequest(id),
        onSuccess: (data) => {
            console.log("SOS sent successfully:", data);
        },
        onError: (error) => {
            console.error("Failed to send SOS:", error);
        },
    });
};