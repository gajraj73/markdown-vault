require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db');
const fileRoutes = require('./routes/files');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api', fileRoutes);

// Serve client build in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Connect to DB then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Markdown Vault server running on port ${PORT}`);
  });
});
