'use client'

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signInWithCustomToken } from 'firebase/auth';
import { auth, api } from '@/components/generic/utils.jsx';
import { useAuth } from '@/context/AuthContext';

const INITIAL_STATE = { status: 'loading', error: null, courseId: null, videoId: null, userType: null };

// Exchanges the tenant handoff token (or a no-auth demo flag) from the embed
// URL for a Firebase session, per docs/embed-integration.md. Also flips the
// app-wide isEmbed flag so TopBar and friends hide their chrome for as long
// as an embed route is mounted.
export function useEmbedSession() {
  const searchParams = useSearchParams();
  const { setIsEmbed } = useAuth();
  const [state, setState] = useState(INITIAL_STATE);

  const token = searchParams.get('token');
  const isDemo = searchParams.get('demo') === 'true';

  useEffect(() => {
    setIsEmbed(true);
    return () => setIsEmbed(false);
  }, [setIsEmbed]);

  useEffect(() => {
    let cancelled = false;

    async function exchange() {
      if (!auth) {
        setState({ ...INITIAL_STATE, status: 'error', error: 'Embed auth is not configured.' });
        return;
      }
      if (!token && !isDemo) {
        setState({ ...INITIAL_STATE, status: 'error', error: 'Missing token. Pass ?token=<jwt> or ?demo=true.' });
        return;
      }

      try {
        const response = isDemo
          ? await api.get('/api/embed/demo-session')
          : await api.post('/api/embed/session', { token });

        const { firebase_token, course_id, video_id, user_type } = response.data;
        await signInWithCustomToken(auth, firebase_token);

        if (cancelled) return;
        setState({
          status: 'ready',
          error: null,
          courseId: course_id ?? null,
          videoId: video_id ?? null,
          userType: user_type ?? null,
        });
      } catch (err) {
        if (cancelled) return;
        const detail = err?.response?.data?.detail;
        const message = typeof detail === 'string' ? detail : err?.message;
        setState({ ...INITIAL_STATE, status: 'error', error: message || 'Failed to start embed session.' });
      }
    }

    exchange();
    return () => {
      cancelled = true;
    };
  }, [token, isDemo]);

  return state;
}
