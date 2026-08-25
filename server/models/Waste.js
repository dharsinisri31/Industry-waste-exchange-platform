const mongoose = require('mongoose');

const wasteSchema = new mongoose.Schema({
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  batchId: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: [true, 'Waste name is required']
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
    default: 'Other Industrial Waste'
  },
  subCategory: {
    type: String,
    default: 'General Industrial'
  },
  industrialSource: {
    type: String,
    default: 'Manufacturing Facility'
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required']
  },
  unit: {
    type: String,
    default: 'kg'
  },
  address: {
    type: String,
    required: [true, 'Address is required']
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
  imageUrl: {
    type: String
  },
  documents: [{
    name: String,
    url: String,
    docType: String,
    status: { type: String, default: 'Under Review' },
    uploadedAt: { type: Date, default: Date.now }
  }],
  description: {
    type: String
  },
  price: {
    type: Number,
    required: [true, 'Price is required']
  },
  predictedPrice: {
    type: Number,
    default: 0
  },
  priceRange: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 }
  },
  pricingMode: {
    type: String,
    enum: ['fixed', 'auction'],
    default: 'fixed'
  },
  auctionInfo: {
    startingPrice: { type: Number, default: 0 },
    currentBid: { type: Number, default: 0 },
    highestBidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    minIncrement: { type: Number, default: 1 },
    reservePrice: { type: Number, default: 0 },
    auctionStart: { type: Date, default: Date.now },
    auctionEnd: { type: Date },
    status: { type: String, enum: ['upcoming', 'live', 'ending_soon', 'closed', 'cancelled'], default: 'live' },
    bids: [{
      bidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      bidderName: String,
      amount: Number,
      timestamp: { type: Date, default: Date.now }
    }]
  },
  status: {
    type: String,
    enum: ['available', 'active', 'pending', 'exchanged', 'in_transit', 'recycled', 'reserved', 'sold', 'rejected', 'flagged'],
    default: 'available'
  },
  hazardousStatus: {
    type: Boolean,
    default: false
  },
  storageRequirements: {
    type: String,
    default: 'Standard Industrial Storage'
  },
  handlingRequirements: {
    type: String,
    default: 'Standard PPE Required'
  },
  composition: {
    type: String,
    default: 'Mixed Industrial Stream'
  },
  moisture: {
    estimated: { type: Number, default: 2.0 },
    verified: { type: Number, default: null }
  },
  purity: {
    estimated: { type: Number, default: 90.0 },
    verified: { type: Number, default: null }
  },
  contamination: {
    percentage: { type: Number, default: 5.0 },
    types: [{ type: String }]
  },
  qualityGrade: {
    type: String,
    enum: ['Grade A', 'Grade B', 'Grade C', 'Grade D', 'Pending'],
    default: 'Grade B'
  },
  damageScore: {
    type: Number,
    default: 0.0
  },
  recyclabilityScore: {
    type: Number,
    default: 85.0
  },
  recoveryYield: {
    type: Number,
    default: 88.0
  },
  aiConfidence: {
    type: Number,
    default: 0.88
  },
  circularityScore: {
    type: Number,
    default: 88
  },
  circularityExplanation: {
    type: String,
    default: 'High material recovery yield and low transport emissions'
  },
  anomalyInfo: {
    isAnomaly: { type: Boolean, default: false },
    status: { type: String, enum: ['Normal', 'Flagged for Review', 'High Risk'], default: 'Normal' },
    reasons: [{ type: String }]
  },
  complianceInfo: {
    status: { type: String, default: 'Verified Standard' },
    reason: { type: String, default: 'Standard industrial waste stream manifest applies.' },
    sources: [{ type: String }]
  },
  verificationStatus: {
    type: String,
    enum: ['AI Estimated', 'Lab Verified', 'Pending Verification'],
    default: 'AI Estimated'
  },
  passportId: {
    type: String,
    default: null
  },
  isDemo: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

wasteSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Waste', wasteSchema);
