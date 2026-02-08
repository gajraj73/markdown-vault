# Markdown Vault

A personal Markdown file manager and reader with a clean, dark-themed interface. Create, edit, organize, and read your Markdown files with features like syntax highlighting, text highlighting, favorites, tags, reading progress tracking, and full-text search.

**Live Demo:** [markdown-vault-eight.vercel.app](https://markdown-vault-eight.vercel.app)

## Features

- **Markdown Editor** - CodeMirror-based editor with syntax highlighting and live preview (split view)
- **Reader Mode** - Distraction-free full-screen reading with progress tracking
- **Text Highlighting** - Select text in preview/reader mode to highlight it with multiple colors
- **Favorites & Tags** - Star important files and organize with tags
- **Full-Text Search** - Search across all files by name and content (Cmd+P)
- **File Management** - Create, rename, delete, and organize files into folders
- **Drag & Drop Upload** - Drag `.md` files into the app to import them
- **Reading Progress** - Tracks how far you've read in each file
- **Continue Reading** - Quickly resume where you left off
- **PWA Support** - Install on mobile/desktop as a standalone app
- **Dark Theme** - Easy on the eyes, built for focused reading and writing

## Tech Stack

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- CodeMirror 6 (editor)
- react-markdown + remark-gfm + rehype-highlight (rendering)
- Zustand (state management)
- Lucide React (icons)
- Workbox (PWA/service worker)

**Backend:**
- Node.js + Express
- MongoDB Atlas + Mongoose
- Multer (file uploads)

**Deployment:**
- Vercel (serverless functions + static hosting)

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier works) or local MongoDB instance

### Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/gajraj73/markdown-vault.git
   cd markdown-vault
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure environment**

   Create a `.env` file in the root:
   ```
   MONGODB_URI=your_mongodb_connection_string
   PORT=3001
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   This starts both the backend (port 3001) and frontend (port 5173) concurrently.

5. **Open** [http://localhost:5173](http://localhost:5173)

### Production Build

```bash
npm run build
npm start
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+P` | Open search |
| `Cmd+S` | Save current file |
| `Cmd+E` | Toggle editor/preview |
| `Cmd+R` | Open reader mode |
| `Esc` | Close reader/search |

## Project Structure

```
markdown-vault/
  api/              # Vercel serverless function entry
  client/           # React frontend
    src/
      components/   # UI components (Editor, Preview, Reader, Sidebar, etc.)
      store.js      # Zustand state management
      api.js        # API client
  server/           # Express backend
    models/         # Mongoose schemas
    routes/         # API routes
  vercel.json       # Vercel deployment config
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tree` | Get file tree |
| GET | `/api/file?path=` | Get file content |
| PUT | `/api/file` | Create/update file |
| DELETE | `/api/file?path=` | Delete file |
| POST | `/api/rename` | Rename file |
| POST | `/api/upload` | Upload .md files |
| GET | `/api/search?q=` | Full-text search |
| GET | `/api/metadata?path=` | Get file metadata |
| PUT | `/api/metadata/favorite` | Toggle favorite |
| PUT | `/api/metadata/tags` | Update tags |
| PUT | `/api/metadata/highlights` | Save highlights |
| PUT | `/api/metadata/progress` | Save reading progress |
| GET | `/api/metadata/continue-reading` | Get recent files to continue |

## License

MIT
