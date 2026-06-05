// src/components/Courses/MaterialTranscriptPanel.jsx
// Functional clone of components/Chat/TranscriptComponent.jsx, retargeted
// at /api/material-chat/transcript/{material_id}. Two tabs (Transcript /
// Timestamps), copy button, clickable timestamp chips that drive
// onSeekToTime. Restyled to the dark/teal course palette (gallery uses
// emerald).
//
// Unlike the gallery — which builds the timestamped view by re-formatting
// the plain transcript via an LLM call — our backend already stores
// Deepgram's per-utterance timing in transcript_json, so we render the
// segments directly. No second roundtrip, no progress bar.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Copy, Loader2 } from 'lucide-react';
import { formatTime } from '../generic/utils.jsx';
import { materialChatApi } from './materialChatApi';

const MaterialTranscriptPanel = ({ materialId, onSeekToTime }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transcriptText, setTranscriptText] = useState('');
  const [segments, setSegments] = useState([]);
  const [transcriptStatus, setTranscriptStatus] = useState(null);
  const [showTimestamped, setShowTimestamped] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const load = useCallback(async () => {
    if (!materialId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await materialChatApi.getTranscript(materialId);
      setTranscriptText(data.transcript_text || '');
      setSegments(Array.isArray(data.segments) ? data.segments : []);
      setTranscriptStatus(data.transcript_status || null);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to load transcript');
    } finally {
      setLoading(false);
    }
  }, [materialId]);

  useEffect(() => { load(); }, [load]);

  const handleTimestampClick = useCallback(
    (totalSeconds) => {
      if (typeof onSeekToTime === 'function') onSeekToTime(totalSeconds);
    },
    [onSeekToTime]
  );

  // Build a "MM:SS - MM:SS" + body view from the timed segments, mirroring
  // the gallery's timestamped layout: each segment is a clickable chip with
  // the body underneath, indented.
  const timestampedView = useMemo(() => {
    if (!segments || segments.length === 0) return null;
    return (
      <div className="space-y-2">
        {segments.map((s, i) => {
          const start = Math.max(0, Math.floor(s.start || 0));
          const end = Math.max(start, Math.floor((s.start || 0) + (s.dur || 0)));
          const startLabel = formatTime(start);
          const endLabel = formatTime(end);
          const label = `${startLabel} - ${endLabel}`;
          return (
            <div key={i} className="mb-2">
              <button
                onClick={() => handleTimestampClick(start)}
                className="text-teal-300 hover:text-teal-200 font-mono text-xs
                           bg-gray-900 hover:bg-gray-800 border border-gray-700
                           hover:border-teal-500/60 px-3 py-1.5 rounded-md
                           transition-colors"
                title={`Jump to ${startLabel}`}
                type="button"
              >
                {label}
              </button>
              <div className="mt-1 ml-3 text-sm text-gray-300 leading-relaxed">
                {s.text}
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [segments, handleTimestampClick]);

  const copyTranscript = async () => {
    const text = showTimestamped
      ? segments
          .map((s) => `${formatTime(Math.floor(s.start || 0))} - ${formatTime(Math.floor((s.start || 0) + (s.dur || 0)))}\n${s.text}`)
          .join('\n\n')
      : transcriptText;
    if (!text) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed'; ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch { /* ignore */ }
        document.body.removeChild(ta);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // ignore copy failures
    }
  };

  const indexing = transcriptStatus === 'processing' || transcriptStatus === 'pending';
  const hasTimestamps = segments.length > 0;
  const hasText = transcriptText && transcriptText.length > 0;

  return (
    <div className="flex flex-col h-full bg-gray-950 border border-gray-800 rounded-xl overflow-hidden">
      {/* Tab + copy bar */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-800 bg-gray-900/30">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTimestamped(false)}
            disabled={!hasText}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors font-medium
                        ${!showTimestamped
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-900 hover:bg-gray-800 text-gray-400 border border-gray-700'}
                        disabled:opacity-40 disabled:cursor-default`}
            type="button"
          >
            Transcript
          </button>
          <button
            onClick={() => setShowTimestamped(true)}
            disabled={!hasTimestamps}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors font-medium
                        ${showTimestamped
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-900 hover:bg-gray-800 text-gray-400 border border-gray-700'}
                        disabled:opacity-40 disabled:cursor-default`}
            type="button"
          >
            Timestamps
          </button>
        </div>
        {(hasText || hasTimestamps) && (
          <button
            onClick={copyTranscript}
            className="text-xs flex items-center px-3 py-1.5 bg-gray-900 hover:bg-gray-800
                       border border-gray-700 hover:border-gray-500 rounded-md
                       text-gray-400 hover:text-white transition-colors"
            type="button"
          >
            <Copy size={12} className="mr-1" />
            {isCopied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 text-sm leading-relaxed">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={18} className="text-teal-400 animate-spin mr-2" />
            <span className="text-gray-500 text-xs">Loading transcript…</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-3">
            <p className="text-gray-400 text-xs mb-3">{error}</p>
            <button
              onClick={load}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs rounded-md transition-colors"
              type="button"
            >
              Retry
            </button>
          </div>
        ) : indexing && !hasText ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-3 gap-2">
            <Loader2 size={20} className="text-teal-400 animate-spin" />
            <p className="text-gray-400 text-xs">Transcribing this video…</p>
          </div>
        ) : showTimestamped ? (
          hasTimestamps ? (
            timestampedView
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-xs italic">No timestamped transcript available.</p>
            </div>
          )
        ) : hasText ? (
          transcriptText.split('\n').map((line, i) => (
            <p key={i} className="mb-2 text-gray-300 leading-relaxed whitespace-pre-wrap">
              {line}
            </p>
          ))
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600 text-xs">No transcript available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialTranscriptPanel;
