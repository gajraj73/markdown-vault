const express = require('express');
const router = express.Router();
const { structureTranscript } = require('../lib/gemini');
const { findRelatedNotes } = require('../lib/rag');

router.post('/voice/structure', async (req, res) => {
  const { transcript } = req.body;
  if (!transcript || !transcript.trim()) {
    return res.status(400).json({ error: 'Transcript required' });
  }
  try {
    const [structured, relatedNotes] = await Promise.all([
      structureTranscript(transcript.trim()),
      findRelatedNotes(transcript.trim()),
    ]);
    res.json({
      title: structured.title,
      content: structured.content,
      relatedNotes,
    });
  } catch (err) {
    console.error('Voice structure error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
