import { useCallback, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { oneDark } from '@codemirror/theme-one-dark';
import useStore from '../store';

export default function Editor() {
  const { content, setContent, dirty, darkMode, showPreview, currentFile } = useStore();
  const timerRef = useRef(null);

  const handleChange = useCallback(
    (value) => {
      setContent(value);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        useStore.getState().saveFile();
      }, 1000);
    },
    [setContent]
  );

  // Clear timer on file change or unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentFile]);

  return (
    <div
      className={`flex-1 flex flex-col overflow-hidden ${
        showPreview ? 'border-r border-gray-200 dark:border-gray-700' : ''
      }`}
    >
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-500">
        <span>Editor</span>
        {dirty && <span className="text-yellow-600 dark:text-yellow-400">Unsaved</span>}
      </div>
      <div className="flex-1 overflow-hidden">
        <CodeMirror
          value={content}
          onChange={handleChange}
          extensions={[
            markdown({ base: markdownLanguage, codeLanguages: languages }),
          ]}
          theme={darkMode ? oneDark : 'light'}
          className="h-full"
          height="100%"
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: true,
            bracketMatching: true,
            closeBrackets: true,
            indentOnInput: true,
          }}
        />
      </div>
    </div>
  );
}
