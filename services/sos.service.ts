import { useMutation } from "@tanstack/react-query";
import { api } from "./api";

export interface SOSRequestExtras {
    location?: { lat: number; lng: number };
    estimated_duration_seconds?: number;
}

export const sendSOSRequest = async (id: string, extras: SOSRequestExtras = {}) => {
    const payload: Record<string, any> = { ride_id: id };
    if (extras.location) payload.location = extras.location;
    if (typeof extras.estimated_duration_seconds === "number") {
        payload.estimated_duration_seconds = extras.estimated_duration_seconds;
    }
    const response = await api.post("/rides/sos/", payload);
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