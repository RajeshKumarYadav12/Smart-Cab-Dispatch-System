import mongoose from 'mongoose';
import './Guest.js'; 
import './Driver.js'; 
import './User.js'; 

const tripSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['arrival', 'to_venue', 'return', 'departure', 'on_demand'],
    required: true
  },
  guestIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Guest' }],
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  origin: {
    label: String,
    geo: { lat: Number, lng: Number }
  },
  destination: {
    label: String,
    geo: { lat: Number, lng: Number }
  },
  scheduledWindow: {
    start: Date,
    end: Date
  },
  status: {
    type: String,
    enum: [
      'REQUESTED', 'PENDING_APPROVAL', 'PENDING_ASSIGNMENT', 'ASSIGNED', 
      'DRIVER_EN_ROUTE_TO_PICKUP', 'ARRIVED_AT_PICKUP', 
      'GUEST_ONBOARD', 'IN_PROGRESS', 'COMPLETED', 
      'CANCELLED', 'NO_SHOW'
    ],
    default: 'PENDING_ASSIGNMENT'
  },
  etaToPickup: Number, 
  etaToDestination: Number, 
  requestedAt: { type: Date, default: Date.now },
  assignedAt: Date,
  pickedUpAt: Date,
  completedAt: Date,
  isOnDemand: { type: Boolean, default: false },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancellationReason: String,
  rejectedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Driver' }]
}, { timestamps: true });

export const Trip = mongoose.model('Trip', tripSchema);
