import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import useStore from '../store';
import HighlightPopup from './HighlightPopup';
import { applyHighlightsToDOM, getSelectionInfo } from '../utils/highlights';
import { getMarkdownComponents } from '../utils/markdownComponents';
import {
  X,
  Minus,
  Plus,
  Sun,
  Moon,
  BookOpen,
} from 'lucide-react';

const THEMES = {
  light: {
    bg: 'bg-white',
    text: 'text-gray-900',
    prose: 'prose-gray',
    bar: 'bg-gray-100 text-gray-700',
    barBorder: 'border-gray-200',
    btn: 'hover:bg-gray-200',
    label: 'Light',
  },
  sepia: {
    bg: 'bg-[#f4ecd8]',
    text: 'text-[#5b4636]',
    prose: 'prose-stone',
    bar: 'bg-[#e8dcc8] text-[#5b4636]',
    barBorder: 'border-[#d4c4a8]',
    btn: 'hover:bg-[#d4c4a8]',
    label: 'Sepia',
  },
  dark: {
    bg: 'bg-[#1a1a2e]',
    text: 'text-[#d4d4dc]',
    prose: 'prose-invert',
    bar: 'bg-[#16213e] text-[#d4d4dc]',
    barBorder: 'border-[#0f3460]',
    btn: 'hover:bg-[#0f3460]',
    label: 'Dark',
  },
};

const FONT_SIZES = [14, 16, 18, 20, 22, 24, 28];

