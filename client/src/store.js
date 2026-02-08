import { create } from 'zustand';
import * as api from './api';

const useStore = create((set, get) => ({
  // File tree
  tree: [],
  loadTree: async () => {
    try {
      const tree = await api.getTree();
      set({ tree });
    } catch (err) {
      console.error('Failed to load tree:', err);
    }
  },

  // Current file
  currentFile: null,
  content: '',
  dirty: false,

  openFile: async (filePath) => {
    const { dirty, currentFile, content } = get();
    if (dirty && currentFile) {
      await api.saveFile(currentFile, content);
    }
    try {
      const data = await api.getFile(filePath);
      set({
        currentFile: filePath,
        content: data.content,
        dirty: false,
        currentTags: data.tags || [],
        currentFavorite: data.favorite || false,
        currentHighlights: data.highlights || [],
      });
    } catch (err) {
      console.error('Failed to open file:', err);
    }
  },

  setContent: (content) => {
    set({ content, dirty: true });
  },

  saveFile: async () => {
    const { currentFile, content, dirty } = get();
    if (!currentFile || !dirty) return;
    try {
      await api.saveFile(currentFile, content);
      set({ dirty: false });
    } catch (err) {
      console.error('Failed to save:', err);
    }
  },

  // Metadata
  metadata: { tags: {}, favorites: [], recent: [] },
  currentTags: [],
  currentFavorite: false,
  currentHighlights: [],

  loadMetadata: async () => {
    try {
      const metadata = await api.getMetadata();
      set({ metadata });
    } catch (err) {
      console.error('Failed to load metadata:', err);
    }
  },

  setTags: async (tags) => {
    const { currentFile } = get();
    if (!currentFile) return;
    await api.setTags(currentFile, tags);
    set({ currentTags: tags });
    get().loadMetadata();
  },

  toggleFavorite: async () => {
    const { currentFile } = get();
    if (!currentFile) return;
    const result = await api.toggleFavorite(currentFile);
    set({ currentFavorite: result.favorite });
    get().loadMetadata();
  },

  // UI
  darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),

  showEditor: false,
  toggleEditor: () => set((s) => ({ showEditor: !s.showEditor })),

  sidebarTab: 'files',
  setSidebarTab: (tab) => set({ sidebarTab: tab }),

  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),

  // Reader mode
  readerMode: false,
  readerFile: null,
  readerContent: '',
  readerHighlights: [],
  readerTheme: localStorage.getItem('readerTheme') || 'dark',
  readerFontSize: parseInt(localStorage.getItem('readerFontSize') || '18', 10),

  openReader: async (filePath) => {
    const { dirty, currentFile, content } = get();
    if (dirty && currentFile) {
      await api.saveFile(currentFile, content);
    }
    try {
      const data = await api.getFile(filePath);
      const progress = await api.getProgress(filePath);
      set({
        readerMode: true,
        readerFile: filePath,
        readerContent: data.content,
        readerHighlights: data.highlights || [],
        readerScrollPercent: progress?.scrollPercent || 0,
      });
    } catch (err) {
      console.error('Failed to open reader:', err);
    }
  },

  closeReader: () => {
    set({ readerMode: false, readerFile: null, readerContent: '' });
  },

  setReaderTheme: (theme) => {
    localStorage.setItem('readerTheme', theme);
    set({ readerTheme: theme });
  },

  setReaderFontSize: (size) => {
    localStorage.setItem('readerFontSize', String(size));
    set({ readerFontSize: size });
  },

  saveReadingProgress: async (scrollPercent) => {
    const { readerFile } = get();
    if (!readerFile) return;
    await api.saveProgress(readerFile, scrollPercent);
  },

  continueReading: [],
  loadContinueReading: async () => {
    try {
      const list = await api.getContinueReading();
      set({ continueReading: list });
    } catch (err) {
      console.error('Failed to load continue reading:', err);
    }
  },

  addHighlight: async (filePath, highlight, isReader) => {
    const key = isReader ? 'readerHighlights' : 'currentHighlights';
    const current = get()[key];
    const updated = [...current, highlight];
    set({ [key]: updated });
    await api.saveHighlights(filePath, updated);
  },

  removeHighlight: async (filePath, highlightId, isReader) => {
    const key = isReader ? 'readerHighlights' : 'currentHighlights';
    const current = get()[key];
    const updated = current.filter((h) => h.id !== highlightId);
    set({ [key]: updated });
    await api.saveHighlights(filePath, updated);
  },

  // Actions
  createFile: async (filePath) => {
    const name = filePath.split('/').pop().replace(/\.md$/, '');
    await api.saveFile(filePath, `# ${name}\n\n`);
    await get().loadTree();
    await get().openFile(filePath);
  },

  deleteFile: async (filePath) => {
    await api.deleteFile(filePath);
    if (get().currentFile === filePath) {
      set({ currentFile: null, content: '', dirty: false });
    }
    await get().loadTree();
    await get().loadMetadata();
  },

  createFolder: async (folderPath) => {
    await api.createFolder(folderPath);
    await get().loadTree();
  },

  renameFile: async (oldPath, newPath) => {
    await api.renameFile(oldPath, newPath);
    if (get().currentFile === oldPath) {
      set({ currentFile: newPath });
    }
    await get().loadTree();
    await get().loadMetadata();
  },

  uploadFiles: async (files, folder) => {
    await api.uploadFiles(files, folder);
    await get().loadTree();
  },
}));

export default useStore;
