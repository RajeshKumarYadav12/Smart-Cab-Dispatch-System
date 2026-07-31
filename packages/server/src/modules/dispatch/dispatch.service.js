import { Driver } from '../../models/Driver.js';
import { Trip } from '../../models/Trip.js';
import { AssignmentLog } from '../../models/AssignmentLog.js';
import { getDistanceMatrix } from '../../integrations/googleMaps/distanceMatrix.js';
import { filterCandidates } from './candidateFilter.js';
import { calculateCost } from './costFunction.js';
import { solveBatchAssignment } from './hungarianSolver.js';
import { clusterTrips } from './pooling.js';

export const runStreamingDispatch = async (tripId) => {
  console.log(`[Dispatch Engine] Running streaming dispatch for Trip ${tripId}`);
  
  const trip = await Trip.findById(tripId).populate('guestIds');
  if (!trip || trip.status !== 'PENDING_ASSIGNMENT') {
    console.log(`[Dispatch Engine] Trip ${tripId} is not pending assignment. Aborting.`);
    return null;
  }

  const allDrivers = await Driver.find({ 
    onDuty: true, 
    status: 'online_idle'
  });
  console.log(`[Dispatch Engine] Found ${allDrivers.length} on-duty drivers.`);
  
  if (allDrivers.length === 0) {
    console.log(`[Dispatch Engine] No on-duty drivers available.`);
    return null;
  }

  const activeTripIds = allDrivers.map(d => d.currentTripId).filter(Boolean);
  const activeTrips = await Trip.find({ _id: { $in: activeTripIds } }).populate('guestIds');
  const activeTripsMap = new Map();
  activeTrips.forEach(t => {
    if (t.driverId) activeTripsMap.set(t.driverId.toString(), t);
  });

  let candidates = filterCandidates(trip, allDrivers, activeTripsMap);
  console.log(`[Dispatch Engine] After filterCandidates, ${candidates.length} candidates remain.`);
  
  if (candidates.length === 0) {
    
    const guestPartySize = trip.guestIds.reduce((sum, g) => sum + g.partySize, 0) || 1;
    const maxFleetSeats = Math.max(...allDrivers.map(d => d.vehicle.seatCapacity));
    
    if (guestPartySize > maxFleetSeats && maxFleetSeats > 0 && trip.guestIds.length > 1) {
      console.log(`[Dispatch Engine] Trip ${tripId} exceeds max fleet capacity (${maxFleetSeats}). Splitting...`);
      
      const half = Math.ceil(trip.guestIds.length / 2);
      const split1Guests = trip.guestIds.slice(0, half);
      const split2Guests = trip.guestIds.slice(half);
      
      const trip1 = new Trip({
        ...trip.toObject(),
        _id: undefined,
        guestIds: split1Guests.map(g => g._id),
        status: 'PENDING_ASSIGNMENT',
        createdAt: new Date()
      });
      const trip2 = new Trip({
        ...trip.toObject(),
        _id: undefined,
        guestIds: split2Guests.map(g => g._id),
        status: 'PENDING_ASSIGNMENT',
        createdAt: new Date()
      });
      
      await Promise.all([trip1.save(), trip2.save()]);
      
      trip.status = 'CANCELLED';
      trip.cancellationReason = 'Split due to capacity limits';
      await trip.save();

      setImmediate(() => runStreamingDispatch(trip1._id));
      setImmediate(() => runStreamingDispatch(trip2._id));
      
      return null;
    }
    
    console.log(`[Dispatch Engine] No eligible drivers found for Trip ${tripId}. Needs manual intervention.`);
    return null;
  }

  const origins = candidates.map(d => ({ lat: d.currentLocation.lat, lng: d.currentLocation.lng }));
  const destination = [{ lat: trip.origin.geo.lat, lng: trip.origin.geo.lng }]; 
  
  const matrix = await getDistanceMatrix(origins, destination);

  let bestCandidate = null;
  let lowestCost = Infinity;
  let bestCostBreakdown = null;
  
  const now = Date.now();
  const waitTimeSeconds = Math.floor((now - new Date(trip.requestedAt).getTime()) / 1000);

  const priorityScore = (trip.guestIds.reduce((sum, g) => sum + g.partySize, 0) > 2) ? 10 : 0; 
  
  candidates.forEach((candidate, index) => {
    
    const etaData = matrix[index]?.[0];
    const etaSeconds = etaData?.duration?.value ?? 999999;
    
    if (etaSeconds > 86400) return;
    
    const idleTimeSeconds = candidate.idleSince ? Math.floor((now - new Date(candidate.idleSince).getTime()) / 1000) : 0;
    
    let detourAddedSeconds = 0;
    if (candidate.status !== 'online_idle') {
      const activeTrip = activeTripsMap.get(candidate._id.toString());
      if (activeTrip) {

        detourAddedSeconds = 300; 
      }
    }
    
    const { totalCost, breakdown } = calculateCost(trip, candidate, etaSeconds, waitTimeSeconds, idleTimeSeconds, detourAddedSeconds, priorityScore);
    
    if (totalCost < lowestCost) {
      lowestCost = totalCost;
      bestCandidate = candidate;
      bestCostBreakdown = breakdown;
    }
  });
  
  if (!bestCandidate) {
    console.log(`[Dispatch Engine] No driver within ETA threshold for Trip ${tripId}. Needs manual intervention.`);
    return null;
  }

  console.log(`[Dispatch Engine] Assigning Trip ${tripId} to Driver ${bestCandidate._id} (Cost: ${lowestCost})`);
  
  trip.driverId = bestCandidate._id;
  trip.status = 'ASSIGNED';
  trip.assignedAt = new Date();
  trip.etaToPickup = bestCostBreakdown.eta;
  await trip.save();
  
  bestCandidate.status = 'en_route_pickup';
  bestCandidate.currentTripId = trip._id;
  await bestCandidate.save();

  await AssignmentLog.create({
    tripId: trip._id,
    driverId: bestCandidate._id,
    costBreakdown: bestCostBreakdown,
    totalCost: lowestCost,
    algorithmVersion: 'v1-greedy-streaming'
  });
  
  import('../../sockets/socket.server.js').then(({ getIo }) => {
    try {
      const io = getIo();
      io.to(`trip:${trip._id}`).emit('trip:assigned', { tripId: trip._id, driverInfo: { id: bestCandidate._id, vehicle: bestCandidate.vehicle }, etaToPickup: bestCostBreakdown.eta });
    } catch (err) {}
  });
  
  return trip;
};

