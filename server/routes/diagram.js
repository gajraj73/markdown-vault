const express = require('express');
const router = express.Router();
const { generateDiagram } = require('../lib/gemini');

router.post('/diagram/generate', async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Text required' });
  }
  try {
    const mermaid = await generateDiagram(text.trim());
    res.json({ mermaid });
  } catch (err) {
    console.error('Diagram generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
