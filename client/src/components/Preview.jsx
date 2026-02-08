import { useRef, useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import useStore from '../store';
import HighlightPopup from './HighlightPopup';
import { applyHighlightsToDOM, getSelectionInfo } from '../utils/highlights';

export default function Preview() {
  const { content, currentFile, currentHighlights, addHighlight, removeHighlight } = useStore();
  const contentRef = useRef(null);
  const [popup, setPopup] = useState(null);

  // Apply highlights after render
  useEffect(() => {
    if (contentRef.current) {
      applyHighlightsToDOM(contentRef.current, currentHighlights);
    }
  }, [content, currentHighlights]);

  const handleMouseUp = useCallback(() => {
    if (!contentRef.current) return;
    // Small delay to let selection finalize
    setTimeout(() => {
      const info = getSelectionInfo(contentRef.current);
      if (info) {
        setPopup({ mode: 'add', position: info.rect, text: info.text, occurrenceIndex: info.occurrenceIndex });
      }
    }, 10);
  }, []);

  const handleClick = useCallback((e) => {
    const mark = e.target.closest('mark[data-highlight-id]');
    if (mark) {
      const rect = mark.getBoundingClientRect();
      setPopup({
        mode: 'remove',
        position: { x: rect.left + rect.width / 2, y: rect.top },
        highlightId: mark.dataset.highlightId,
      });
      e.stopPropagation();
    }
  }, []);

  const handleColorSelect = useCallback((color) => {
    if (!popup || !currentFile) return;
    const highlight = {
      id: crypto.randomUUID(),
      text: popup.text,
      color,
      occurrenceIndex: popup.occurrenceIndex,
    };
    addHighlight(currentFile, highlight, false);
    window.getSelection()?.removeAllRanges();
    setPopup(null);
  }, [popup, currentFile, addHighlight]);

  const handleRemove = useCallback(() => {
    if (!popup || !currentFile) return;
    removeHighlight(currentFile, popup.highlightId, false);
    setPopup(null);
  }, [popup, currentFile, removeHighlight]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-3 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-500">
        Preview
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div
          ref={contentRef}
          className="prose dark:prose-invert max-w-none prose-pre:bg-[#22272e] prose-pre:text-[#adbac7]"
          onMouseUp={handleMouseUp}
          onClick={handleClick}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
      <HighlightPopup
        position={popup?.position}
        mode={popup?.mode}
        onSelectColor={handleColorSelect}
        onRemove={handleRemove}
        onClose={() => setPopup(null)}
      />
    </div>
  );
}
