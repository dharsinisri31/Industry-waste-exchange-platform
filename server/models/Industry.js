const mongoose = require('mongoose');

const industrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  businessRole: {
    type: String,
    enum: ['sender', 'receiver', 'both'],
    default: 'sender'
  },
  roles: {
    type: [String],
    enum: ['buyer', 'seller'],
    default: ['seller']
  },
  industryType: {
    type: String,
    required: true
  },
  registrationNumber: {
    type: String,
    required: true
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
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  description: {
    type: String
  },
  contactPhone: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'suspended', 'Pending', 'Verified', 'Rejected', 'Suspended'],
    default: 'pending'
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'suspended', 'Pending', 'Verified', 'Rejected', 'Suspended'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  trustMetrics: {
    overallRating: { type: Number, default: 4.8 },
    totalRatingsCount: { type: Number, default: 12 },
    completedExchangesCount: { type: Number, default: 18 },
    onTimeDeliveryRate: { type: Number, default: 98 },
    quantityAccuracyRate: { type: Number, default: 96 },
    verifiedBadge: { type: Boolean, default: true }
  },
  isDemo: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

industrySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Industry', industrySchema);
