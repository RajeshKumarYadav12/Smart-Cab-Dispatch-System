import { Trip } from '../../models/Trip.js';
import { Driver } from '../../models/Driver.js';

export const VALID_TRANSITIONS = {
  REQUESTED: ['PENDING_ASSIGNMENT', 'CANCELLED'],
  PENDING_APPROVAL: ['PENDING_ASSIGNMENT', 'CANCELLED'],
  PENDING_ASSIGNMENT: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['DRIVER_EN_ROUTE_TO_PICKUP', 'PENDING_ASSIGNMENT', 'PENDING_APPROVAL', 'CANCELLED'],
  DRIVER_EN_ROUTE_TO_PICKUP: ['ARRIVED_AT_PICKUP', 'CANCELLED'],
  ARRIVED_AT_PICKUP: ['GUEST_ONBOARD', 'CANCELLED', 'NO_SHOW'],
  GUEST_ONBOARD: ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: []
};

export const createTrip = async (tripData) => {
  const trip = new Trip(tripData);
  return await trip.save();
};

export const getTripById = async (id) => {
  return await Trip.findById(id)
    .populate('guestIds')
    .populate({ path: 'driverId', populate: { path: 'userId' } });
};

export const updateTripStatus = async (id, newStatus, userId, role, cancellationReason = '', forceDriverId = null) => {
  const trip = await Trip.findById(id);
  if (!trip) throw new Error('Trip not found');

  const currentStatus = trip.status;
  const allowedNext = VALID_TRANSITIONS[currentStatus];

  if (!allowedNext || !allowedNext.includes(newStatus)) {
    if (role !== 'admin') {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  trip.status = newStatus;
  
  if (newStatus === 'CANCELLED') {
    trip.cancellationReason = cancellationReason;
  }
  
  let previousDriverId = null;
  if ((newStatus === 'PENDING_ASSIGNMENT' || newStatus === 'PENDING_APPROVAL') && currentStatus === 'ASSIGNED') {
    if (trip.driverId) {
      trip.rejectedBy.push(trip.driverId);
      previousDriverId = trip.driverId;
    }
    trip.driverId = undefined;
    trip.assignedAt = undefined;
  }
  
  if (newStatus === 'ASSIGNED') {
    trip.assignedAt = new Date();
    if (forceDriverId) trip.driverId = forceDriverId;
  }
  if (newStatus === 'GUEST_ONBOARD') trip.pickedUpAt = new Date();
  if (newStatus === 'COMPLETED') trip.completedAt = new Date();

  await trip.save();

  if (['COMPLETED', 'CANCELLED', 'NO_SHOW', 'PENDING_ASSIGNMENT', 'PENDING_APPROVAL'].includes(newStatus)) {
    const targetDriverId = (newStatus === 'PENDING_ASSIGNMENT' || newStatus === 'PENDING_APPROVAL') ? previousDriverId : trip.driverId;
    if (targetDriverId) {
      const updateData = {
        status: 'online_idle',
        $unset: { currentTripId: "" },
        idleSince: new Date()
      };
      if (newStatus === 'COMPLETED') {
        updateData.lastTripCompletedAt = new Date();
      }
      await Driver.findByIdAndUpdate(targetDriverId, updateData);
    }
  } else if (trip.driverId) {
    
    let driverStatus = 'online_idle';
    if (['ASSIGNED', 'DRIVER_EN_ROUTE_TO_PICKUP'].includes(newStatus)) driverStatus = 'en_route_pickup';
    else if (['ARRIVED_AT_PICKUP'].includes(newStatus)) driverStatus = 'arrived_pickup';
    else if (['GUEST_ONBOARD', 'IN_PROGRESS'].includes(newStatus)) driverStatus = 'en_route_dropoff';
    
    await Driver.findByIdAndUpdate(trip.driverId, {
      status: driverStatus,
      currentTripId: trip._id
    });
  }

  import('../../sockets/socket.server.js').then(({ getIo }) => {
    try {
      const io = getIo();
      io.to(`trip:${trip._id}`).emit('trip:status:changed', { tripId: trip._id, status: newStatus });
      io.to(`role:admin`).emit('trip:status:changed', { tripId: trip._id, status: newStatus });
    } catch (err) {
      console.error('Failed to emit socket event:', err.message);
    }
  });

  if (newStatus === 'PENDING_ASSIGNMENT' && trip.isOnDemand) {
    import('../dispatch/dispatch.service.js').then(({ runStreamingDispatch }) => {
      runStreamingDispatch(trip._id).catch(err => console.error('Dispatch failed', err));
    });
  }
  
  return trip;
};

