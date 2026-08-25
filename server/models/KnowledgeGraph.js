const mongoose = require('mongoose');

const knowledgeGraphSchema = new mongoose.Schema({
  sourceType: {
    type: String,
    enum: ['Industry', 'Waste', 'Material', 'Resource', 'Product'],
    required: true
  },
  sourceId: {
    type: String,
    required: true
  },
  sourceName: {
    type: String,
    required: true
  },
  relationship: {
    type: String,
    enum: ['produces', 'contains', 'can_be_used_by', 'demands', 'can_be_processed_into', 'can_become'],
    required: true
  },
  targetType: {
    type: String,
    enum: ['Industry', 'Waste', 'Material', 'Resource', 'Product'],
    required: true
  },
  targetId: {
    type: String,
    required: true
  },
  targetName: {
    type: String,
    required: true
  },
  weight: {
    type: Number,
    default: 1.0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('KnowledgeGraph', knowledgeGraphSchema);
