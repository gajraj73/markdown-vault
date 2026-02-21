const { GoogleGenAI } = require('@google/genai');

let ai;
function getAI() {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set. Get a free key from https://aistudio.google.com/');
    }
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (err.status === 429 || (err.message && err.message.includes('429'))) {
        const delay = (i + 1) * 30000;
        console.log(`Rate limited, waiting ${delay / 1000}s before retry...`);
        await sleep(delay);
      } else {
        throw err;
      }
    }
  }
  throw new Error('Rate limit exceeded after retries. Please wait a minute and try again.');
}

async function embedTexts(texts) {
  const results = [];
  for (let i = 0; i < texts.length; i += 100) {
    const batch = texts.slice(i, i + 100);
    const response = await withRetry(() =>
      getAI().models.embedContent({
        model: 'gemini-embedding-001',
        contents: batch,
        config: { outputDimensionality: 768 },
      })
    );
    for (const emb of response.embeddings) {
      results.push(emb.values);
    }
  }
  return results;
}

async function generateAnswer(question, contextChunks) {
  const contextText = contextChunks
    .map((c, i) => `[Source ${i + 1}: ${c.filePath}]\n${c.text}`)
    .join('\n\n---\n\n');

  const prompt = `You are a helpful assistant that answers questions based on the user's personal markdown notes. Use ONLY the provided context to answer. If the context doesn't contain enough information, say so honestly.

Context from the user's vault:
${contextText}

Question: ${question}

Answer concisely. Reference which source files are relevant.`;

  const response = await withRetry(() =>
    getAI().models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
    })
  );

  return response.text;
}

async function structureTranscript(transcript) {
  const prompt = `You are a note-taking assistant. The user spoke the following brain dump aloud. Convert it into a well-structured markdown note.

Rules:
- Add a clear, descriptive title as an H1 heading
- Organize content with appropriate H2/H3 headings
- Use bullet points and numbered lists where appropriate
- Fix grammar and remove filler words (um, uh, like, you know)
- Keep the user's meaning and tone intact
- Do NOT add information the user didn't say
- Return ONLY the markdown, no explanation

Raw transcript:
${transcript}`;

  const response = await withRetry(() =>
    getAI().models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
    })
  );

  const content = response.text;
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch
    ? titleMatch[1].trim()
    : transcript.slice(0, 50).replace(/[^a-zA-Z0-9\s]/g, '').trim();

  return { title, content };
}

async function generateDiagram(text) {
  const prompt = `You are a diagram expert. Convert the following text into a Mermaid.js diagram.

Rules:
- Pick the BEST diagram type automatically (flowchart, sequenceDiagram, stateDiagram-v2, mindmap, pie, etc.)
- Use flowchart LR by default unless another type is clearly better
- Keep it clean and readable — don't overcomplicate
- Put all node labels and edge labels in double quotes
- Do NOT use emojis
- Return ONLY the Mermaid code, no explanation, no markdown fences

Text:
${text}`;

  const response = await withRetry(() =>
    getAI().models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
    })
  );

  // Strip accidental markdown fences if present
  let mermaid = response.text.trim();
  mermaid = mermaid.replace(/^```(?:mermaid)?\n?/i, '').replace(/\n?```$/i, '').trim();
  return mermaid;
}

module.exports = { embedTexts, generateAnswer, structureTranscript, generateDiagram };
