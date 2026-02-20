import { useState, useRef, useEffect } from 'react';
import useStore from '../store';
import { Send, RefreshCw, MessageCircle, FileText, Trash2 } from 'lucide-react';

export default function ChatPanel() {
  const {
    chatMessages,
    chatLoading,
    indexStatus,
    indexing,
    sendChatMessage,
    clearChat,
    loadIndexStatus,
    startIndexing,
    openFile,
  } = useStore();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadIndexStatus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  const handleSend = () => {
    if (!input.trim() || chatLoading) return;
    sendChatMessage(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-full -m-2">
      {/* Index Status */}
      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            {indexStatus
              ? `${indexStatus.indexedFiles}/${indexStatus.totalFiles} files (${indexStatus.totalChunks} chunks)`
              : 'Loading...'}
          </span>
          <button
            onClick={startIndexing}
            disabled={indexing}
            className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded text-xs hover:bg-blue-200 dark:hover:bg-blue-900 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={12} className={indexing ? 'animate-spin' : ''} />
            {indexing ? 'Indexing...' : 'Index Vault'}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {chatMessages.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-8 px-4">
            <MessageCircle size={24} className="mx-auto mb-2 opacity-50" />
            <p>Ask anything about your vault</p>
            <p className="text-xs mt-1">Make sure to index your vault first</p>
          </div>
        )}

        {chatMessages.map((msg, i) => (
          <div key={i} className={`text-sm ${msg.role === 'user' ? 'text-right' : ''}`}>
            <div
              className={`inline-block px-3 py-2 rounded-lg max-w-[90%] text-left ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sources:</p>
                  {msg.sources.map((src, j) => (
                    <button
                      key={j}
                      onClick={() => openFile(src.filePath)}
                      className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <FileText size={10} />
                      {src.filePath}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {chatLoading && (
          <div className="text-sm">
            <div className="inline-block px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-1">
          {chatMessages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Clear chat"
            >
              <Trash2 size={16} />
            </button>
          )}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about your notes..."
            className="flex-1 px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 outline-none focus:border-blue-400 transition-colors"
            disabled={chatLoading}
          />
          <button
            onClick={handleSend}
            disabled={chatLoading || !input.trim()}
            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg disabled:opacity-30 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
