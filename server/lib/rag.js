const File = require('../models/File');
const Embedding = require('../models/Embedding');
const { embedTexts, generateAnswer } = require('./gemini');
const { chunkMarkdown } = require('./chunker');

function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

async function indexVault(batchSize = 5) {
  const allFiles = await File.find({}, 'path content updatedAt').lean();

  const indexedFiles = await Embedding.aggregate([
    { $group: { _id: '$filePath', lastIndexed: { $max: '$updatedAt' } } }
  ]);
  const indexedMap = new Map(indexedFiles.map(f => [f._id, f.lastIndexed]));

  const filesToIndex = allFiles.filter(f => {
    const lastIndexed = indexedMap.get(f.path);
    return !lastIndexed || f.updatedAt > lastIndexed;
  });

  const batch = filesToIndex.slice(0, batchSize);
  let totalChunks = 0;

  for (const file of batch) {
    const chunks = chunkMarkdown(file.content || '', file.path);
    if (chunks.length === 0) continue;

    const texts = chunks.map(c => c.text);
    const embeddings = await embedTexts(texts);

    await Embedding.deleteMany({ filePath: file.path });

    const docs = chunks.map((chunk, i) => ({
      filePath: file.path,
      chunkIndex: chunk.chunkIndex,
      heading: chunk.heading,
      text: chunk.text,
      embedding: embeddings[i],
    }));
    await Embedding.insertMany(docs);
    totalChunks += docs.length;
  }

  return {
    indexed: batch.length,
    remaining: filesToIndex.length - batch.length,
    totalChunks,
    totalFiles: allFiles.length,
  };
}

async function queryVault(question) {
  const [questionEmbedding] = await embedTexts([question]);

  const allChunks = await Embedding.find({}, 'filePath heading text embedding').lean();

  if (allChunks.length === 0) {
    return {
      answer: 'Your vault has not been indexed yet. Click "Index Vault" to create embeddings for your files.',
      sources: [],
    };
  }

  const scored = allChunks.map(chunk => ({
    ...chunk,
    score: cosineSimilarity(questionEmbedding, chunk.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  const topChunks = scored.slice(0, 5);

  const answer = await generateAnswer(question, topChunks);

  const sourceMap = new Map();
  for (const chunk of topChunks) {
    if (!sourceMap.has(chunk.filePath)) {
      sourceMap.set(chunk.filePath, {
        filePath: chunk.filePath,
        heading: chunk.heading,
        score: chunk.score,
      });
    }
  }

  return {
    answer,
    sources: Array.from(sourceMap.values()),
  };
}

async function getIndexStatus() {
  const totalFiles = await File.countDocuments();
  const totalChunks = await Embedding.countDocuments();
  const indexedFilePaths = await Embedding.distinct('filePath');
  return {
    totalFiles,
    indexedFiles: indexedFilePaths.length,
    totalChunks,
  };
}

module.exports = { indexVault, queryVault, getIndexStatus };
