const mongoose = require('mongoose');

const timelineStepSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: [
      'Generated',
      'Listed',
      'AI Inspected',
      'Verified',
      'Matched',
      'Requested',
      'Purchased',
      'Collected',
      'In Transit',
      'Received',
      'Processed',
      'Recycled',
      'Converted to Resource',
      'Completed'
    ],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  locationName: String,
  coordinates: [Number],
  notes: String,
  updatedBy: String
});

const wasteJourneySchema = new mongoose.Schema({
  waste: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Waste',
    required: true
  },
  passportId: {
    type: String,
    required: true
  },
  currentStatus: {
    type: String,
    default: 'Listed'
  },
  timeline: [timelineStepSchema],
  handlerHistory: [{
    handlerName: String,
    role: String,
    timestamp: { type: Date, default: Date.now }
  }],
  qrCodeUrl: String
}, {
  timestamps: true
});

module.exports = mongoose.model('WasteJourney', wasteJourneySchema);
