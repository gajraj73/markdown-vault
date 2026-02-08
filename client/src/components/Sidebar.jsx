import { useState } from 'react';
import useStore from '../store';
import FolderTree from './FolderTree';
import { FolderTree as FolderIcon, Star, Clock, Tag, ChevronRight, BookOpen } from 'lucide-react';

export default function Sidebar() {
  const { sidebarTab, setSidebarTab, metadata, tree, openFile, currentFile, continueReading, openReader } = useStore();

  const tabs = [
    { id: 'files', icon: FolderIcon, label: 'Files' },
    { id: 'reading', icon: BookOpen, label: 'Reading' },
    { id: 'favorites', icon: Star, label: 'Starred' },
    { id: 'recent', icon: Clock, label: 'Recent' },
    { id: 'tags', icon: Tag, label: 'Tags' },
  ];

  return (
    <div className="w-64 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-900 shrink-0">
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSidebarTab(tab.id)}
            className={`flex-1 p-2 text-xs flex flex-col items-center gap-1 transition-colors ${
              sidebarTab === tab.id
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            title={tab.label}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {sidebarTab === 'files' && <FolderTree items={tree} />}
        {sidebarTab === 'reading' && (
          <ContinueReadingView items={continueReading} onRead={openReader} />
        )}
        {sidebarTab === 'favorites' && (
          <FileList
            files={metadata.favorites || []}
            onSelect={openFile}
            currentFile={currentFile}
            emptyText="No favorites yet. Star a file to see it here."
          />
        )}
        {sidebarTab === 'recent' && (
          <FileList
            files={metadata.recent || []}
            onSelect={openFile}
            currentFile={currentFile}
            emptyText="No recent files."
          />
        )}
        {sidebarTab === 'tags' && <TagsView />}
      </div>
    </div>
  );
}

function FileList({ files, onSelect, currentFile, emptyText }) {
  if (files.length === 0) {
    return <p className="text-gray-400 text-sm text-center mt-8 px-4">{emptyText}</p>;
  }
  return (
    <div className="space-y-0.5">
      {files.map((filePath) => (
        <button
          key={filePath}
          onClick={() => onSelect(filePath)}
          className={`w-full text-left px-2 py-1.5 rounded text-sm truncate ${
            currentFile === filePath
              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title={filePath}
        >
          {filePath.split('/').pop()}
        </button>
      ))}
    </div>
  );
}

function ContinueReadingView({ items, onRead }) {
  if (!items || items.length === 0) {
    return (
      <p className="text-gray-400 text-sm text-center mt-8 px-4">
        No reading in progress. Open a file in reader mode to track your progress.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {items.map((item) => {
        const name = item.path.split('/').pop().replace(/\.md$/, '');
        const percent = Math.round((item.scrollPercent || 0) * 100);
        return (
          <button
            key={item.path}
            onClick={() => onRead(item.path)}
            className="w-full text-left px-2 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm">
              <BookOpen size={14} className="shrink-0 text-blue-500" />
              <span className="truncate font-medium">{name}</span>
            </div>
            <div className="mt-1.5 ml-[22px]">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 w-8 text-right">{percent}%</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function TagsView() {
  const { metadata, openFile, currentFile } = useStore();
  const [expandedTag, setExpandedTag] = useState(null);

  const tagMap = {};
  for (const [file, tags] of Object.entries(metadata.tags || {})) {
    for (const tag of tags) {
      if (!tagMap[tag]) tagMap[tag] = [];
      tagMap[tag].push(file);
    }
  }

  const tagNames = Object.keys(tagMap).sort();

  if (tagNames.length === 0) {
    return <p className="text-gray-400 text-sm text-center mt-8 px-4">No tags yet. Add tags to files from the top bar.</p>;
  }

  return (
    <div className="space-y-0.5">
      {tagNames.map((tag) => (
        <div key={tag}>
          <button
            onClick={() => setExpandedTag(expandedTag === tag ? null : tag)}
            className="w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-1.5 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <ChevronRight
              size={14}
              className={`shrink-0 transition-transform ${expandedTag === tag ? 'rotate-90' : ''}`}
            />
            <Tag size={14} className="shrink-0 text-blue-500" />
            <span className="truncate">{tag}</span>
            <span className="ml-auto text-gray-400 text-xs">{tagMap[tag].length}</span>
          </button>
          {expandedTag === tag && (
            <div className="ml-5">
              <FileList
                files={tagMap[tag]}
                onSelect={openFile}
                currentFile={currentFile}
                emptyText=""
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
