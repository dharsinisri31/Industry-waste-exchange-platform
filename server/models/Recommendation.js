const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  waste: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Waste',
    required: true
  },
  recommendedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  matchBreakdown: {
    semantic_similarity: Number,
    composition_match: Number,
    quantity_fit: Number,
    distance_km: Number,
    distance_score: Number,
    historical_trust_score: Number
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Recommendation', recommendationSchema);
