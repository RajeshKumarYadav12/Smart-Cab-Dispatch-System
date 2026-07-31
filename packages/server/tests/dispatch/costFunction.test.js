import { describe, it, expect } from 'vitest';
import { calculateCost } from '../../src/modules/dispatch/costFunction.js';

describe('Cost Function', () => {
  const mockTrip = {
    guestIds: [{ partySize: 2, luggageCount: 2 }]
  };

  it('should calculate cost correctly based on weights', () => {
    const vehicle = { vehicle: { seatCapacity: 4 } };
    const etaSeconds = 600; 
    const waitTimeSeconds = 300; 
    const idleTimeSeconds = 1200; 

    const { totalCost, breakdown } = calculateCost(mockTrip, vehicle, etaSeconds, waitTimeSeconds, idleTimeSeconds);

    expect(totalCost).toBe(230);
    expect(breakdown.capacityWastage).toBe(2);
    expect(breakdown.eta).toBe(600);
    expect(breakdown.waitTime).toBe(300);
    expect(breakdown.idleTime).toBe(1200);
  });

  it('should penalize higher capacity wastage', () => {
    const vehicle4 = { vehicle: { seatCapacity: 4 } };
    const vehicle6 = { vehicle: { seatCapacity: 6 } };
    
    const cost4 = calculateCost(mockTrip, vehicle4, 600, 300, 0).totalCost;
    const cost6 = calculateCost(mockTrip, vehicle6, 600, 300, 0).totalCost;
    
    expect(cost6).toBeGreaterThan(cost4);
  });
});
