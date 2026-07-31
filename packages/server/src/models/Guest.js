import mongoose from 'mongoose';

const guestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  partySize: { type: Number, required: true, default: 1 },
  luggageCount: { type: Number, required: true, default: 0 },
  accommodationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Accommodation' },
  arrival: {
    mode: { type: String, enum: ['flight', 'train'] },
    code: String,
    scheduledTime: Date,
    terminal: String,
    actualTime: Date
  },
  departure: {
    mode: { type: String, enum: ['flight', 'train'] },
    code: String,
    scheduledTime: Date,
    actualTime: Date
  },
  currentTripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  status: { 
    type: String, 
    enum: ['awaiting_arrival', 'checked_in', 'at_venue', 'awaiting_departure', 'departed'],
    default: 'awaiting_arrival'
  }
}, { timestamps: true });

export const Guest = mongoose.model('Guest', guestSchema);
