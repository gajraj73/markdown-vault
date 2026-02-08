import { useState, useEffect, useRef } from 'react';
import useStore from '../store';
import {
  ChevronRight,
  File,
  Folder,
  FolderOpen,
  MoreVertical,
  Plus,
  Trash2,
  Edit3,
  FolderPlus,
} from 'lucide-react';

export default function FolderTree({ items, depth = 0 }) {
  const { createFile, createFolder } = useStore();
  const [creating, setCreating] = useState(null); // 'file' | 'folder' | null
  const [newName, setNewName] = useState('');

  const handleCreate = () => {
    if (!newName.trim()) {
      setCreating(null);
      setNewName('');
      return;
    }
    if (creating === 'file') {
      const name = newName.endsWith('.md') ? newName : `${newName}.md`;
      createFile(name);
    } else {
      createFolder(newName);
    }
    setCreating(null);
    setNewName('');
  };

  return (
    <div>
      {depth === 0 && (
        <div className="flex items-center gap-1 mb-1">
          <button
            onClick={() => setCreating('file')}
            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1 px-1.5 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="New file in root"
          >
            <Plus size={12} /> File
          </button>
          <button
            onClick={() => setCreating('folder')}
            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1 px-1.5 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="New folder in root"
          >
            <FolderPlus size={12} /> Folder
          </button>
        </div>
      )}

      {creating && depth === 0 && (
        <div className="flex items-center gap-1 py-1 px-1">
          {creating === 'folder' ? <Folder size={14} className="shrink-0 text-yellow-600" /> : <File size={14} className="shrink-0" />}
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') { setCreating(null); setNewName(''); }
            }}
            onBlur={handleCreate}
            className="flex-1 bg-transparent border border-blue-400 rounded px-1.5 py-0.5 text-sm outline-none min-w-0"
            placeholder={creating === 'folder' ? 'folder-name' : 'filename.md'}
          />
        </div>
      )}

      {items.map((item) =>
        item.type === 'folder' ? (
          <FolderNode key={item.path} item={item} depth={depth} />
        ) : (
          <FileNode key={item.path} item={item} depth={depth} />
        )
      )}
    </div>
  );
}

function FolderNode({ item, depth }) {
  const [open, setOpen] = useState(false);
  const { createFile, createFolder } = useStore();
  const [creating, setCreating] = useState(null);
  const [newName, setNewName] = useState('');

  const handleCreate = () => {
    if (!newName.trim()) {
      setCreating(null);
      setNewName('');
      return;
    }
    if (creating === 'file') {
      const name = newName.endsWith('.md') ? newName : `${newName}.md`;
      createFile(`${item.path}/${name}`);
    } else {
      createFolder(`${item.path}/${newName}`);
    }
    setCreating(null);
    setNewName('');
  };

  return (
    <div>
      <div
        className="flex items-center gap-1 px-1 py-1 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer group"
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 flex-1 min-w-0"
        >
          <ChevronRight
            size={14}
            className={`shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
          />
          {open ? (
            <FolderOpen size={14} className="shrink-0 text-yellow-600" />
          ) : (
            <Folder size={14} className="shrink-0 text-yellow-600" />
          )}
          <span className="truncate">{item.name}</span>
        </button>
        <div className="opacity-0 group-hover:opacity-100 flex items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCreating('file');
              setOpen(true);
            }}
            className="p-0.5 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
            title="New file"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCreating('folder');
              setOpen(true);
            }}
            className="p-0.5 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
            title="New subfolder"
          >
            <FolderPlus size={14} />
          </button>
        </div>
      </div>

      {open && (
        <div>
          {creating && (
            <div
              className="flex items-center gap-1 py-1 px-1"
              style={{ paddingLeft: `${(depth + 1) * 16 + 4}px` }}
            >
              {creating === 'folder' ? (
                <Folder size={14} className="shrink-0 text-yellow-600" />
              ) : (
                <File size={14} className="shrink-0" />
              )}
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') { setCreating(null); setNewName(''); }
                }}
                onBlur={handleCreate}
                className="flex-1 bg-transparent border border-blue-400 rounded px-1.5 py-0.5 text-sm outline-none min-w-0"
                placeholder={creating === 'folder' ? 'folder-name' : 'filename.md'}
              />
            </div>
          )}
          <FolderTree items={item.children || []} depth={depth + 1} />
        </div>
      )}
    </div>
  );
}

function FileNode({ item, depth }) {
  const { openFile, currentFile, deleteFile, renameFile } = useStore();
  const [showMenu, setShowMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(item.name);
  const menuRef = useRef(null);

  const isActive = currentFile === item.path;

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const handleRename = () => {
    if (newName.trim() && newName !== item.name) {
      const parentPath = item.path.includes('/')
        ? item.path.substring(0, item.path.lastIndexOf('/'))
        : '';
      const newPath = parentPath ? `${parentPath}/${newName}` : newName;
      renameFile(item.path, newPath);
    }
    setRenaming(false);
  };

  const handleDelete = () => {
    deleteFile(item.path);
    setShowMenu(false);
  };

  if (renaming) {
    return (
      <div
        className="flex items-center gap-1 px-1 py-1"
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        <File size={14} className="shrink-0" />
        <input
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRename();
            if (e.key === 'Escape') {
              setRenaming(false);
              setNewName(item.name);
            }
          }}
          onBlur={handleRename}
          className="flex-1 bg-transparent border border-blue-400 rounded px-1.5 py-0.5 text-sm outline-none min-w-0"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1 px-1 py-1 rounded text-sm cursor-pointer group ${
        isActive
          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'
          : 'hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
      style={{ paddingLeft: `${depth * 16 + 4}px` }}
    >
      <button
        onClick={() => openFile(item.path)}
        className="flex items-center gap-1 flex-1 min-w-0"
      >
        <File size={14} className="shrink-0" />
        <span className="truncate">{item.name}</span>
      </button>
      <div className="relative" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
        >
          <MoreVertical size={14} />
        </button>
        {showMenu && (
          <div className="absolute right-0 top-6 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg shadow-lg z-50 py-1 min-w-[130px]">
            <button
              onClick={() => {
                setRenaming(true);
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Edit3 size={14} /> Rename
            </button>
            <button
              onClick={handleDelete}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
