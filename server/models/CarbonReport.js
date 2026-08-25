const mongoose = require('mongoose');

const carbonReportSchema = new mongoose.Schema({
  industry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  totalCarbonSaved: {
    type: Number,
    default: 0
  },
  transportEmissions: {
    type: Number,
    default: 0
  },
  reuseEmissions: {
    type: Number,
    default: 0
  },
  netSavings: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CarbonReport', carbonReportSchema);