export default function Reader() {
  const {
    readerFile,
    readerContent,
    readerTheme,
    readerFontSize,
    readerHighlights,
    closeReader,
    setReaderTheme,
    setReaderFontSize,
    saveReadingProgress,
    addHighlight,
    removeHighlight,
  } = useStore();

  const scrollRef = useRef(null);
  const contentRef = useRef(null);
  const saveTimerRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [initialScrollDone, setInitialScrollDone] = useState(false);
  const controlsTimerRef = useRef(null);
  const [popup, setPopup] = useState(null);

  const theme = THEMES[readerTheme] || THEMES.dark;
  const isDark = readerTheme === 'dark';
  const markdownComponents = useMemo(() => getMarkdownComponents(isDark), [isDark]);
  const fileName = readerFile?.split('/').pop()?.replace(/\.md$/, '') || '';

  // Apply highlights after content renders
  useEffect(() => {
    if (contentRef.current) {
      applyHighlightsToDOM(contentRef.current, readerHighlights);
    }
  }, [readerContent, readerHighlights]);

  // Restore scroll position on mount
  useEffect(() => {
    const { readerScrollPercent } = useStore.getState();
    if (scrollRef.current && readerScrollPercent > 0) {
      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (!el) return;
        const maxScroll = el.scrollHeight - el.clientHeight;
        el.scrollTop = maxScroll * readerScrollPercent;
        setInitialScrollDone(true);
      });
    } else {
      setInitialScrollDone(true);
    }
  }, [readerContent]);

  // Track scroll and save progress
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !initialScrollDone) return;

    const maxScroll = el.scrollHeight - el.clientHeight;
    const pct = maxScroll > 0 ? el.scrollTop / maxScroll : 0;
    setProgress(pct);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveReadingProgress(pct);
    }, 500);

    // Close popup on scroll
    setPopup(null);
  }, [saveReadingProgress, initialScrollDone]);

  // Save progress on close
  const handleClose = useCallback(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      const maxScroll = el.scrollHeight - el.clientHeight;
      const pct = maxScroll > 0 ? el.scrollTop / maxScroll : 0;
      saveReadingProgress(pct);
    }
    closeReader();
    useStore.getState().loadContinueReading();
  }, [closeReader, saveReadingProgress]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleClose]);

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const cycleFontSize = (dir) => {
    const idx = FONT_SIZES.indexOf(readerFontSize);
    const next = idx + dir;
    if (next >= 0 && next < FONT_SIZES.length) {
      setReaderFontSize(FONT_SIZES[next]);
    }
  };

  const cycleTheme = () => {
    const keys = Object.keys(THEMES);
    const idx = keys.indexOf(readerTheme);
    setReaderTheme(keys[(idx + 1) % keys.length]);
  };

  // Highlight handlers
  const handleMouseUp = useCallback(() => {
    if (!contentRef.current) return;
    setTimeout(() => {
      const info = getSelectionInfo(contentRef.current);
      if (info) {
        setPopup({ mode: 'add', position: info.rect, text: info.text, occurrenceIndex: info.occurrenceIndex });
      }
    }, 10);
  }, []);

  const handleContentClick = useCallback((e) => {
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
    if (!popup || !readerFile) return;
    const highlight = {
      id: crypto.randomUUID(),
      text: popup.text,
      color,
      occurrenceIndex: popup.occurrenceIndex,
    };
    addHighlight(readerFile, highlight, true);
    window.getSelection()?.removeAllRanges();
    setPopup(null);
  }, [popup, readerFile, addHighlight]);

  const handleRemoveHighlight = useCallback(() => {
    if (!popup || !readerFile) return;
    removeHighlight(readerFile, popup.highlightId, true);
    setPopup(null);
  }, [popup, readerFile, removeHighlight]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col ${theme.bg} ${theme.text} transition-colors duration-300`}
      onMouseMove={resetControlsTimer}
    >
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 z-[110] bg-black/10">
        <div
          className="h-full bg-blue-500 transition-all duration-150"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Top bar */}
      <div
        className={`flex items-center gap-3 px-4 py-2 border-b ${theme.bar} ${theme.barBorder} transition-all duration-300 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
        }`}
      >
        <button
          onClick={handleClose}
          className={`p-2 rounded-lg ${theme.btn} transition-colors`}
          title="Close reader (Esc)"
        >
          <X size={20} />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{fileName}</p>
          <p className="text-xs opacity-60">{Math.round(progress * 100)}% read</p>
        </div>

        <div className="flex items-center gap-1">
          {/* Font size */}
          <button
            onClick={() => cycleFontSize(-1)}
            className={`p-2 rounded-lg ${theme.btn} transition-colors`}
            title="Decrease font size"
            disabled={readerFontSize <= FONT_SIZES[0]}
          >
            <Minus size={16} />
          </button>
          <span className="text-xs w-8 text-center font-mono">{readerFontSize}</span>
          <button
            onClick={() => cycleFontSize(1)}
            className={`p-2 rounded-lg ${theme.btn} transition-colors`}
            title="Increase font size"
            disabled={readerFontSize >= FONT_SIZES[FONT_SIZES.length - 1]}
          >
            <Plus size={16} />
          </button>

          <div className="w-px h-6 bg-current opacity-20 mx-2" />

          {/* Theme cycle */}
          <button
            onClick={cycleTheme}
            className={`p-2 rounded-lg ${theme.btn} transition-colors flex items-center gap-1.5`}
            title={`Theme: ${theme.label}`}
          >
            {readerTheme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            <span className="text-xs">{theme.label}</span>
          </button>
        </div>
      </div>

      {/* Reading content */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4"
        onClick={resetControlsTimer}
      >
        <div className="max-w-[700px] mx-auto py-12 pb-32">
          <div
            ref={contentRef}
            className={`prose ${theme.prose} max-w-none prose-pre:bg-[#22272e] prose-pre:text-[#adbac7] prose-img:rounded-lg prose-headings:font-semibold`}
            style={{ fontSize: `${readerFontSize}px`, lineHeight: 1.8 }}
            onMouseUp={handleMouseUp}
            onClick={handleContentClick}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={markdownComponents}
            >
              {readerContent}
            </ReactMarkdown>
          </div>

          {/* End of file indicator */}
          <div className="mt-16 mb-8 text-center opacity-40">
            <BookOpen size={32} className="mx-auto mb-2" />
            <p className="text-sm">End of document</p>
          </div>
        </div>
      </div>

      {/* Bottom page indicator */}
      <div
        className={`flex items-center justify-center py-2 text-xs opacity-60 border-t ${theme.barBorder} transition-all duration-300 ${
          showControls ? 'opacity-60' : 'opacity-0'
        }`}
      >
        <span>Esc to close</span>
        <span className="mx-3">|</span>
        <span>{Math.round(progress * 100)}%</span>
      </div>

      <HighlightPopup
        position={popup?.position}
        mode={popup?.mode}
        onSelectColor={handleColorSelect}
        onRemove={handleRemoveHighlight}
        onClose={() => setPopup(null)}
      />
    </div>
  );
}
