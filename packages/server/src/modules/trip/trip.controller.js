import * as tripService from './trip.service.js';
import { Trip } from '../../models/Trip.js';

export const createTrip = async (req, res) => {
  try {
    const tripData = req.body;

    if (req.user && req.user.role === 'guest') {
      const { Guest } = await import('../../models/Guest.js');
      const guest = await Guest.findOne({ userId: req.user.id });
      if (guest) {
        tripData.guestIds = [guest._id];
      }
    }
    
    const trip = await tripService.createTrip(tripData);
    res.status(201).json(trip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getTrip = async (req, res) => {
  try {
    const trip = await tripService.getTripById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const listTrips = async (req, res) => {
  try {
    
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;
    
    const trips = await Trip.find(filter)
      .populate('guestIds driverId')
      .sort({ createdAt: -1 });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPersonalTrips = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    
    if (role === 'guest') {
      const { Guest } = await import('../../models/Guest.js');
      const guest = await Guest.findOne({ userId });
      if (!guest) return res.json([]);
      
      const trips = await Trip.find({ guestIds: guest._id })
        .populate({ path: 'driverId', populate: { path: 'userId' } })
        .sort({ 'scheduledWindow.start': 1 });
      return res.json(trips);
    }
    
    if (role === 'driver' || role === 'admin') {
      const { Driver } = await import('../../models/Driver.js');
      await import('../../models/Guest.js'); 
      
      const driver = await Driver.findOne({ userId });
      
      if (!driver) return res.json([]);
      
      const activeTrip = await Trip.findOne({ 
        driverId: driver._id, 
        status: { $nin: ['COMPLETED', 'CANCELLED'] } 
      }).populate({ path: 'guestIds', populate: { path: 'userId' } });
      
      return res.json(activeTrip ? [activeTrip] : []);
    }
    
    res.status(403).json({ message: 'Role not supported for personal trips' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { status, cancellationReason, driverId } = req.body;
    const { role, id: userId } = req.user;
    
    const updatedTrip = await tripService.updateTripStatus(
      req.params.id, 
      status, 
      userId, 
      role, 
      cancellationReason,
      driverId
    );
    
    res.json(updatedTrip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
