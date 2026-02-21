import { useEffect, useRef, useState, useId } from 'react';
import mermaid from 'mermaid';

let renderCounter = 0;

export default function MermaidDiagram({ code, isDark }) {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);
  const uniqueId = useId().replace(/:/g, '-');

  useEffect(() => {
    if (!code || !containerRef.current) return;

    // Always re-initialize before each render to ensure theme is applied
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      securityLevel: 'strict',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    });

    const id = `mermaid-${uniqueId}-${++renderCounter}`;
    let cancelled = false;

    (async () => {
      try {
        const { svg } = await mermaid.render(id, code);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Invalid diagram syntax');
          if (containerRef.current) {
            containerRef.current.innerHTML = '';
          }
        }
        document.getElementById('d' + id)?.remove();
      }
    })();

    return () => { cancelled = true; };
  }, [code, isDark, uniqueId]);

  if (error) {
    return (
      <div className="my-4 border border-red-300 dark:border-red-700 rounded-lg overflow-hidden">
        <div className="px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs">
          Diagram error: {error}
        </div>
        <pre className="p-3 text-xs overflow-x-auto bg-gray-50 dark:bg-gray-900">{code}</pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-4 flex justify-center [&>svg]:max-w-full"
    />
  );
}
