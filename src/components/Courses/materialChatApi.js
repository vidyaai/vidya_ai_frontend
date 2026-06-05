// src/components/Courses/materialChatApi.js
// API client for per-CourseMaterial chat (lecture notes + course videos).
// Mirrors the conventions in courseApi.js: shared `api` axios instance with
// Firebase ID token attached automatically by the request interceptor in
// generic/utils.jsx, plus the ngrok-skip-browser-warning header.
import { api, auth } from '../generic/utils.jsx';

const HEADERS = { 'ngrok-skip-browser-warning': 'true' };

export const materialChatApi = {
  // Non-streaming query (fallback / first-page hydration).
  async query(materialId, query, sessionId = null, opts = {}) {
    const body = {
      material_id: materialId,
      query,
      session_id: sessionId,
      is_image_query: !!opts.isImageQuery,
      image_base64: opts.imageBase64 || null,
      timestamp: opts.timestamp ?? null,
    };
    const response = await api.post(
      '/api/material-chat/query',
      body,
      { headers: HEADERS }
    );
    return response.data; // { response, session_id, citations }
  },

  // Streaming query. Returns an async iterator yielding parsed SSE events:
  //   { type: 'metadata', data: { citations, session_id } }
  //   { type: 'content',  data: '<text chunk>' }
  //   { type: 'session',  data: { session_id } }
  //   { type: 'done' }
  //   { type: 'error',    data: '<message>' }
  async *streamQuery(materialId, query, sessionId = null, signal = undefined, opts = {}) {
    let token = '';
    const user = auth?.currentUser;
    if (user) {
      token = await user.getIdToken();
    }

    const body = {
      material_id: materialId,
      query,
      session_id: sessionId,
      is_image_query: !!opts.isImageQuery,
      image_base64: opts.imageBase64 || null,
      timestamp: opts.timestamp ?? null,
    };

    const response = await fetch(
      `${api.defaults.baseURL}/api/material-chat/query/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...HEADERS,
        },
        body: JSON.stringify(body),
        signal,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (!payload) continue;
        try {
          yield JSON.parse(payload);
        } catch (e) {
          // Drop malformed SSE frames silently; the backend always emits valid JSON.
        }
      }
    }
  },

  // ── Sessions ──────────────────────────────────────────────────────────

  async listSessions(materialId) {
    const response = await api.get(
      `/api/material-chat/sessions?material_id=${encodeURIComponent(materialId)}`,
      { headers: HEADERS }
    );
    return response.data;
  },

  async createSession(materialId, title = null) {
    const response = await api.post(
      '/api/material-chat/sessions',
      { material_id: materialId, title },
      { headers: HEADERS }
    );
    return response.data;
  },

  async renameSession(sessionId, title) {
    const response = await api.patch(
      `/api/material-chat/sessions/${sessionId}`,
      { title },
      { headers: HEADERS }
    );
    return response.data;
  },

  async deleteSession(sessionId) {
    const response = await api.delete(
      `/api/material-chat/sessions/${sessionId}`,
      { headers: HEADERS }
    );
    return response.data;
  },

  async listMessages(sessionId, limit = 100) {
    const response = await api.get(
      `/api/material-chat/sessions/${sessionId}/messages?limit=${limit}`,
      { headers: HEADERS }
    );
    return response.data;
  },

  // ── Summary ───────────────────────────────────────────────────────────

  async generateSummary(materialId, forceRegenerate = false) {
    const response = await api.post(
      '/api/material-chat/summary',
      { material_id: materialId, force_regenerate: forceRegenerate },
      { headers: HEADERS, timeout: 120000 } // summarization is slow
    );
    return response.data; // {summary_id, material_id, summary, summary_metadata, created_at}
  },

  async downloadSummary(summaryId) {
    const response = await api.get(
      `/api/material-chat/summary/${summaryId}/download`,
      { headers: HEADERS, responseType: 'blob' }
    );
    return response.data;
  },

  // ── Transcript ────────────────────────────────────────────────────────

  async getTranscript(materialId) {
    const response = await api.get(
      `/api/material-chat/transcript/${materialId}`,
      { headers: HEADERS }
    );
    return response.data; // {material_id, material_type, transcript_status,
                          //  transcript_text, segments, length_seconds}
  },
};
