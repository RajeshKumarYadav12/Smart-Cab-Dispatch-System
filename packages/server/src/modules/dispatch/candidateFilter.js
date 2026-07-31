export const filterCandidates = (trip, drivers, activeTripsMap = new Map(), maxEtaSeconds = 1200) => {
  
  return drivers.filter(driver => {
    
    if (trip.rejectedBy && trip.rejectedBy.some(id => id.toString() === driver._id.toString())) return false;

    if (!driver.onDuty || driver.status === 'offline') return false;

    if (driver.lastTripCompletedAt) {
      const minsSinceLastTrip = (Date.now() - new Date(driver.lastTripCompletedAt).getTime()) / 60000;
      if (minsSinceLastTrip < 30) return false;
    }

    const guestPartySize = trip.guestIds.reduce((sum, g) => sum + (g.partySize || 1), 0);
    const guestLuggageCount = trip.guestIds.reduce((sum, g) => sum + (g.luggageCount || 0), 0);
    
    let currentPassengers = 0;
    let currentLuggage = 0;
    
    const activeTrip = activeTripsMap.get(driver._id.toString());
    if (activeTrip && activeTrip.guestIds) {
      currentPassengers = activeTrip.guestIds.reduce((sum, g) => sum + (g.partySize || 1), 0);
      currentLuggage = activeTrip.guestIds.reduce((sum, g) => sum + (g.luggageCount || 0), 0);
    }
    
    if (driver.vehicle.seatCapacity < (currentPassengers + guestPartySize)) return false;
    if (driver.vehicle.luggageCapacity < (currentLuggage + guestLuggageCount)) return false;
    
    return true;
  });
};
