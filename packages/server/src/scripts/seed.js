import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Guest } from '../models/Guest.js';
import { Driver } from '../models/Driver.js';
import { Accommodation } from '../models/Accommodation.js';
import { Venue } from '../models/Venue.js';

const seedData = async () => {
  await connectDB();

  console.log('Clearing database...');
  await User.deleteMany({});
  await Guest.deleteMany({});
  await Driver.deleteMany({});
  await Accommodation.deleteMany({});
  await Venue.deleteMany({});

  console.log('Seeding accommodations and venues...');
  const accommodation = await Accommodation.create({
    name: 'Grand Hotel',
    address: '123 Grand Ave, City Center',
    geo: { lat: 40.7128, lng: -74.0060 }
  });

  const venue = await Venue.create({
    name: 'Main Conference Center',
    address: '456 Event Sq, City Center',
    geo: { lat: 40.7150, lng: -74.0100 },
    eventSchedule: [{
      phaseName: 'Opening Keynote',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), 
      endTime: new Date(Date.now() + 26 * 60 * 60 * 1000)
    }]
  });

  const passwordHash = await bcrypt.hash('password123', 10);

  console.log('Seeding users...');

  await User.create({
    name: 'Admin User',
    phone: '1234567890',
    email: 'admin@dispatch.com',
    role: 'admin',
    passwordHash
  });

  const driverUser = await User.create({
    name: 'Test Driver',
    phone: '2345678901',
    email: 'driver@dispatch.com',
    role: 'driver',
    passwordHash
  });

  await Driver.create({
    userId: driverUser._id,
    vehicle: {
      plateNumber: 'ABC-123',
      seatCapacity: 4,
      luggageCapacity: 4,
      type: 'Sedan'
    },
    onDuty: false,
    status: 'offline'
  });

  const guestUser = await User.create({
    name: 'Test Guest',
    phone: '3456789012',
    email: 'guest@dispatch.com',
    role: 'guest',
    passwordHash
  });

  const guestRecord = await Guest.create({
    userId: guestUser._id,
    partySize: 2,
    luggageCount: 2,
    accommodationId: accommodation._id,
    status: 'awaiting_arrival'
  });

  console.log('Seeding initial trip...');
  const { Trip } = await import('../models/Trip.js');
  await Trip.deleteMany({});
  await Trip.create({
    type: 'to_venue',
    status: 'PENDING_ASSIGNMENT',
    origin: {
      label: accommodation.name,
      geo: accommodation.geo
    },
    destination: {
      label: venue.name,
      geo: venue.geo
    },
    guestIds: [guestRecord._id],
    scheduledWindow: {
      start: new Date(Date.now() + 30 * 60 * 1000) 
    }
  });

  console.log('Database seeded successfully!');
  process.exit(0);
};

seedData().catch((err) => {
  console.error(err);
  process.exit(1);
});
