/**
 * Inserts a mermaid code block after the paragraph containing the selected text.
 * The selectedText comes from the rendered DOM (no markdown syntax), so we
 * strip markdown formatting from the content to find the match position,
 * then map that position back to the original content.
 */
export function insertAfterParagraph(content, selectedText, occurrenceIndex, mermaidCode) {
  const mermaidBlock = '\n\n```mermaid\n' + mermaidCode + '\n```\n';

  // Strip common inline markdown to create a plain-text version for matching
  // This maps each character in stripped text back to original content position
  const stripped = content
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/`([^`]+)`/g, '$1');

  // Use first 60 chars of selected text as search key (avoids line-break mismatches)
  const searchKey = selectedText.slice(0, 60).trim();

  // Find the Nth occurrence of the search key in the stripped content
  let searchFrom = 0;
  let foundAt = -1;
  for (let i = 0; i <= occurrenceIndex; i++) {
    foundAt = stripped.indexOf(searchKey, searchFrom);
    if (foundAt === -1) break;
    searchFrom = foundAt + 1;
  }

  if (foundAt === -1) {
    // Fallback: append at end
    return content + mermaidBlock;
  }

  // Now find the corresponding position in the original content.
  // Since stripping only removes chars, the position in stripped text is
  // at or before the position in original. Search original from foundAt.
  // Find the search key's beginning word in original near foundAt.
  const origSearchKey = searchKey.slice(0, 30);
  let origFoundAt = content.indexOf(origSearchKey, Math.max(0, foundAt - 20));
  if (origFoundAt === -1) origFoundAt = foundAt; // fallback

  // Find end of the section (next double newline after the selection)
  const afterSelection = origFoundAt + selectedText.length;
  const nextDoubleNewline = content.indexOf('\n\n', afterSelection);

  const insertPos = nextDoubleNewline === -1 ? content.length : nextDoubleNewline;

  return content.slice(0, insertPos) + mermaidBlock + content.slice(insertPos);
}
