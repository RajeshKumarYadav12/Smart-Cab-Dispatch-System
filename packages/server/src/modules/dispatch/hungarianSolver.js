import munkres from 'munkres-js';
import { calculateCost } from './costFunction.js';

export const solveBatchAssignment = (trips, drivers, distanceMatrix) => {
  
  const costMatrix = [];
  const breakdownMatrix = [];
  
  const now = Date.now();
  
  for (let i = 0; i < trips.length; i++) {
    const tripRow = [];
    const breakdownRow = [];
    
    const trip = trips[i];
    const waitTimeSeconds = Math.floor((now - new Date(trip.requestedAt).getTime()) / 1000);
    
    for (let j = 0; j < drivers.length; j++) {
      const driver = drivers[j];
      const idleTimeSeconds = driver.idleSince ? Math.floor((now - new Date(driver.idleSince).getTime()) / 1000) : 0;
      
      const etaData = distanceMatrix[j]?.[i];
      const etaSeconds = etaData?.duration?.value ?? 999999;

      const partySize = trip.guestIds.reduce((sum, g) => sum + g.partySize, 0) || 1;
      const luggage = trip.guestIds.reduce((sum, g) => sum + g.luggageCount, 0) || 0;
      
      if (driver.vehicle.seatCapacity < partySize || driver.vehicle.luggageCapacity < luggage || etaSeconds > 86400) {
        tripRow.push(999999); 
        breakdownRow.push(null);
      } else {
        const { totalCost, breakdown } = calculateCost(trip, driver, etaSeconds, waitTimeSeconds, idleTimeSeconds);
        tripRow.push(totalCost);
        breakdownRow.push(breakdown);
      }
    }
    costMatrix.push(tripRow);
    breakdownMatrix.push(breakdownRow);
  }

  const indices = munkres(costMatrix);

  const assignments = [];
  
  for (let i = 0; i < indices.length; i++) {
    const tripIndex = indices[i][0];
    const driverIndex = indices[i][1];
    const cost = costMatrix[tripIndex][driverIndex];

    if (cost < 999999) {
      assignments.push({
        trip: trips[tripIndex],
        driver: drivers[driverIndex],
        cost,
        breakdown: breakdownMatrix[tripIndex][driverIndex]
      });
    }
  }
  
  return assignments;
};
