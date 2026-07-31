import { describe, it, expect } from 'vitest';
import { filterCandidates } from '../../src/modules/dispatch/candidateFilter.js';

describe('Candidate Filter', () => {
  const mockTrip = {
    guestIds: [{ partySize: 2, luggageCount: 2 }]
  };

  it('should filter out offline drivers', () => {
    const drivers = [
      { _id: 'd1', onDuty: false, status: 'offline', vehicle: { seatCapacity: 4, luggageCapacity: 4 } }
    ];
    const eligible = filterCandidates(mockTrip, drivers);
    expect(eligible.length).toBe(0);
  });

  it('should include busy drivers if they have capacity', () => {
    const drivers = [
      { _id: 'd1', onDuty: true, status: 'en_route_pickup', vehicle: { seatCapacity: 4, luggageCapacity: 4 } }
    ];
    // No active trips in map, so currentPassengers = 0
    const eligible = filterCandidates(mockTrip, drivers, new Map());
    expect(eligible.length).toBe(1);
  });

  it('should filter out busy drivers if they lack capacity', () => {
    const drivers = [
      { _id: 'd1', onDuty: true, status: 'en_route_pickup', vehicle: { seatCapacity: 4, luggageCapacity: 4 } }
    ];
    const activeTripsMap = new Map();
    activeTripsMap.set('d1', { guestIds: [{ partySize: 3, luggageCount: 3 }] }); // Leaves 1 seat, trip needs 2

    const eligible = filterCandidates(mockTrip, drivers, activeTripsMap);
    expect(eligible.length).toBe(0);
  });

  it('should filter out drivers without enough seat capacity', () => {
    const drivers = [
      { _id: 'd1', onDuty: true, status: 'online_idle', vehicle: { seatCapacity: 1, luggageCapacity: 4 } }
    ];
    const eligible = filterCandidates(mockTrip, drivers);
    expect(eligible.length).toBe(0);
  });

  it('should filter out drivers without enough luggage capacity', () => {
    const drivers = [
      { _id: 'd1', onDuty: true, status: 'online_idle', vehicle: { seatCapacity: 4, luggageCapacity: 1 } }
    ];
    const eligible = filterCandidates(mockTrip, drivers);
    expect(eligible.length).toBe(0);
  });

  it('should include eligible drivers', () => {
    const drivers = [
      { _id: 'd1', onDuty: true, status: 'online_idle', vehicle: { seatCapacity: 4, luggageCapacity: 4 } }
    ];
    const eligible = filterCandidates(mockTrip, drivers);
    expect(eligible.length).toBe(1);
  });

  it('should filter out resting drivers (30 min cooldown)', () => {
    const drivers = [
      { 
        _id: 'd1', 
        onDuty: true, 
        status: 'online_idle', 
        lastTripCompletedAt: new Date(Date.now() - (15 * 60000)), // 15 mins ago
        vehicle: { seatCapacity: 4, luggageCapacity: 4 } 
      }
    ];
    const eligible = filterCandidates(mockTrip, drivers);
    expect(eligible.length).toBe(0);
  });
});
