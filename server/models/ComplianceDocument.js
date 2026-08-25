const mongoose = require('mongoose');

const complianceDocumentSchema = new mongoose.Schema({
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  waste: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Waste'
  },
  docType: {
    type: String,
    enum: ['Lab Report', 'Material Certificate', 'Quality Certificate', 'Waste Manifest', 'Other'],
    default: 'Lab Report'
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  extractedData: {
    material: String,
    composition: String,
    purity: Number,
    quantity: Number,
    certificateNumber: String,
    issueDate: String,
    company: String,
    testResults: String
  },
  ocrConfidence: {
    type: Number,
    default: 0.85
  },
  verificationStatus: {
    type: String,
    enum: ['Verified', 'Pending', 'Flagged'],
    default: 'Verified'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ComplianceDocument', complianceDocumentSchema);
