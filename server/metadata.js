const fs = require('fs');
const path = require('path');

class Metadata {
  constructor(vaultDir) {
    this.filePath = path.join(vaultDir, '.metadata.json');
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        return JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
      }
    } catch (e) {
      console.error('Error loading metadata:', e);
    }
    return { tags: {}, favorites: [], recent: [], readingProgress: {} };
  }

  save() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
  }

  getTags(filePath) {
    return this.data.tags[filePath] || [];
  }

  setTags(filePath, tags) {
    if (tags.length === 0) {
      delete this.data.tags[filePath];
    } else {
      this.data.tags[filePath] = tags;
    }
    this.save();
  }

  isFavorite(filePath) {
    return this.data.favorites.includes(filePath);
  }

  toggleFavorite(filePath) {
    const idx = this.data.favorites.indexOf(filePath);
    if (idx >= 0) {
      this.data.favorites.splice(idx, 1);
    } else {
      this.data.favorites.push(filePath);
    }
    this.save();
    return this.data.favorites.includes(filePath);
  }

  addRecent(filePath) {
    this.data.recent = this.data.recent.filter(p => p !== filePath);
    this.data.recent.unshift(filePath);
    this.data.recent = this.data.recent.slice(0, 20);
    this.save();
  }

  getAll() {
    return this.data;
  }

  getProgress(filePath) {
    return this.data.readingProgress?.[filePath] || null;
  }

  setProgress(filePath, scrollPercent) {
    if (!this.data.readingProgress) this.data.readingProgress = {};
    this.data.readingProgress[filePath] = {
      scrollPercent,
      lastRead: new Date().toISOString(),
    };
    this.save();
  }

  getContinueReading() {
    if (!this.data.readingProgress) return [];
    return Object.entries(this.data.readingProgress)
      .filter(([, v]) => v.scrollPercent > 0 && v.scrollPercent < 1)
      .sort((a, b) => new Date(b[1].lastRead) - new Date(a[1].lastRead))
      .map(([path, data]) => ({ path, ...data }));
  }

  renamePath(oldPath, newPath) {
    if (this.data.tags[oldPath]) {
      this.data.tags[newPath] = this.data.tags[oldPath];
      delete this.data.tags[oldPath];
    }
    if (this.data.readingProgress?.[oldPath]) {
      this.data.readingProgress[newPath] = this.data.readingProgress[oldPath];
      delete this.data.readingProgress[oldPath];
    }
    this.data.favorites = this.data.favorites.map(p => p === oldPath ? newPath : p);
    this.data.recent = this.data.recent.map(p => p === oldPath ? newPath : p);
    this.save();
  }

  deletePath(filePath) {
    delete this.data.tags[filePath];
    delete this.data.readingProgress?.[filePath];
    this.data.favorites = this.data.favorites.filter(p => p !== filePath);
    this.data.recent = this.data.recent.filter(p => p !== filePath);
    this.save();
  }
}

module.exports = Metadata;
