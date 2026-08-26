const mongoose = require('mongoose');
const { CANONICAL_CATEGORIES, normalizeCategory } = require('../constants/categories');

const buyerRequirementSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Industry'
  },
  material: {
    type: String,
    required: [true, 'Material name is required']
  },
  category: {
    type: String,
    enum: CANONICAL_CATEGORIES,
    default: 'Plastic / Polymers'
  },
  quantity: {
    type: Number,
    required: [true, 'Required quantity is required']
  },
  unit: {
    type: String,
    default: 'kg'
  },
  minPurity: {
    type: Number,
    default: 90.0
  },
  maxPrice: {
    type: Number,
    required: [true, 'Maximum acceptable price is required']
  },
  frequency: {
    type: String,
    enum: ['One-time', 'Weekly', 'Monthly', 'Quarterly'],
    default: 'Monthly'
  },
  address: {
    type: String,
    required: [true, 'Delivery location address is required']
  },
  city: {
    type: String,
    required: [true, 'City is required']
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
  radiusKm: {
    type: Number,
    default: 150
  },
  requiredDate: {
    type: Date,
    default: Date.now
  },
  application: {
    type: String,
    default: 'Secondary raw material procurement for industrial production.'
  },
  specifications: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'closed', 'fulfilled'],
    default: 'active'
  }
}, {
  timestamps: true
});

buyerRequirementSchema.pre('validate', function() {
  if (this.category || this.material) {
    this.category = normalizeCategory(this.category, this.material);
  }
});

buyerRequirementSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('BuyerRequirement', buyerRequirementSchema);
