const mongoose = require('mongoose');

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
    enum: [
      'Plastic',
      'Metal',
      'Paper',
      'Glass',
      'Rubber',
      'Textile',
      'Wood',
      'E-Waste',
      'Organic Waste',
      'Chemical Waste',
      'Construction Waste',
      'Fly Ash',
      'Slag',
      'Industrial Sludge',
      'Oil Waste',
      'Packaging Waste',
      'Food Processing Waste',
      'Textile Waste',
      'Plastic Scrap',
      'Metal Scrap',
      'Spent Solvents',
      'Other Industrial Waste',
      'Other'
    ],
    default: 'Plastic Scrap'
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

buyerRequirementSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('BuyerRequirement', buyerRequirementSchema);
