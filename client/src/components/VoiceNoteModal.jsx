import { useState, useEffect, useRef, useCallback } from 'react';
import useStore from '../store';
import { Mic, Square, X, Loader2, Save, Trash2, FileText, AlertCircle } from 'lucide-react';

const STEP = { READY: 'ready', RECORDING: 'recording', STRUCTURING: 'structuring', PREVIEW: 'preview' };

export default function VoiceNoteModal() {
  const {
    closeVoiceNote,
    structureVoiceNote,
    saveVoiceNote,
    voiceNoteResult,
  } = useStore();

  const [step, setStep] = useState(STEP.READY);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');
  const [editedContent, setEditedContent] = useState('');

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const transcriptRef = useRef('');
  const interimRef = useRef('');
  const stepRef = useRef(STEP.READY);
  const accumulatedRef = useRef('');

  // Keep refs in sync
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
  useEffect(() => { interimRef.current = interimText; }, [interimText]);
  useEffect(() => { stepRef.current = step; }, [step]);

  // Check browser support
  const browserSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const formatTime = (s) => {
    const min = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  // Request mic permission via getUserMedia first (shows Chrome permission dialog),
  // then start SpeechRecognition after permission is granted.
  const handleStartRecording = async () => {
    setError(null);

    // Step 1: Request mic permission — this triggers Chrome's permission prompt
    let micStream;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      setError('Microphone access denied. Please allow microphone permission and try again.');
      return;
    }

    // Stop the getUserMedia stream — SpeechRecognition manages its own audio
    micStream.getTracks().forEach(track => track.stop());

    // Step 2: Now start SpeechRecognition (permission already granted)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let sessionFinal = '';
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          sessionFinal += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setTranscript(accumulatedRef.current + sessionFinal);
      setInterimText(interim);
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') return;
      if (event.error === 'aborted') return;
      setError(`Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      accumulatedRef.current = transcriptRef.current;
      if (stepRef.current === STEP.RECORDING && recognitionRef.current) {
        try { recognition.start(); } catch {}
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setStep(STEP.RECORDING);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch (err) {
      setError('Could not start speech recognition. Please try again.');
    }
  };

  const handleStop = useCallback(async () => {
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    try { rec?.stop(); } catch {}
    clearInterval(timerRef.current);

    const fullTranscript = (transcriptRef.current + interimRef.current).trim();
    if (!fullTranscript) {
      setError('No speech detected. Please try again.');
      setStep(STEP.READY);
      return;
    }

    setTranscript(fullTranscript);
    setInterimText('');
    setStep(STEP.STRUCTURING);

    try {
      await structureVoiceNote(fullTranscript);
    } catch (err) {
      setError(`Failed to structure note: ${err.message}`);
      setStep(STEP.READY);
    }
  }, [structureVoiceNote]);

  // When result arrives, move to preview
  useEffect(() => {
    if (voiceNoteResult) {
      setStep(STEP.PREVIEW);
      setFileName(
        voiceNoteResult.title
          .replace(/[^a-zA-Z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-')
          .toLowerCase()
      );
      setEditedContent(voiceNoteResult.content);
    }
  }, [voiceNoteResult]);

  const handleSave = async () => {
    const path = fileName.endsWith('.md') ? fileName : `${fileName}.md`;

    let finalContent = editedContent;
    if (voiceNoteResult.relatedNotes?.length > 0) {
      finalContent += '\n\n---\n\n## Related Notes\n\n';
      for (const note of voiceNoteResult.relatedNotes) {
        const name = note.filePath.replace(/\.md$/, '');
        finalContent += `- [[${name}]]\n`;
      }
    }

    await saveVoiceNote(path, finalContent);
  };

  const handleCancel = () => {
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    try { rec?.stop(); } catch {}
    clearInterval(timerRef.current);
    closeVoiceNote();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current = null;
      clearInterval(timerRef.current);
    };
  }, []);

  if (!browserSupported) {
    return (
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
        onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-yellow-500" />
          <h2 className="text-lg font-semibold mb-2">Browser Not Supported</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Voice recording requires Chrome or Edge browser.
          </p>
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Mic
              size={16}
              className={step === STEP.RECORDING ? 'text-red-500 animate-pulse' : ''}
            />
            {step === STEP.READY && 'Voice Brain Dump'}
            {step === STEP.RECORDING && 'Recording...'}
            {step === STEP.STRUCTURING && 'Structuring note...'}
            {step === STEP.PREVIEW && 'Preview'}
          </h2>
          <div className="flex items-center gap-3">
            {step === STEP.RECORDING && (
              <span className="text-xs text-gray-400 font-mono">{formatTime(seconds)}</span>
            )}
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded">
              {error}
            </div>
          )}

          {/* READY — waiting for user to click start */}
          {step === STEP.READY && (
            <div className="text-center py-6">
              <button
                onClick={handleStartRecording}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors shadow-lg hover:shadow-xl"
              >
                <Mic size={32} />
              </button>
              <p className="text-sm text-gray-500 mt-4">Tap to start recording</p>
              <p className="text-xs text-gray-400 mt-1">Speak freely — AI will structure your notes</p>
            </div>
          )}

          {/* RECORDING */}
          {step === STEP.RECORDING && (
            <div>
              <div className="min-h-[120px] p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm whitespace-pre-wrap">
                {transcript}
                <span className="text-gray-400">{interimText}</span>
                {!transcript && !interimText && (
                  <span className="text-gray-400 italic">Listening...</span>
                )}
              </div>
              <div className="flex justify-center gap-3 mt-4">
                <button
                  onClick={handleStop}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                >
                  <Square size={14} />
                  Stop Recording
                </button>
              </div>
            </div>
          )}

          {/* STRUCTURING */}
          {step === STEP.STRUCTURING && (
            <div className="text-center py-8">
              <Loader2 size={32} className="mx-auto mb-3 animate-spin text-blue-500" />
              <p className="text-sm text-gray-500">Structuring your brain dump with AI...</p>
              <p className="text-xs text-gray-400 mt-1">Finding related notes in your vault...</p>
            </div>
          )}

          {/* PREVIEW */}
          {step === STEP.PREVIEW && voiceNoteResult && (
            <div>
              <div className="mb-3">
                <label className="text-xs text-gray-500 block mb-1">Filename</label>
                <div className="flex items-center gap-1">
                  <input
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-600 outline-none focus:border-blue-400"
                    placeholder="note-title"
                  />
                  <span className="text-xs text-gray-400">.md</span>
                </div>
              </div>

              <div className="mb-3">
                <label className="text-xs text-gray-500 block mb-1">Structured Note</label>
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-600 outline-none focus:border-blue-400 font-mono resize-y"
                />
              </div>

              {voiceNoteResult.relatedNotes?.length > 0 && (
                <div className="mb-3">
                  <label className="text-xs text-gray-500 block mb-1">Related Notes</label>
                  <div className="space-y-1">
                    {voiceNoteResult.relatedNotes.map((note) => (
                      <div
                        key={note.filePath}
                        className="flex items-center gap-2 px-2 py-1 bg-gray-50 dark:bg-gray-900 rounded text-xs"
                      >
                        <FileText size={12} className="text-gray-400 shrink-0" />
                        <span className="truncate">{note.filePath}</span>
                        <span className="ml-auto text-gray-400 shrink-0">
                          {Math.round(note.score * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={!fileName.trim()}
                  className="flex items-center gap-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Save size={14} />
                  Save to Vault
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
