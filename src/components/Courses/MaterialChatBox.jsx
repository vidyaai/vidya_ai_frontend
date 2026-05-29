// src/components/Courses/MaterialChatBox.jsx
// Embeddable chat panel for a single CourseMaterial. Lives inside a flex
// column (no overlay/drawer chrome) so it can sit beside a video player or
// PDF viewer. AI-emitted MM:SS timestamps are clickable when onSeekToTime
// is provided; citation chips dispatch to onJumpToPage (PDFs) or
// onSeekToTime (videos) depending on which field the citation carries.
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles,
  Send,
  FileText,
  Video as VideoIcon,
  Plus,
  MessageSquare,
  Trash2,
  Loader2,
  AlertCircle,
  BookOpen,
  Brain,
  ScrollText,
} from 'lucide-react';
import { parseMarkdownWithMath, formatTime } from '../generic/utils.jsx';
import { materialChatApi } from './materialChatApi';
import MaterialQuizPanel from './MaterialQuizPanel';
import MaterialSummaryPanel from './MaterialSummaryPanel';

// ── Suggested-prompt copy by material type ──────────────────────────────
// "Quiz me" is intentionally absent — quizzes go through the dedicated
// MaterialQuizPanel surfaced from the chat header instead of being a
// free-text chat prompt that returns unstructured questions.
const SUGGESTIONS_PDF = [
  'Summarize the key concepts in plain English.',
  'Explain page 2 like I have never seen it.',
  'What is the most important takeaway from this document?',
];
const SUGGESTIONS_VIDEO = [
  'Give me a 5-bullet summary of this lecture.',
  'What is the most important takeaway?',
  'Walk me through the first key concept the professor introduces.',
];

// ── Citation chip ───────────────────────────────────────────────────────
const CitationChip = ({ citation, materialType, onSeekToTime, onJumpToPage }) => {
  let label = null;
  let handler = null;
  if (citation.page_number != null) {
    label = `Page ${citation.page_number}`;
    handler = () => onJumpToPage && onJumpToPage(citation.page_number);
  } else if (citation.start_seconds != null) {
    label = formatTime(Math.floor(citation.start_seconds));
    handler = () => onSeekToTime && onSeekToTime(citation.start_seconds);
  } else if (citation.chunk_index != null) {
    label = `#${citation.chunk_index}`;
  }
  if (!label) return null;
  const Icon = materialType === 'video' ? VideoIcon : FileText;
  return (
    <button
      onClick={handler || undefined}
      disabled={!handler}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                 bg-gray-900 border border-gray-700 hover:border-teal-500/60
                 text-[11px] text-gray-300 hover:text-teal-300
                 disabled:hover:border-gray-700 disabled:hover:text-gray-300
                 disabled:cursor-default transition-colors"
      type="button"
    >
      <Icon size={10} className="text-teal-400/70" />
      {label}
    </button>
  );
};

// ── Three teal dots that pulse while we wait for the first token ────────
const ThinkingDots = () => (
  <div className="flex items-center gap-1.5 py-1">
    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" style={{ animationDelay: '0ms' }} />
    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" style={{ animationDelay: '150ms' }} />
    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" style={{ animationDelay: '300ms' }} />
  </div>
);

