const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  path: { type: String, required: true, unique: true, index: true },
  content: { type: String, default: '' },
  tags: { type: [String], default: [] },
  favorite: { type: Boolean, default: false },
  highlights: {
    type: [{
      id: String,
      text: String,
      color: String,
      occurrenceIndex: Number,
    }],
    default: [],
  },
  readingProgress: {
    scrollPercent: { type: Number, default: 0 },
    lastRead: { type: Date, default: null },
  },
  lastOpened: { type: Date, default: null },
}, { timestamps: true });

// Text index for search
fileSchema.index({ path: 'text', content: 'text' });

module.exports = mongoose.model('File', fileSchema);
