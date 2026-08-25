const mongoose = require('mongoose');

const wasteResourcePassportSchema = new mongoose.Schema({
  passportId: {
    type: String,
    required: true,
    unique: true
  },
  waste: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Waste',
    required: true
  },
  qrCodeUrl: {
    type: String
  },
  qrCodeData: {
    type: String,
    required: true
  },
  material: {
    type: String,
    required: true
  },
  subMaterial: {
    type: String,
    default: 'General'
  },
  sourceIndustry: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    default: 'kg'
  },
  purity: {
    type: Number,
    default: 90.0
  },
  contamination: {
    type: Number,
    default: 5.0
  },
  qualityGrade: {
    type: String,
    default: 'Grade B'
  },
  damageScore: {
    type: Number,
    default: 0.0
  },
  moisture: {
    type: Number,
    default: 2.0
  },
  recyclability: {
    type: Number,
    default: 85.0
  },
  recoveryYield: {
    type: Number,
    default: 88.0
  },
  estimatedValue: {
    type: Number,
    default: 0
  },
  predictedPrice: {
    type: Number,
    default: 0
  },
  recommendedProcessing: {
    type: String,
    default: 'Mechanical Shredding & Washing'
  },
  recommendedBuyers: [{
    companyName: String,
    score: Number,
    reason: String
  }],
  carbonSavingKg: {
    type: Number,
    default: 0
  },
  currentStatus: {
    type: String,
    default: 'Generated'
  },
  aiConfidence: {
    type: Number,
    default: 0.90
  },
  verificationStatus: {
    type: String,
    enum: ['AI Estimated', 'Lab Verified', 'Pending Verification'],
    default: 'AI Estimated'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('WasteResourcePassport', wasteResourcePassportSchema);