// ── A single message row ────────────────────────────────────────────────
const MessageRow = ({ msg, materialType, onSeekToTime, onJumpToPage }) => {
  const isUser = msg.role === 'user';
  const isError = msg.role === 'error';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] px-3.5 py-2 rounded-2xl rounded-br-md
                        bg-teal-600/15 border border-teal-500/30
                        text-sm text-teal-50 leading-relaxed whitespace-pre-wrap">
          {msg.content}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-start gap-2 text-xs text-red-300/90">
        <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
        <span>{msg.content}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-2.5">
        <div className="flex-shrink-0 w-6 h-6 rounded-md bg-gradient-to-br from-teal-500/30 to-teal-700/30
                        border border-teal-500/40 flex items-center justify-center mt-0.5">
          <Sparkles size={12} className="text-teal-300" />
        </div>
        <div className="min-w-0 flex-1 text-sm text-gray-100 leading-relaxed">
          {msg.content
            ? parseMarkdownWithMath(msg.content, onSeekToTime)
            : <ThinkingDots />}
        </div>
      </div>
      {msg.citations && msg.citations.length > 0 && (
        <div className="flex flex-wrap gap-1.5 ml-8">
          {msg.citations.map((c, i) => (
            <CitationChip
              key={`${c.chunk_index ?? i}-${i}`}
              citation={c}
              materialType={materialType}
              onSeekToTime={onSeekToTime}
              onJumpToPage={onJumpToPage}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main embeddable chat box ────────────────────────────────────────────
const MaterialChatBox = ({ material, onSeekToTime, onJumpToPage }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const scrollerRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const materialType = material?.material_type;
  const isVideo = materialType === 'video';

  // ── Indexing / transcription gate ────────────────────────────────────
  const indexingState = useMemo(() => {
    if (!material) return null;
    if (isVideo) {
      const s = (material.transcript_status || '').toLowerCase();
      if (s === 'pending' || s === 'processing') {
        return { label: 'Transcribing this video', detail: 'Hang tight — this usually takes a few minutes.' };
      }
      if (s === 'failed') {
        return { label: 'Transcription failed', detail: 'Re-upload the video to enable chat.' };
      }
    } else {
      const s = (material.chunking_status || '').toLowerCase();
      if (s === 'pending' || s === 'processing') {
        return { label: 'Indexing your notes', detail: 'Almost there — give it a minute and refresh.' };
      }
      if (s === 'failed') {
        return { label: 'Couldn’t index this document', detail: 'Try re-uploading the PDF.' };
      }
    }
    return null;
  }, [material, isVideo]);

  // ── Load existing sessions when the panel mounts ─────────────────────
  useEffect(() => {
    if (!material?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await materialChatApi.listSessions(material.id);
        if (cancelled) return;
        setSessions(rows);
        if (rows.length > 0 && !activeSessionId) {
          await loadSession(rows[0].id);
        }
      } catch (e) {
        // 403/404 surface via the indexingState gate; everything else is soft
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material?.id]);

  // ── Cancel any in-flight stream on unmount ───────────────────────────
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  // ── Scroll to bottom on new content ──────────────────────────────────
  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages]);

  const loadSession = async (sessionId) => {
    try {
      setLoadingHistory(true);
      const rows = await materialChatApi.listMessages(sessionId);
      const normalized = rows.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        citations: m.citations || [],
      }));
      setMessages(normalized);
      setActiveSessionId(sessionId);
      setSessionsOpen(false);
    } catch (e) {
      // Stay on whatever was there before
    } finally {
      setLoadingHistory(false);
    }
  };

  const startNewChat = () => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setActiveSessionId(null);
    setSessionsOpen(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const deleteSession = async (e, sessionId) => {
    e.stopPropagation();
    try {
      await materialChatApi.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (sessionId === activeSessionId) {
        setMessages([]);
        setActiveSessionId(null);
      }
    } catch {
      // ignore
    }
  };

  const submit = async (queryText) => {
    const trimmed = (queryText ?? input).trim();
    if (!trimmed || isStreaming) return;

    setInput('');
    const userTurn = { id: `u-${Date.now()}`, role: 'user', content: trimmed };
    const assistantId = `a-${Date.now() + 1}`;
    const assistantTurn = { id: assistantId, role: 'assistant', content: '', citations: [] };
    setMessages((prev) => [...prev, userTurn, assistantTurn]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let citations = [];
      let resolvedSessionId = activeSessionId;
      let accumulated = '';

      for await (const evt of materialChatApi.streamQuery(
        material.id,
        trimmed,
        activeSessionId,
        controller.signal
      )) {
        if (evt.type === 'metadata') {
          citations = evt.data?.citations || [];
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, citations } : m))
          );
        } else if (evt.type === 'content') {
          accumulated += evt.data || '';
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: accumulated } : m
            )
          );
        } else if (evt.type === 'session') {
          if (evt.data?.session_id) {
            resolvedSessionId = evt.data.session_id;
          }
        } else if (evt.type === 'error') {
          throw new Error(evt.data || 'Stream error');
        }
      }

      if (resolvedSessionId && resolvedSessionId !== activeSessionId) {
        setActiveSessionId(resolvedSessionId);
        try {
          const rows = await materialChatApi.listSessions(material.id);
          setSessions(rows);
        } catch {
          /* ignore */
        }
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== assistantId),
          {
            id: `err-${Date.now()}`,
            role: 'error',
            content: err?.message || 'Something went wrong streaming the response.',
          },
        ]);
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const HeaderIcon = isVideo ? VideoIcon : FileText;
  const suggestions = isVideo ? SUGGESTIONS_VIDEO : SUGGESTIONS_PDF;

  return (
    <div className="flex flex-col h-full bg-gray-950 border border-gray-800 rounded-xl overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 px-4 py-3 border-b border-gray-800/80 bg-gradient-to-b from-gray-900/60 to-transparent">
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                        ${isVideo
                          ? 'bg-purple-500/15 border border-purple-500/30'
                          : 'bg-blue-500/15 border border-blue-500/30'}`}>
          <HeaderIcon size={14} className={isVideo ? 'text-purple-300' : 'text-blue-300'} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-teal-400/80">
            <Sparkles size={10} />
            <span>Chat with {isVideo ? 'video' : 'notes'}</span>
          </div>
          <p className="text-sm text-white font-medium truncate mt-0.5">{material?.title || 'Material'}</p>
        </div>
      </div>

      {/* ── Session bar ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-800/80 bg-gray-900/30">
        <button
          onClick={() => { setQuizOpen(false); setSummaryOpen(false); startNewChat(); }}
          disabled={isStreaming}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md
                     bg-teal-600/15 border border-teal-500/40 text-teal-300 hover:bg-teal-600/25
                     text-xs font-medium transition-colors disabled:opacity-40"
          type="button"
        >
          <Plus size={12} />
          New chat
        </button>
        <button
          onClick={() => { setQuizOpen(false); setSummaryOpen(false); setSessionsOpen((v) => !v); }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md
                     border border-gray-700 text-gray-300 hover:border-gray-500
                     text-xs font-medium transition-colors"
          type="button"
        >
          <MessageSquare size={12} />
          History
          {sessions.length > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 text-[10px]">
              {sessions.length}
            </span>
          )}
        </button>
        <button
          onClick={() => { setSessionsOpen(false); setSummaryOpen(false); setQuizOpen((v) => !v); }}
          disabled={!!indexingState}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors
                     ${quizOpen
                       ? 'bg-teal-600/25 border border-teal-500/60 text-teal-200'
                       : 'border border-gray-700 text-gray-300 hover:border-gray-500'}
                     disabled:opacity-40 disabled:hover:border-gray-700`}
          type="button"
          title="Take a quick MCQ quiz on this material"
        >
          <Brain size={12} />
          {quizOpen ? 'Back to chat' : 'Quiz'}
        </button>
        <button
          onClick={() => { setSessionsOpen(false); setQuizOpen(false); setSummaryOpen((v) => !v); }}
          disabled={!!indexingState}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors
                     ${summaryOpen
                       ? 'bg-teal-600/25 border border-teal-500/60 text-teal-200'
                       : 'border border-gray-700 text-gray-300 hover:border-gray-500'}
                     disabled:opacity-40 disabled:hover:border-gray-700`}
          type="button"
          title="Generate a structured summary of this material"
        >
          <ScrollText size={12} />
          {summaryOpen ? 'Back to chat' : 'Summarize'}
        </button>
        {activeSessionId && !quizOpen && !summaryOpen && (
          <span className="ml-auto text-[11px] text-gray-500 truncate max-w-[160px]">
            {sessions.find((s) => s.id === activeSessionId)?.title || 'Current chat'}
          </span>
        )}
      </div>

      {/* History dropdown */}
      {sessionsOpen && (
        <div className="border-b border-gray-800 max-h-56 overflow-y-auto bg-gray-900/40">
          {sessions.length === 0 ? (
            <div className="px-4 py-4 text-xs text-gray-500">No previous chats yet.</div>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => loadSession(s.id)}
                className={`w-full text-left flex items-center justify-between
                            px-4 py-2.5 transition-colors
                            ${s.id === activeSessionId
                              ? 'bg-teal-600/10 text-teal-200'
                              : 'hover:bg-gray-800/60 text-gray-300'}`}
              >
                <span className="text-xs truncate flex-1">{s.title || 'Untitled chat'}</span>
                <span
                  onClick={(e) => deleteSession(e, s.id)}
                  className="ml-2 p-1 text-gray-600 hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={12} />
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      {quizOpen ? (
        <div className="flex-1 min-h-0">
          <MaterialQuizPanel
            isOpen={quizOpen}
            materialId={material?.id}
            onClose={() => setQuizOpen(false)}
          />
        </div>
      ) : summaryOpen ? (
        <div className="flex-1 min-h-0">
          <MaterialSummaryPanel
            isOpen={summaryOpen}
            material={material}
            onClose={() => setSummaryOpen(false)}
          />
        </div>
      ) : (
      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {indexingState ? (
          <div className="flex flex-col items-center justify-center text-center py-12 px-4">
            <div className="w-14 h-14 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mb-4">
              <Loader2 size={22} className="text-teal-400 animate-spin" />
            </div>
            <h3 className="text-sm font-medium text-white">{indexingState.label}</h3>
            <p className="text-xs text-gray-500 mt-1.5 max-w-xs">{indexingState.detail}</p>
          </div>
        ) : loadingHistory ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="text-teal-400 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center text-center pt-6 pb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/15 to-teal-700/15
                            border border-teal-500/30 flex items-center justify-center mb-3">
              <BookOpen size={20} className="text-teal-300" />
            </div>
            <h3 className="text-sm font-medium text-white">
              Ask anything about this {isVideo ? 'lecture' : 'document'}
            </h3>
            <p className="text-xs text-gray-500 mt-1.5 mb-5 max-w-xs">
              Grounded answers with {isVideo ? 'timestamped' : 'page-numbered'} citations from your material.
            </p>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => submit(s)}
                  className="text-left text-xs text-gray-300 px-3 py-2 rounded-lg
                             bg-gray-900 border border-gray-800 hover:border-teal-500/40
                             hover:text-teal-200 transition-colors"
                  type="button"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <MessageRow
              key={m.id}
              msg={m}
              materialType={materialType}
              onSeekToTime={onSeekToTime}
              onJumpToPage={onJumpToPage}
            />
          ))
        )}
      </div>
      )}

      {/* ── Composer ─────────────────────────────────────────────────────── */}
      {!quizOpen && !summaryOpen && (
      <div className="border-t border-gray-800 bg-gray-900/40 px-3 py-3">
        <form
          onSubmit={(e) => { e.preventDefault(); submit(); }}
          className="flex items-end gap-2"
        >
          <div className="flex-1 rounded-xl bg-gray-900 border border-gray-700
                          focus-within:border-teal-500/60 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder={
                indexingState
                  ? 'Available once indexing finishes…'
                  : isVideo
                  ? 'Ask about this lecture…'
                  : 'Ask about this document…'
              }
              disabled={!!indexingState || isStreaming}
              rows={1}
              className="block w-full resize-none bg-transparent px-3.5 py-2.5
                         text-sm text-white placeholder-gray-500
                         focus:outline-none disabled:opacity-50
                         max-h-32"
              style={{ minHeight: 40 }}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || !!indexingState || isStreaming}
            className="flex-shrink-0 w-10 h-10 rounded-xl
                       bg-teal-600 hover:bg-teal-500 active:bg-teal-700
                       disabled:bg-gray-800 disabled:text-gray-600
                       text-white flex items-center justify-center
                       transition-colors"
            title="Send"
          >
            {isStreaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
        <p className="mt-1.5 text-[10px] text-gray-600 px-1">
          Press <span className="text-gray-500">Enter</span> to send, <span className="text-gray-500">Shift+Enter</span> for newline.
        </p>
      </div>
      )}
    </div>
  );
};

export default MaterialChatBox;
