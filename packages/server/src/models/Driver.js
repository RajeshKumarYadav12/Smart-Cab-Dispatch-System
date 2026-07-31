import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicle: {
    plateNumber: { type: String, required: true },
    seatCapacity: { type: Number, required: true },
    luggageCapacity: { type: Number, required: true },
    type: { type: String }
  },
  onDuty: { type: Boolean, default: false },
  currentLocation: {
    lat: Number,
    lng: Number,
    updatedAt: Date
  },
  currentTripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  idleSince: { type: Date },
  lastTripCompletedAt: { type: Date },
  status: { 
    type: String, 
    enum: ['offline', 'online_idle', 'en_route_pickup', 'on_trip'],
    default: 'offline'
  }
}, { timestamps: true });

export const Driver = mongoose.model('Driver', driverSchema);
