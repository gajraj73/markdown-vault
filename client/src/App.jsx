import { useEffect, useState, useCallback } from 'react';
import useStore from './store';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Preview from './components/Preview';
import TopBar from './components/TopBar';
import SearchModal from './components/SearchModal';
import Reader from './components/Reader';

export default function App() {
  const { darkMode, loadTree, loadMetadata, loadContinueReading, showPreview, currentFile, searchOpen, uploadFiles, readerMode } = useStore();
  const [dropping, setDropping] = useState(false);

  useEffect(() => {
    loadTree();
    loadMetadata();
    loadContinueReading();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        useStore.getState().setSearchOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        useStore.getState().saveFile();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Drag and drop
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDropping(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDropping(false);
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDropping(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.name.endsWith('.md') || f.type === 'text/markdown'
    );
    if (files.length) {
      await uploadFiles(files);
    }
  }, [uploadFiles]);

  return (
    <div
      className={`h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${
        dropping ? 'drop-active' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 overflow-hidden">
          {currentFile ? (
            <>
              <Editor />
              {showPreview && <Preview />}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="text-3xl mb-2 font-light">Markdown Vault</p>
                <p className="text-sm">Select a file or create a new one to get started</p>
                <p className="text-xs mt-4 text-gray-300 dark:text-gray-600">
                  Cmd+P to search &middot; Cmd+S to save &middot; Drag .md files to upload
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      {searchOpen && <SearchModal />}
      {readerMode && <Reader />}

      {dropping && (
        <div className="fixed inset-0 bg-blue-500/10 z-40 pointer-events-none flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl px-8 py-6 text-center">
            <p className="text-lg font-medium">Drop .md files to upload</p>
          </div>
        </div>
      )}
    </div>
  );
}
