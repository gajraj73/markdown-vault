import { useRef, useState } from 'react';
import useStore from '../store';
import { Search, Plus, Upload, Moon, Sun, Pencil, PencilOff, Star, Tag, BookOpen, Mic } from 'lucide-react';

export default function TopBar() {
  const {
    currentFile,
    darkMode,
    toggleDarkMode,
    showEditor,
    toggleEditor,
    setSearchOpen,
    uploadFiles,
    createFile,
    currentFavorite,
    toggleFavorite,
    currentTags,
    setTags,
    openReader,
    openVoiceNote,
  } = useStore();

  const fileInputRef = useRef(null);
  const [showNewFile, setShowNewFile] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length) {
      uploadFiles(files);
      e.target.value = '';
    }
  };

  const handleNewFile = () => {
    if (newFilePath.trim()) {
      const name = newFilePath.endsWith('.md') ? newFilePath : `${newFilePath}.md`;
      createFile(name);
    }
    setShowNewFile(false);
    setNewFilePath('');
  };

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const newTags = [...new Set([...currentTags, tagInput.trim()])];
      setTags(newTags);
      setTagInput('');
    }
    setShowTagInput(false);
  };

  const handleRemoveTag = (tag) => {
    setTags(currentTags.filter((t) => t !== tag));
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
      <div className="flex items-center gap-2 px-3 py-2">
        <h1 className="font-bold text-sm tracking-tight mr-2 select-none">
          Vault
        </h1>

        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 flex-1 max-w-xs transition-colors"
        >
          <Search size={14} />
          <span>Search...</span>
          <kbd className="ml-auto text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded font-mono">
            Cmd+P
          </kbd>
        </button>

        <div className="flex items-center gap-1 ml-auto">
          {showNewFile ? (
            <input
              autoFocus
              value={newFilePath}
              onChange={(e) => setNewFilePath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNewFile();
                if (e.key === 'Escape') {
                  setShowNewFile(false);
                  setNewFilePath('');
                }
              }}
              onBlur={handleNewFile}
              className="px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-600 outline-none focus:border-blue-400 w-48"
              placeholder="path/filename.md"
            />
          ) : (
            <button
              onClick={() => setShowNewFile(true)}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="New file (enter path like folder/name.md)"
            >
              <Plus size={18} />
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Upload .md files"
          >
            <Upload size={18} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,text/markdown"
            multiple
            onChange={handleUpload}
            className="hidden"
          />

          <button
            onClick={openVoiceNote}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Voice brain dump"
          >
            <Mic size={18} />
          </button>

          {currentFile && (
            <button
              onClick={() => openReader(currentFile)}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-blue-600 dark:text-blue-400"
              title="Open in reader mode"
            >
              <BookOpen size={18} />
            </button>
          )}

          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

          <button
            onClick={toggleEditor}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={showEditor ? 'Hide editor' : 'Show editor'}
          >
            {showEditor ? <PencilOff size={18} /> : <Pencil size={18} />}
          </button>

          <button
            onClick={toggleDarkMode}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Toggle dark mode"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      {currentFile && (
        <div className="flex items-center gap-2 px-3 py-1 border-t border-gray-100 dark:border-gray-800 text-sm overflow-x-auto">
          <span className="text-gray-400 text-xs truncate shrink-0">
            {currentFile}
          </span>

          <button
            onClick={toggleFavorite}
            className={`p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0 transition-colors ${
              currentFavorite ? 'text-yellow-500' : 'text-gray-400'
            }`}
            title="Toggle favorite"
          >
            <Star size={14} fill={currentFavorite ? 'currentColor' : 'none'} />
          </button>

          <div className="flex items-center gap-1 flex-wrap">
            {currentTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded text-xs"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-red-500 ml-0.5"
                >
                  &times;
                </button>
              </span>
            ))}
            {showTagInput ? (
              <input
                autoFocus
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTag();
                  if (e.key === 'Escape') {
                    setShowTagInput(false);
                    setTagInput('');
                  }
                }}
                onBlur={handleAddTag}
                className="px-1.5 py-0.5 text-xs border rounded dark:bg-gray-800 dark:border-gray-600 outline-none focus:border-blue-400 w-20"
                placeholder="tag name"
              />
            ) : (
              <button
                onClick={() => setShowTagInput(true)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5"
                title="Add tag"
              >
                <Tag size={12} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
