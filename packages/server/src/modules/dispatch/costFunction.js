
const WEIGHTS = {
  w1: 1,      
  w2: -0.5,   
  w3: 10,     
  w4: -0.2,   
  w5: 2,      
  w6: -100    
};

export const calculateCost = (trip, vehicle, etaSeconds, waitTimeSeconds, idleTimeSeconds, detourAddedSeconds = 0, priorityScore = 0) => {
  const guestPartySize = trip.guestIds.reduce((sum, g) => sum + g.partySize, 0) || 1;
  const capacityWastage = vehicle.vehicle.seatCapacity - guestPartySize; 
  
  const cost = (WEIGHTS.w1 * etaSeconds) +
               (WEIGHTS.w2 * waitTimeSeconds) +
               (WEIGHTS.w3 * capacityWastage) +
               (WEIGHTS.w4 * idleTimeSeconds) +
               (WEIGHTS.w5 * detourAddedSeconds) +
               (WEIGHTS.w6 * priorityScore);
               
  return {
    totalCost: cost,
    breakdown: {
      eta: etaSeconds,
      waitTime: waitTimeSeconds,
      capacityWastage,
      idleTime: idleTimeSeconds,
      detourAdded: detourAddedSeconds,
      priority: priorityScore
    }
  };
};
