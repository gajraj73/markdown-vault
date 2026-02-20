const mongoose = require('mongoose');

const embeddingSchema = new mongoose.Schema({
  filePath: { type: String, required: true, index: true },
  chunkIndex: { type: Number, required: true },
  heading: { type: String, default: '' },
  text: { type: String, required: true },
  embedding: { type: [Number], required: true },
}, { timestamps: true });

embeddingSchema.index({ filePath: 1, chunkIndex: 1 }, { unique: true });

module.exports = mongoose.model('Embedding', embeddingSchema);
