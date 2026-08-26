const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  disputeId: {
    type: String,
    unique: true,
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  waste: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Waste'
  },
  reason: {
    type: String,
    enum: [
      'Waste quality mismatch',
      'Incorrect waste type',
      'Quantity mismatch',
      'Contamination/mixed material',
      'Damaged material',
      'Seller issue',
      'Other'
    ],
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 3000
  },
  evidenceImages: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['Open', 'Under Review', 'Resolved', 'Rejected'],
    default: 'Open'
  },
  sellerResponse: {
    comment: String,
    respondedAt: Date,
    evidenceImages: [String]
  },
  adminResolution: {
    resolutionNote: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedByName: String,
    resolvedAt: Date,
    action: {
      type: String,
      enum: ['Resolved', 'Rejected']
    }
  },
  activityLog: [{
    actor: String,
    actorRole: String,
    action: String,
    comment: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

disputeSchema.index({ order: 1 });
disputeSchema.index({ buyer: 1, createdAt: -1 });
disputeSchema.index({ seller: 1, createdAt: -1 });
disputeSchema.index({ status: 1 });

module.exports = mongoose.model('Dispute', disputeSchema);
