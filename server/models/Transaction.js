const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  exchangeId: {
    type: String,
    unique: true,
    sparse: true
  },
  orderId: {
    type: String,
    sparse: true
  },
  batchId: {
    type: String,
    sparse: true
  },
  waste: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Waste',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  unitPrice: {
    type: Number
  },
  wasteCost: {
    type: Number
  },
  totalPrice: {
    type: Number,
    required: true
  },
  pricingMode: {
    type: String,
    enum: ['fixed', 'auction'],
    default: 'fixed'
  },
  status: {
    type: String,
    enum: [
      'pending', 'requested', 'negotiation', 'accepted', 'approved', 
      'in_transit', 'delivered', 'received', 'processed', 'completed', 
      'cancelled', 'disputed',
      'order_placed', 'payment_confirmed', 'seller_accepted', 
      'waste_prepared', 'pickup_scheduled'
    ],
    default: 'order_placed'
  },
  orderStatus: {
    type: String,
    enum: [
      'Order Placed',
      'Payment Confirmed',
      'Seller Accepted',
      'Waste Prepared',
      'Pickup Scheduled',
      'In Transit',
      'Delivered',
      'Completed',
      'Cancelled',
      'Disputed'
    ],
    default: 'Order Placed'
  },
  statusHistory: [{
    status: { type: String, required: true },
    title: { type: String },
    note: { type: String },
    actor: { type: String },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedByName: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'initiated', 'confirmed', 'settlement_pending', 'settled', 'Pending', 'Paid', 'Failed', 'Refunded'],
    default: 'pending'
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  transactionId: {
    type: String
  },
  invoiceNumber: {
    type: String
  },
  paymentAmount: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    default: 'UPI'
  },
  distanceKm: {
    type: Number,
    default: 0
  },
  carbonSavedKg: {
    type: Number,
    default: 0
  },
  transportCost: {
    type: Number,
    default: 0
  },
  transportEmissionsKg: {
    type: Number,
    default: 0
  },
  completedAt: {
    type: Date
  },
  dispute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dispute'
  },
  weighment: {
    sellerDeclaredWeight: { type: Number, default: 0 },
    pickupWeight: { type: Number, default: 0 },
    receivedWeight: { type: Number, default: 0 },
    processedWeight: { type: Number, default: 0 },
    variancePercent: { type: Number, default: 0 },
    varianceStatus: { type: String, enum: ['Normal', 'Variance Alert', 'Discrepancy High'], default: 'Normal' },
    recordedAt: { type: Date }
  },
  logistics: {
    status: { type: String, enum: ['Scheduled', 'Picked Up', 'In Transit', 'Delivered'], default: 'Scheduled' },
    vehicleNumber: { type: String, default: 'TN-38-EX-8842' },
    driverName: { type: String, default: 'R. Soundararajan' },
    driverPhone: { type: String, default: '+91 98401 22345' },
    carrierName: { type: String, default: 'GreenFreight Express Logistics' },
    pickupScheduledAt: { type: Date },
    deliveredAt: { type: Date },
    currentLocation: {
      lat: { type: Number, default: 21.1702 },
      lng: { type: Number, default: 72.8311 },
      address: { type: String, default: 'National Highway 48 Corridor' }
    },
    distanceTravelledKm: { type: Number, default: 0 },
    remainingDistanceKm: { type: Number, default: 0 },
    etaHours: { type: Number, default: 4.5 }
  },
  documents: [{
    name: String,
    docType: { 
      type: String, 
      enum: [
        'Quality Report',
        'Material Quality Report',
        'Invoice',
        'Transport Document',
        'Weighment Slip',
        'Recycling Certificate',
        'Compliance Document',
        'Delivery Proof',
        'Other'
      ] 
    },
    url: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploaderName: String,
    uploadedAt: { type: Date, default: Date.now },
    version: { type: String, default: 'v1.0' },
    status: { type: String, enum: ['Pending', 'Uploaded', 'Under Review', 'Verified', 'Rejected', 'Expired'], default: 'Under Review' },
    verifiedBy: String,
    verifiedAt: Date,
    notes: String
  }],
  timeline: [{
    stage: String,
    title: String,
    description: String,
    timestamp: { type: Date, default: Date.now },
    locationName: String,
    actor: String
  }],
  ratings: {
    sellerRating: {
      materialQuality: { type: Number, min: 1, max: 5 },
      quantityAccuracy: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 },
      deliveryReliability: { type: Number, min: 1, max: 5 },
      overall: { type: Number, min: 1, max: 5 },
      comment: String,
      createdAt: Date
    },
    buyerRating: {
      paymentTimeliness: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 },
      overall: { type: Number, min: 1, max: 5 },
      comment: String,
      createdAt: Date
    }
  },
  sustainability: {
    wasteDivertedKg: { type: Number, default: 0 },
    carbonSavedKg: { type: Number, default: 0 },
    virginMaterialAvoidedKg: { type: Number, default: 0 }
  },
  isDemo: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

transactionSchema.index({ buyer: 1, createdAt: -1 });
transactionSchema.index({ seller: 1, createdAt: -1 });
transactionSchema.index({ orderStatus: 1 });
transactionSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
