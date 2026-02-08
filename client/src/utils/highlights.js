export const HIGHLIGHT_COLORS = [
  { name: 'Yellow', bg: 'rgba(250, 204, 21, 0.35)', dot: '#facc15' },
  { name: 'Green', bg: 'rgba(74, 222, 128, 0.35)', dot: '#4ade80' },
  { name: 'Blue', bg: 'rgba(96, 165, 250, 0.35)', dot: '#60a5fa' },
  { name: 'Pink', bg: 'rgba(251, 113, 133, 0.35)', dot: '#fb7185' },
  { name: 'Orange', bg: 'rgba(251, 146, 60, 0.35)', dot: '#fb923c' },
];

export function applyHighlightsToDOM(container, highlights) {
  if (!container) return;

  // Remove existing highlight marks
  const marks = container.querySelectorAll('mark[data-highlight-id]');
  marks.forEach((mark) => {
    const parent = mark.parentNode;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    mark.remove();
  });
  container.normalize();

  if (!highlights || !highlights.length) return;

  const fullText = container.textContent;

  // Resolve absolute positions for each highlight
  const resolved = [];
  for (const hl of highlights) {
    let pos = -1;
    let from = 0;
    for (let i = 0; i <= hl.occurrenceIndex; i++) {
      pos = fullText.indexOf(hl.text, from);
      if (pos === -1) break;
      from = pos + 1;
    }
    if (pos !== -1) {
      resolved.push({ ...hl, pos });
    }
  }

  // Sort by position descending so applying from end doesn't shift earlier positions
  resolved.sort((a, b) => b.pos - a.pos);

  for (const hl of resolved) {
    highlightAtPosition(container, hl.pos, hl.text.length, hl.color, hl.id);
  }
}

function highlightAtPosition(container, pos, length, color, id) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let charCount = 0;
  let startNode = null;
  let startOff = 0;
  let endNode = null;
  let endOff = 0;

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const nLen = node.length;

    if (!startNode && charCount + nLen > pos) {
      startNode = node;
      startOff = pos - charCount;
    }
    if (startNode && charCount + nLen >= pos + length) {
      endNode = node;
      endOff = pos + length - charCount;
      break;
    }
    charCount += nLen;
  }

  if (!startNode || !endNode) return;

  if (startNode === endNode) {
    wrapTextPortion(startNode, startOff, endOff, color, id);
  } else {
    // Collect text nodes in range
    const nodesInRange = [];
    const walker2 = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    let inRange = false;
    while (walker2.nextNode()) {
      if (walker2.currentNode === startNode) inRange = true;
      if (inRange) nodesInRange.push(walker2.currentNode);
      if (walker2.currentNode === endNode) break;
    }

    // Process in reverse to maintain DOM consistency
    for (let i = nodesInRange.length - 1; i >= 0; i--) {
      const node = nodesInRange[i];
      const wStart = node === startNode ? startOff : 0;
      const wEnd = node === endNode ? endOff : node.length;
      wrapTextPortion(node, wStart, wEnd, color, id);
    }
  }
}

function wrapTextPortion(textNode, start, end, color, id) {
  let targetNode = textNode;

  if (end < textNode.length) {
    textNode.splitText(end);
  }
  if (start > 0) {
    targetNode = textNode.splitText(start);
  }

  const mark = document.createElement('mark');
  mark.style.backgroundColor = color;
  mark.style.borderRadius = '2px';
  mark.style.padding = '0 1px';
  mark.style.cursor = 'pointer';
  mark.dataset.highlightId = id;
  targetNode.parentNode.insertBefore(mark, targetNode);
  mark.appendChild(targetNode);
}

export function getSelectionInfo(container) {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) return null;

  const text = sel.toString().trim();
  if (!text) return null;

  const range = sel.getRangeAt(0);
  if (
    !container.contains(range.startContainer) ||
    !container.contains(range.endContainer)
  ) {
    return null;
  }

  const rect = range.getBoundingClientRect();

  // Find absolute position of selection start in the container's text
  const fullText = container.textContent;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let selPos = 0;

  while (walker.nextNode()) {
    if (walker.currentNode === range.startContainer) {
      selPos += range.startOffset;
      break;
    }
    selPos += walker.currentNode.length;
  }

  // Count how many times `text` appears before selPos
  let occurrence = 0;
  let searchFrom = 0;
  while (true) {
    const idx = fullText.indexOf(text, searchFrom);
    if (idx === -1 || idx >= selPos) break;
    occurrence++;
    searchFrom = idx + 1;
  }

  return {
    text,
    occurrenceIndex: occurrence,
    rect: {
      x: rect.left + rect.width / 2,
      y: rect.top,
    },
  };
}
