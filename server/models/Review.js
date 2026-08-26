const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },
  waste: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Waste'
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewerRole: {
    type: String,
    enum: ['buyer', 'seller'],
    required: true
  },
  overallRating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  wasteQualityRating: {
    type: Number,
    min: 1,
    max: 5
  },
  sellerCommunicationRating: {
    type: Number,
    min: 1,
    max: 5
  },
  deliveryExperienceRating: {
    type: Number,
    min: 1,
    max: 5
  },
  buyerCommunicationRating: {
    type: Number,
    min: 1,
    max: 5
  },
  transactionExperienceRating: {
    type: Number,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  reviewerName: {
    type: String
  },
  reviewerCompany: {
    type: String
  }
}, {
  timestamps: true
});

// Prevent duplicate review for the same order by the same reviewer
reviewSchema.index({ order: 1, reviewer: 1 }, { unique: true });
reviewSchema.index({ reviewee: 1, createdAt: -1 });
reviewSchema.index({ waste: 1 });

module.exports = mongoose.model('Review', reviewSchema);