export const runBatchDispatch = async (waveId) => {
  console.log(`[Dispatch Engine] Running batch dispatch for Wave ${waveId}`);

  const trips = await Trip.find({ 
    status: 'PENDING_ASSIGNMENT', 
    $or: [
      { type: waveId, isOnDemand: false },
      { isOnDemand: true } 
    ]
  }).populate('guestIds');
  
  if (trips.length === 0) {
    console.log(`[Dispatch Engine] No pending trips for wave ${waveId}`);
    return;
  }

  const allDrivers = await Driver.find({ onDuty: true, status: 'online_idle' });
  if (allDrivers.length === 0) {
    console.log(`[Dispatch Engine] No drivers available for batch run.`);
    return;
  }

  const origins = allDrivers.map(d => ({ lat: d.currentLocation.lat, lng: d.currentLocation.lng }));
  const destinations = trips.map(t => ({ lat: t.origin.geo.lat, lng: t.origin.geo.lng }));
  
  const matrix = await getDistanceMatrix(origins, destinations);

  const assignments = solveBatchAssignment(trips, allDrivers, matrix);

  for (const assignment of assignments) {
    const { trip, driver, cost, breakdown } = assignment;
    
    trip.driverId = driver._id;
    trip.status = 'ASSIGNED';
    trip.assignedAt = new Date();
    trip.etaToPickup = breakdown.eta;
    await trip.save();
    
    driver.status = 'en_route_pickup';
    driver.currentTripId = trip._id;
    await driver.save();
    
    await AssignmentLog.create({
      tripId: trip._id,
      driverId: driver._id,
      waveId,
      costBreakdown: breakdown,
      totalCost: cost,
      algorithmVersion: 'v2-hungarian-batch'
    });
    
    console.log(`[Dispatch Engine - Batch] Assigned Trip ${trip._id} to Driver ${driver._id} (Cost: ${cost})`);
  }
  
  console.log(`[Dispatch Engine] Batch dispatch complete. Assigned ${assignments.length} trips.`);
};

export const reoptimizeActiveTrips = async () => {
  console.log(`[Dispatch Engine] Running continuous re-optimization...`);
  
  const activeTrips = await Trip.find({ status: 'ASSIGNED' });
  if (activeTrips.length === 0) return;

  const driverIds = activeTrips.map(t => t.driverId);
  const drivers = await Driver.find({ _id: { $in: driverIds } });
  
  const origins = drivers.map(d => ({ lat: d.currentLocation.lat, lng: d.currentLocation.lng }));
  const destinations = activeTrips.map(t => ({ lat: t.origin.geo.lat, lng: t.origin.geo.lng }));
  
  const matrix = await getDistanceMatrix(origins, destinations);
  
  const MAX_ACCEPTABLE_ETA_SECONDS = 1800; 
  
  for (let i = 0; i < activeTrips.length; i++) {
    const trip = activeTrips[i];
    const driver = drivers.find(d => d._id.toString() === trip.driverId.toString());
    if (!driver) continue;

    const etaSeconds = matrix[i]?.[i]?.duration?.value ?? 0;

    if (etaSeconds > MAX_ACCEPTABLE_ETA_SECONDS) {
      console.log(`[Dispatch Engine] Trip ${trip._id} ETA degraded to ${etaSeconds}s. Re-optimizing...`);
      trip.status = 'PENDING_ASSIGNMENT';
      trip.driverId = null;
      await trip.save();
      
      driver.status = 'online_idle';
      driver.currentTripId = null;
      await driver.save();
      
      setImmediate(() => runStreamingDispatch(trip._id));
    }
  }
};
