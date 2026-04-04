import { useMutation } from "@tanstack/react-query"
import { api } from "./api";

export const useCreateVehicle = () => {
    return useMutation({
        mutationFn: async (data: { plate_number: string; model: string; year: number; color: string }) => {
            const response = await api.post("drivers/vehicles/", data);
            return response.data;
        },
        onSuccess: () => {
            // Invalidate or refetch any relevant queries here if needed
            console.log('Create vehicle success')
        },
        onError: (error: any) => {
            console.error("Error creating vehicle:", error);
        }
    });
}

export const useVehicleImages = () => {
    return useMutation({
        mutationFn: async (payload: {
            vehicle_id: string;
            images: { file: string; image_type: string }[];
        }) => {
            const { vehicle_id, images } = payload;
            console.log({ images: images })

            const response = await api.post(
                `drivers/vehicles/${vehicle_id}/images/`,
                { images: images }
            );

            return response.data;
        },
    });
};