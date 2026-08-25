const mongoose = require('mongoose');

const fraudRiskLogSchema = new mongoose.Schema({
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  waste: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Waste'
  },
  riskScore: {
    type: Number,
    required: true
  },
  flags: [{
    type: String
  }],
  details: {
    duplicateDetected: Boolean,
    priceAnomaly: Boolean,
    imageHash: String,
    sellerTransactionCount: Number
  },
  status: {
    type: String,
    enum: ['Low Risk', 'Medium Risk', 'High Risk', 'Flagged'],
    default: 'Low Risk'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FraudRiskLog', fraudRiskLogSchema);
