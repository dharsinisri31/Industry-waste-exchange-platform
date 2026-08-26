const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    unique: true,
    required: true
  },
  transactionId: {
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
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  breakdown: {
    wasteCost: { type: Number, default: 0 },
    transportCost: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 }
  },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'Credit/Debit Card', 'Net Banking'],
    default: 'UPI'
  },
  paymentMethodDetails: {
    upiId: String,
    cardLast4: String,
    cardBrand: String,
    bankName: String
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  isSimulated: {
    type: Boolean,
    default: true
  },
  simulationNotes: {
    type: String,
    default: 'EcoLink Industrial Escrow Simulated Transaction'
  },
  paidAt: {
    type: Date
  },
  failureReason: {
    type: String
  }
}, {
  timestamps: true
});

paymentSchema.index({ buyer: 1, createdAt: -1 });
paymentSchema.index({ seller: 1, createdAt: -1 });
paymentSchema.index({ order: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
