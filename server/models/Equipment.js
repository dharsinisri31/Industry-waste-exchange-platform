const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Equipment title is required']
  },
  equipmentType: {
    type: String,
    enum: [
      'Hydraulic Press',
      'Dual-Shaft Shredder',
      'Extruder & Pelletizer',
      'Ball Mill',
      'Pyrolysis Reactor',
      'Solvent Distillation Unit',
      'Other'
    ],
    default: 'Other'
  },
  description: {
    type: String
  },
  hourlyRate: {
    type: Number,
    required: [true, 'Hourly rate is required']
  },
  dailyRate: {
    type: Number,
    required: [true, 'Daily rate is required']
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true
    }
  },
  status: {
    type: String,
    enum: ['available', 'rented', 'maintenance'],
    default: 'available'
  },
  imageUrl: {
    type: String
  }
}, {
  timestamps: true
});

equipmentSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Equipment', equipmentSchema);
