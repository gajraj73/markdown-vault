/**
 * Migration script: imports existing vault/ files and .metadata.json into MongoDB.
 * Run once after setting up MONGODB_URI in .env:
 *   node server/migrate.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const File = require('./models/File');

const VAULT_DIR = path.join(__dirname, '..', 'vault');

function readVaultFiles(dir, basePath = '') {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    if (item.name.startsWith('.')) continue;
    const itemPath = basePath ? `${basePath}/${item.name}` : item.name;
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      results.push(...readVaultFiles(fullPath, itemPath));
    } else if (item.name.endsWith('.md')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const stats = fs.statSync(fullPath);
      results.push({ path: itemPath, content, modified: stats.mtime });
    }
  }
  return results;
}

async function migrate() {
  if (!process.env.MONGODB_URI) {
    console.error('Set MONGODB_URI in .env first');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Read vault files
  const files = readVaultFiles(VAULT_DIR);
  console.log(`Found ${files.length} files in vault/`);

  // Read metadata
  const metaPath = path.join(VAULT_DIR, '.metadata.json');
  let meta = {};
  if (fs.existsSync(metaPath)) {
    meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    console.log('Found .metadata.json');
  }

  // Import each file
  for (const file of files) {
    const progress = meta.readingProgress?.[file.path];
    await File.findOneAndUpdate(
      { path: file.path },
      {
        content: file.content,
        tags: meta.tags?.[file.path] || [],
        favorite: meta.favorites?.includes(file.path) || false,
        highlights: meta.highlights?.[file.path] || [],
        readingProgress: progress
          ? { scrollPercent: progress.scrollPercent, lastRead: progress.lastRead }
          : { scrollPercent: 0 },
        lastOpened: new Date(),
        updatedAt: file.modified,
      },
      { upsert: true, new: true }
    );
    console.log(`  Migrated: ${file.path}`);
  }

  console.log(`\nDone! Migrated ${files.length} files to MongoDB.`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
