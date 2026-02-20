const express = require('express');
const router = express.Router();
const { indexVault, queryVault, getIndexStatus } = require('../lib/rag');

router.post('/rag/index', async (req, res) => {
  try {
    const batchSize = req.body.batchSize || 5;
    const result = await indexVault(batchSize);
    res.json(result);
  } catch (err) {
    console.error('Index error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/rag/chat', async (req, res) => {
  const { question } = req.body;
  if (!question || !question.trim()) {
    return res.status(400).json({ error: 'Question required' });
  }
  try {
    const result = await queryVault(question.trim());
    res.json(result);
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/rag/status', async (req, res) => {
  try {
    const status = await getIndexStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
