import mongoose from 'mongoose';

const accommodationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  geo: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  }
}, { timestamps: true });

export const Accommodation = mongoose.model('Accommodation', accommodationSchema);
