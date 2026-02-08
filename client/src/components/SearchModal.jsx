import { useState, useEffect, useRef } from 'react';
import { search } from '../api';
import useStore from '../store';
import { Search, X, File } from 'lucide-react';

export default function SearchModal() {
  const { setSearchOpen, openFile } = useStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await search(query);
        setResults(data);
        setSelectedIdx(0);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 250);
  }, [query]);

  const handleSelect = (filePath) => {
    openFile(filePath);
    setSearchOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setSearchOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results.length > 0) {
      handleSelect(results[selectedIdx].path);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[15vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) setSearchOpen(false);
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b dark:border-gray-700">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-sm"
            placeholder="Search files by name or content..."
          />
          <button
            onClick={() => setSearchOpen(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <p className="px-4 py-3 text-sm text-gray-400">Searching...</p>
          )}
          {!loading && query && results.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-400">No results found</p>
          )}
          {results.map((result, idx) => (
            <button
              key={result.path}
              onClick={() => handleSelect(result.path)}
              onMouseEnter={() => setSelectedIdx(idx)}
              className={`w-full text-left px-4 py-3 border-b dark:border-gray-700 last:border-0 transition-colors ${
                idx === selectedIdx
                  ? 'bg-blue-50 dark:bg-blue-900/30'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <File size={14} className="shrink-0 text-gray-400" />
                <span>{result.name}</span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5 ml-[22px]">
                {result.path}
              </div>
              {result.snippet && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-[22px] truncate">
                  {result.snippet}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
