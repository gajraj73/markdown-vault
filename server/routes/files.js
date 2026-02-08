const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Metadata = require('../metadata');

function buildTree(dir, basePath = '') {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  const children = [];

  for (const item of items) {
    if (item.name.startsWith('.')) continue;
    const itemPath = basePath ? `${basePath}/${item.name}` : item.name;

    if (item.isDirectory()) {
      children.push({
        name: item.name,
        type: 'folder',
        path: itemPath,
        children: buildTree(path.join(dir, item.name), itemPath),
      });
    } else if (item.name.endsWith('.md')) {
      const stats = fs.statSync(path.join(dir, item.name));
      children.push({
        name: item.name,
        type: 'file',
        path: itemPath,
        modified: stats.mtime,
      });
    }
  }

  children.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return children;
}

function safePath(vaultDir, filePath) {
  const resolved = path.resolve(vaultDir, filePath);
  if (!resolved.startsWith(path.resolve(vaultDir))) return null;
  return resolved;
}

function searchFiles(dir, query, basePath = '') {
  const results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  const lowerQuery = query.toLowerCase();

  for (const item of items) {
    if (item.name.startsWith('.')) continue;
    const itemPath = basePath ? `${basePath}/${item.name}` : item.name;
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      results.push(...searchFiles(fullPath, query, itemPath));
    } else if (item.name.endsWith('.md')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lowerContent = content.toLowerCase();
      const nameMatch = item.name.toLowerCase().includes(lowerQuery);
      const contentIndex = lowerContent.indexOf(lowerQuery);

      if (nameMatch || contentIndex >= 0) {
        let snippet = '';
        if (contentIndex >= 0) {
          const start = Math.max(0, contentIndex - 50);
          const end = Math.min(content.length, contentIndex + query.length + 50);
          snippet = (start > 0 ? '...' : '') +
            content.slice(start, end) +
            (end < content.length ? '...' : '');
        }
        results.push({ name: item.name, path: itemPath, snippet, nameMatch });
      }
    }
  }
  return results;
}

let metadataCache = {};
function getMetadata(vaultDir) {
  if (!metadataCache[vaultDir]) {
    metadataCache[vaultDir] = new Metadata(vaultDir);
  }
  return metadataCache[vaultDir];
}

// --- Routes ---

router.get('/tree', (req, res) => {
  try {
    res.json(buildTree(req.vaultDir));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/file', (req, res) => {
  const filePath = req.query.path;
  if (!filePath) return res.status(400).json({ error: 'Path required' });

  const full = safePath(req.vaultDir, filePath);
  if (!full) return res.status(403).json({ error: 'Invalid path' });

  try {
    const content = fs.readFileSync(full, 'utf-8');
    const meta = getMetadata(req.vaultDir);
    meta.addRecent(filePath);
    res.json({
      content,
      tags: meta.getTags(filePath),
      favorite: meta.isFavorite(filePath),
    });
  } catch {
    res.status(404).json({ error: 'File not found' });
  }
});

router.put('/file', (req, res) => {
  const { path: filePath, content } = req.body;
  if (!filePath) return res.status(400).json({ error: 'Path required' });

  const full = safePath(req.vaultDir, filePath);
  if (!full) return res.status(403).json({ error: 'Invalid path' });

  try {
    const dir = path.dirname(full);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(full, content || '');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/file', (req, res) => {
  const filePath = req.query.path;
  if (!filePath) return res.status(400).json({ error: 'Path required' });

  const full = safePath(req.vaultDir, filePath);
  if (!full) return res.status(403).json({ error: 'Invalid path' });

  try {
    fs.unlinkSync(full);
    getMetadata(req.vaultDir).deletePath(filePath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/rename', (req, res) => {
  const { oldPath, newPath } = req.body;
  if (!oldPath || !newPath) return res.status(400).json({ error: 'Both paths required' });

  const fullOld = safePath(req.vaultDir, oldPath);
  const fullNew = safePath(req.vaultDir, newPath);
  if (!fullOld || !fullNew) return res.status(403).json({ error: 'Invalid path' });

  try {
    const dir = path.dirname(fullNew);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.renameSync(fullOld, fullNew);
    getMetadata(req.vaultDir).renamePath(oldPath, newPath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/folder', (req, res) => {
  const { path: folderPath } = req.body;
  if (!folderPath) return res.status(400).json({ error: 'Path required' });

  const full = safePath(req.vaultDir, folderPath);
  if (!full) return res.status(403).json({ error: 'Invalid path' });

  try {
    fs.mkdirSync(full, { recursive: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/folder', (req, res) => {
  const folderPath = req.query.path;
  if (!folderPath) return res.status(400).json({ error: 'Path required' });

  const full = safePath(req.vaultDir, folderPath);
  if (!full) return res.status(403).json({ error: 'Invalid path' });

  try {
    fs.rmSync(full, { recursive: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const upload = multer({ storage: multer.memoryStorage() });
router.post('/upload', upload.array('files'), (req, res) => {
  const folder = req.body.folder || '';
  try {
    const uploaded = [];
    for (const file of req.files) {
      let fileName = file.originalname;
      if (!fileName.endsWith('.md')) fileName += '.md';
      const filePath = folder ? `${folder}/${fileName}` : fileName;
      const full = safePath(req.vaultDir, filePath);
      if (!full) continue;

      const dir = path.dirname(full);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(full, file.buffer.toString('utf-8'));
      uploaded.push(filePath);
    }
    res.json({ success: true, files: uploaded });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/search', (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Query required' });

  try {
    res.json(searchFiles(req.vaultDir, query));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/metadata', (req, res) => {
  res.json(getMetadata(req.vaultDir).getAll());
});

router.put('/metadata/tags', (req, res) => {
  const { path: filePath, tags } = req.body;
  if (!filePath) return res.status(400).json({ error: 'Path required' });
  getMetadata(req.vaultDir).setTags(filePath, tags || []);
  res.json({ success: true });
});

router.put('/metadata/favorite', (req, res) => {
  const { path: filePath } = req.body;
  if (!filePath) return res.status(400).json({ error: 'Path required' });
  const isFav = getMetadata(req.vaultDir).toggleFavorite(filePath);
  res.json({ favorite: isFav });
});

router.put('/metadata/progress', (req, res) => {
  const { path: filePath, scrollPercent } = req.body;
  if (!filePath) return res.status(400).json({ error: 'Path required' });
  getMetadata(req.vaultDir).setProgress(filePath, scrollPercent);
  res.json({ success: true });
});

router.get('/metadata/progress', (req, res) => {
  const filePath = req.query.path;
  if (!filePath) return res.status(400).json({ error: 'Path required' });
  const progress = getMetadata(req.vaultDir).getProgress(filePath);
  res.json(progress || { scrollPercent: 0 });
});

router.get('/metadata/continue-reading', (req, res) => {
  res.json(getMetadata(req.vaultDir).getContinueReading());
});

module.exports = router;
