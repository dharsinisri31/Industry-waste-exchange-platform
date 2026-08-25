const mongoose = require('mongoose');

const carbonSavingsSchema = new mongoose.Schema({
  industryUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  totalCarbonSavedKg: {
    type: Number,
    default: 0
  },
  transportEmissionsKg: {
    type: Number,
    default: 0
  },
  netSavingsKg: {
    type: Number,
    default: 0
  },
  greenCredits: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CarbonSavings', carbonSavingsSchema);
