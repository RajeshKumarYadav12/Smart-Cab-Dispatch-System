import { Driver } from '../../models/Driver.js';
import { User } from '../../models/User.js';
import bcrypt from 'bcrypt';

export const onboardDriver = async (req, res) => {
  try {
    const { name, email, phone, vehicleNumber, seatCapacity, luggageCapacity, vehicleType } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const defaultPassword = 'driver' + Math.floor(Math.random() * 10000);
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const user = new User({
      name,
      email,
      phone,
      passwordHash,
      role: 'driver'
    });
    
    await user.save();

    const driver = new Driver({
      userId: user._id,
      vehicle: {
        plateNumber: vehicleNumber,
        seatCapacity: seatCapacity || 4,
        luggageCapacity: luggageCapacity || 2,
        type: vehicleType || 'Sedan'
      },
      currentLocation: { lat: 12.9716, lng: 77.5946, updatedAt: new Date() } 
    });
    
    await driver.save();
    
    res.status(201).json({ message: 'Driver onboarded successfully', driver, defaultPassword });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const listDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find().populate('userId', 'name phone email role');
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { onDuty } = req.body;
    const { id: userId } = req.user;
    
    const driver = await Driver.findOne({ userId });
    if (!driver) return res.status(404).json({ message: 'Driver profile not found' });
    
    driver.onDuty = onDuty;
    if (onDuty) {
      driver.status = 'online_idle';
      driver.idleSince = new Date();
    } else {
      driver.status = 'offline';
      driver.idleSince = null;
    }
    
    await driver.save();

    if (onDuty) {
      import('../../models/Trip.js').then(({ Trip }) => {
        Trip.find({ status: 'PENDING_ASSIGNMENT', isOnDemand: true })
          .then(pendingTrips => {
            if (pendingTrips.length > 0) {
              import('../dispatch/dispatch.service.js').then(({ runStreamingDispatch }) => {
                pendingTrips.forEach(trip => {
                  console.log(`[Driver Controller] Driver ${driver._id} went online. Re-running dispatch for Trip ${trip._id}`);
                  runStreamingDispatch(trip._id).catch(console.error);
                });
              });
            }
          })
          .catch(console.error);
      });
    }

    res.json({ onDuty: driver.onDuty, status: driver.status });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStatus = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const driver = await Driver.findOne({ userId }).populate('userId', 'name email role');
    if (!driver) return res.status(404).json({ message: 'Driver profile not found' });
    
    res.json({ 
      onDuty: driver.onDuty, 
      status: driver.status, 
      currentLocation: driver.currentLocation,
      userId: driver.userId,
      vehicle: driver.vehicle
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
