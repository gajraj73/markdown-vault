import { HIGHLIGHT_COLORS } from '../utils/highlights';
import { Trash2, Workflow, Loader2 } from 'lucide-react';

export default function HighlightPopup({ position, mode, onSelectColor, onRemove, onClose, onGenerateDiagram, diagramLoading }) {
  if (!position) return null;

  return (
    <>
      <div className="fixed inset-0 z-[199]" onClick={onClose} />
      <div
        className="fixed z-[200] flex items-center gap-1.5 rounded-full shadow-xl px-3 py-2"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -100%)',
          marginTop: -8,
          backgroundColor: 'rgba(24, 24, 27, 0.95)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {mode === 'add' ? (
          <>
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.name}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectColor(c.bg);
                }}
                className="w-7 h-7 rounded-full border-2 border-gray-600 hover:scale-125 hover:border-white transition-all"
                style={{ backgroundColor: c.dot }}
                title={c.name}
              />
            ))}
            {onGenerateDiagram && (
              <>
                <div className="w-px h-5 bg-gray-600 mx-0.5" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onGenerateDiagram();
                  }}
                  disabled={diagramLoading}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-blue-400 hover:text-blue-300 hover:scale-125 transition-all disabled:opacity-50"
                  title="Generate diagram from selection"
                >
                  {diagramLoading ? <Loader2 size={16} className="animate-spin" /> : <Workflow size={16} />}
                </button>
              </>
            )}
          </>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="flex items-center gap-1.5 px-2 py-0.5 text-red-400 hover:text-red-300 text-sm transition-colors"
          >
            <Trash2 size={14} />
            <span>Remove</span>
          </button>
        )}
      </div>
    </>
  );
}
