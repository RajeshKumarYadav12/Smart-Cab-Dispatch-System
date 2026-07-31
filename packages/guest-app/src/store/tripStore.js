import { create } from 'zustand';

export const useTripStore = create((set) => ({
  currentTrip: null,
  driverLocation: null,
  eta: null,
  setTrip: (trip) => set({ currentTrip: trip, eta: trip?.etaToPickup || null }),
  updateTripStatus: (status) => set((state) => ({ 
    currentTrip: state.currentTrip ? { ...state.currentTrip, status } : null 
  })),
  setDriverLocation: (location) => set({ driverLocation: location }),
  setEta: (eta) => set({ eta })
}));
