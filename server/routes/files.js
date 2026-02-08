const express = require('express');
const router = express.Router();
const multer = require('multer');
const File = require('../models/File');

// Build tree structure from flat file paths
function buildTreeFromFiles(files) {
  const root = [];

  for (const file of files) {
    const parts = file.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isFile = i === parts.length - 1;
      const existing = current.find((n) => n.name === name);

      if (existing && !isFile) {
        current = existing.children;
      } else if (isFile) {
        current.push({
          name,
          type: 'file',
          path: file.path,
          modified: file.updatedAt,
        });
      } else {
        const folder = {
          name,
          type: 'folder',
          path: parts.slice(0, i + 1).join('/'),
          children: [],
        };
        current.push(folder);
        current = folder.children;
      }
    }
  }

  const sortLevel = (nodes) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.filter((n) => n.children).forEach((n) => sortLevel(n.children));
  };
  sortLevel(root);

  return root;
}

// --- Routes ---

router.get('/tree', async (req, res) => {
  try {
    const files = await File.find({}, 'path updatedAt').lean();
    res.json(buildTreeFromFiles(files));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/file', async (req, res) => {
  const filePath = req.query.path;
  if (!filePath) return res.status(400).json({ error: 'Path required' });

  try {
    const file = await File.findOne({ path: filePath });
    if (!file) return res.status(404).json({ error: 'File not found' });

    // Update lastOpened
    file.lastOpened = new Date();
    await file.save();

    res.json({
      content: file.content,
      tags: file.tags,
      favorite: file.favorite,
      highlights: file.highlights,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/file', async (req, res) => {
  const { path: filePath, content } = req.body;
  if (!filePath) return res.status(400).json({ error: 'Path required' });

  try {
    await File.findOneAndUpdate(
      { path: filePath },
      { content: content || '', lastOpened: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/file', async (req, res) => {
  const filePath = req.query.path;
  if (!filePath) return res.status(400).json({ error: 'Path required' });

  try {
    await File.deleteOne({ path: filePath });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/rename', async (req, res) => {
  const { oldPath, newPath } = req.body;
  if (!oldPath || !newPath)
    return res.status(400).json({ error: 'Both paths required' });

  try {
    // Rename the file itself
    await File.updateOne({ path: oldPath }, { path: newPath });

    // If it's a folder rename, update all children
    const children = await File.find({
      path: { $regex: `^${oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/` },
    });
    for (const child of children) {
      child.path = child.path.replace(oldPath, newPath);
      await child.save();
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/folder', async (req, res) => {
  // Folders are implicit in MongoDB (derived from file paths)
  // This is a no-op that returns success for UI compatibility
  res.json({ success: true });
});

router.delete('/folder', async (req, res) => {
  const folderPath = req.query.path;
  if (!folderPath) return res.status(400).json({ error: 'Path required' });

  try {
    const escaped = folderPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await File.deleteMany({
      path: { $regex: `^${escaped}(/|$)` },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const upload = multer({ storage: multer.memoryStorage() });
router.post('/upload', upload.array('files'), async (req, res) => {
  const folder = req.body.folder || '';
  try {
    const uploaded = [];
    for (const file of req.files) {
      let fileName = file.originalname;
      if (!fileName.endsWith('.md')) fileName += '.md';
      const filePath = folder ? `${folder}/${fileName}` : fileName;
      const content = file.buffer.toString('utf-8');

      await File.findOneAndUpdate(
        { path: filePath },
        { content, lastOpened: new Date() },
        { upsert: true }
      );
      uploaded.push(filePath);
    }
    res.json({ success: true, files: uploaded });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Query required' });

  try {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const files = await File.find({
      $or: [
        { path: { $regex: escaped, $options: 'i' } },
        { content: { $regex: escaped, $options: 'i' } },
      ],
    })
      .select('path content')
      .lean();

    const results = files.map((file) => {
      const name = file.path.split('/').pop();
      const lowerContent = file.content.toLowerCase();
      const lowerQuery = query.toLowerCase();
      const contentIndex = lowerContent.indexOf(lowerQuery);
      const nameMatch = name.toLowerCase().includes(lowerQuery);

      let snippet = '';
      if (contentIndex >= 0) {
        const start = Math.max(0, contentIndex - 50);
        const end = Math.min(
          file.content.length,
          contentIndex + query.length + 50
        );
        snippet =
          (start > 0 ? '...' : '') +
          file.content.slice(start, end) +
          (end < file.content.length ? '...' : '');
      }

      return { name, path: file.path, snippet, nameMatch };
    });

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/metadata', async (req, res) => {
  try {
    const files = await File.find({}, 'path tags favorite').lean();

    const tags = {};
    const favorites = [];
    const recent = [];

    for (const file of files) {
      if (file.tags && file.tags.length) {
        tags[file.path] = file.tags;
      }
      if (file.favorite) {
        favorites.push(file.path);
      }
    }

    // Recent: last 20 opened files
    const recentFiles = await File.find({ lastOpened: { $ne: null } })
      .sort({ lastOpened: -1 })
      .limit(20)
      .select('path')
      .lean();
    for (const f of recentFiles) {
      recent.push(f.path);
    }

    res.json({ tags, favorites, recent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/metadata/tags', async (req, res) => {
  const { path: filePath, tags } = req.body;
  if (!filePath) return res.status(400).json({ error: 'Path required' });

  try {
    await File.updateOne({ path: filePath }, { tags: tags || [] });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/metadata/favorite', async (req, res) => {
  const { path: filePath } = req.body;
  if (!filePath) return res.status(400).json({ error: 'Path required' });

  try {
    const file = await File.findOne({ path: filePath });
    if (!file) return res.status(404).json({ error: 'File not found' });

    file.favorite = !file.favorite;
    await file.save();
    res.json({ favorite: file.favorite });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/metadata/highlights', async (req, res) => {
  const { path: filePath, highlights } = req.body;
  if (!filePath) return res.status(400).json({ error: 'Path required' });

  try {
    await File.updateOne({ path: filePath }, { highlights: highlights || [] });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/metadata/progress', async (req, res) => {
  const { path: filePath, scrollPercent } = req.body;
  if (!filePath) return res.status(400).json({ error: 'Path required' });

  try {
    await File.updateOne(
      { path: filePath },
      {
        'readingProgress.scrollPercent': scrollPercent,
        'readingProgress.lastRead': new Date(),
      }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/metadata/progress', async (req, res) => {
  const filePath = req.query.path;
  if (!filePath) return res.status(400).json({ error: 'Path required' });

  try {
    const file = await File.findOne({ path: filePath })
      .select('readingProgress')
      .lean();
    res.json(file?.readingProgress || { scrollPercent: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/metadata/continue-reading', async (req, res) => {
  try {
    const files = await File.find({
      'readingProgress.scrollPercent': { $gt: 0, $lt: 1 },
      'readingProgress.lastRead': { $ne: null },
    })
      .sort({ 'readingProgress.lastRead': -1 })
      .select('path readingProgress')
      .lean();

    const result = files.map((f) => ({
      path: f.path,
      scrollPercent: f.readingProgress.scrollPercent,
      lastRead: f.readingProgress.lastRead,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
