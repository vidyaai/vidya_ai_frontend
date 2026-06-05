'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, Share2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { courseApi } from '../Courses/courseApi';

export default function ShareAcceptPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const { currentUser, loading } = useAuth();

  const [status, setStatus] = useState('idle'); // idle | working | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [share, setShare] = useState(null);

  useEffect(() => {
    if (loading) return;

    if (!token) {
      setStatus('error');
      setErrorMsg('This invitation link is missing its token. Ask the sender to resend it.');
      return;
    }

    if (!currentUser) {
      const next = encodeURIComponent(`/shared/accept?token=${token}`);
      router.replace(`/login?returnUrl=${next}`);
      return;
    }

    if (status !== 'idle') return;
    setStatus('working');
    courseApi
      .acceptShareInvite(token)
      .then((data) => {
        setShare(data);
        setStatus('success');
        // Auto-redirect to the shared resource after a brief success flash
        setTimeout(() => {
          router.replace(`/shared/${data.share_token}`);
        }, 1200);
      })
      .catch((err) => {
        const detail =
          err?.response?.data?.detail ||
          err?.message ||
          'Could not accept the invitation.';
        setErrorMsg(detail);
        setStatus('error');
      });
  }, [token, currentUser, loading, router, status]);

  if (loading || status === 'idle' || status === 'working') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm tracking-wide">Accepting your invitation…</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    const label = share?.share_type === 'folder' ? 'folder' : 'chat';
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Invitation accepted</h1>
          <p className="text-gray-400 mb-6">
            Taking you to the shared {label}
            {share?.title ? <> — <span className="text-white font-semibold">{share.title}</span></> : null}…
          </p>
          <button
            onClick={() => router.replace(`/shared/${share?.share_token}`)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
          >
            <Share2 size={18} />
            Open now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Couldn't accept invitation</h1>
        <p className="text-gray-400 mb-6">{errorMsg}</p>
        <button
          onClick={() => router.push('/home')}
          className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
        >
          Go to dashboard
        </button>
      </div>
    </div>
  );
}
