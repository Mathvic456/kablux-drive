import { useContext, useEffect } from "react";
import { SocketContext } from "../context/WebSocketProvider"

export const useDriverSocket = (currentLat: number, currentLng: number, setNewRideNotification: Function) => {
  const { socket } = useContext(SocketContext);

  useEffect(() => {
    if (!socket) return;

    // Go online
    socket.send(JSON.stringify({
      type: "driver_online",
      location: { lat: currentLat, lng: currentLng },
    }));

    // Update location every 5 seconds
    const interval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: "update_location",
          location: { lat: currentLat, lng: currentLng },
        }));
      }
    }, 5000);

    // Listen for rides
    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === "new_ride_available") {
        setNewRideNotification(data);
      }
    };

    socket.addEventListener("message", handleMessage);

    return () => {
      clearInterval(interval);
      socket.removeEventListener("message", handleMessage);
    };
  }, [socket, currentLat, currentLng]);
};
