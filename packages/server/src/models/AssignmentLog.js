import mongoose from 'mongoose';

const assignmentLogSchema = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  waveId: { type: String },
  costBreakdown: {
    eta: Number,
    waitTime: Number,
    capacityWastage: Number,
    idleTime: Number
  },
  totalCost: { type: Number, required: true },
  algorithmVersion: { type: String, required: true }
}, { timestamps: true });

export const AssignmentLog = mongoose.model('AssignmentLog', assignmentLogSchema);
