const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const fileRoutes = require('./routes/files');

const app = express();
const PORT = 3001;
const VAULT_DIR = path.join(__dirname, '..', 'vault');

if (!fs.existsSync(VAULT_DIR)) {
  fs.mkdirSync(VAULT_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  req.vaultDir = VAULT_DIR;
  next();
});

app.use('/api', fileRoutes);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Markdown Vault server running at http://localhost:${PORT}`);
});
