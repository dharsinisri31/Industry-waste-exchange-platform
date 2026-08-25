const mongoose = require('mongoose');

const carbonEmissionFactorSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    unique: true
  },
  recyclingSavingsFactorKgPerKg: {
    type: Number,
    required: true
  },
  landfillAvoidanceFactorKgPerKg: {
    type: Number,
    required: true
  },
  transportFactorKgPerKmTon: {
    type: Number,
    default: 0.12
  },
  unit: {
    type: String,
    default: 'kg CO2e / kg material'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CarbonEmissionFactor', carbonEmissionFactorSchema);
