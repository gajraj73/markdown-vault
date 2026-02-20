const MAX_CHUNK_SIZE = 1000;
const MIN_CHUNK_SIZE = 100;

function chunkMarkdown(content, filePath) {
  const chunks = [];
  const sections = splitByHeadings(content);

  let chunkIndex = 0;
  for (const section of sections) {
    if (section.text.length <= MAX_CHUNK_SIZE) {
      if (section.text.trim().length >= MIN_CHUNK_SIZE) {
        chunks.push({
          text: section.text.trim(),
          heading: section.heading,
          chunkIndex: chunkIndex++,
        });
      }
    } else {
      const subChunks = splitByParagraphs(section.text);
      for (const sub of subChunks) {
        if (sub.trim().length >= MIN_CHUNK_SIZE) {
          chunks.push({
            text: sub.trim(),
            heading: section.heading,
            chunkIndex: chunkIndex++,
          });
        }
      }
    }
  }

  if (chunks.length === 0 && content.trim().length > 0) {
    chunks.push({
      text: content.trim(),
      heading: filePath.split('/').pop().replace(/\.md$/, ''),
      chunkIndex: 0,
    });
  }

  return chunks;
}

function splitByHeadings(content) {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const sections = [];
  let lastIndex = 0;
  let lastHeading = '';
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index);
      if (text.trim()) {
        sections.push({ heading: lastHeading, text });
      }
    }
    lastHeading = match[2].trim();
    lastIndex = match.index;
  }

  if (lastIndex < content.length) {
    sections.push({
      heading: lastHeading,
      text: content.slice(lastIndex),
    });
  }

  if (sections.length === 0) {
    sections.push({ heading: '', text: content });
  }

  return sections;
}

function splitByParagraphs(text) {
  const paragraphs = text.split(/\n\n+/);
  const chunks = [];
  let current = '';

  for (const para of paragraphs) {
    if (current.length + para.length > MAX_CHUNK_SIZE && current.length > 0) {
      chunks.push(current);
      current = para;
    } else {
      current = current ? current + '\n\n' + para : para;
    }
  }
  if (current.trim()) {
    chunks.push(current);
  }

  return chunks;
}

module.exports = { chunkMarkdown };
