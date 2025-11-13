import { api } from "./api"
import { useMutation } from "@tanstack/react-query";


export const useSendOffer = () => {
    
  return useMutation({
    mutationFn: async(data: {counter_offer: number, ride_request: string}) => {
        api.post(`rides/requests/send_offer_driver/`, data)
    },
    onSuccess: (res) => {
        console.log("Successfully sent back to rider", res)
    },
    onError: (err) => {
        console.log("An error occured:", err)
    }
  })
}
