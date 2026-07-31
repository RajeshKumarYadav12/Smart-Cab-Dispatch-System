import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useTripStore } from '../store/tripStore';
import { toast } from 'sonner';

export const useTripSocket = (tripId) => {
  const socketRef = useRef();
  const { updateTripStatus, setDriverLocation, setEta, currentTrip, setTrip } = useTripStore();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user || !tripId) return;

    socketRef.current = io('/', {
      withCredentials: true
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to socket server');
      socket.emit('subscribe:trip', tripId);
    });

    socket.on('trip:status:changed', ({ status }) => {
      updateTripStatus(status);
      toast.success(`Trip status updated: ${status}`);
      import('../api/client').then(({ fetchWithAuth }) => {
        fetchWithAuth(`/trip/${tripId}`).then(data => setTrip(data)).catch(console.error);
      });
    });

    socket.on('trip:assigned', ({ driverInfo, etaToPickup }) => {
      toast.success('A driver has been assigned to your trip!');
      setEta(etaToPickup);
      import('../api/client').then(({ fetchWithAuth }) => {
        fetchWithAuth(`/trip/${tripId}`).then(data => setTrip(data)).catch(console.error);
      });
    });

    socket.on('driver:location:broadcast', ({ lat, lng }) => {
      setDriverLocation({ lat, lng });
    });

    return () => {
      socket.emit('unsubscribe:trip', tripId);
      socket.disconnect();
    };
  }, [tripId, updateTripStatus, setDriverLocation, setEta]);

  return socketRef.current;
};
