import mongoose from 'mongoose';

const venueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  geo: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  eventSchedule: [{
    phaseName: String,
    startTime: Date,
    endTime: Date
  }]
}, { timestamps: true });

export const Venue = mongoose.model('Venue', venueSchema);
