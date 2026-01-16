'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { auth } from '@/firebase/config';

const API_URL = 'http://localhost:8000';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [countdown, setCountdown] = useState(5);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verify and complete the session
    const verifySession = async () => {
      if (!sessionId) {
        setError('No session ID provided');
        setVerifying(false);
        return;
      }

      try {
        // Wait for Firebase auth to be ready
        await new Promise((resolve) => {
          const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            resolve(user);
          });
        });

        const user = auth.currentUser;
        if (!user) {
          setError('Please log in to complete your subscription');
          setVerifying(false);
          return;
        }

        const token = await user.getIdToken();
        const response = await fetch(`${API_URL}/api/payments/verify-session`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ session_id: sessionId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to verify session');
        }

        setVerifying(false);
      } catch (err) {
        console.error('Session verification error:', err);
        setError(err.message || 'Failed to verify payment. Please contact support.');
        setVerifying(false);
      }
    };

    verifySession();
  }, [sessionId]);

  useEffect(() => {
    if (!verifying && !error) {
      // Start countdown after verification
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push('/chat');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [router, verifying, error]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-900 rounded-2xl p-8 border border-red-800 text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-red-900/30 flex items-center justify-center">
              <AlertCircle size={48} className="text-red-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Verification Error
          </h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/chat')}
            className="mt-6 w-full px-6 py-3 bg-gray-700 text-white font-medium rounded-xl hover:bg-gray-600 transition-all duration-300"
          >
            Go to Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-green-900/30 flex items-center justify-center">
            {verifying ? (
              <Loader2 size={48} className="text-green-400 animate-spin" />
            ) : (
              <CheckCircle size={48} className="text-green-400" />
            )}
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">
          {verifying ? 'Processing Payment...' : 'Payment Successful!'}
        </h1>

        <p className="text-gray-400 mb-6">
          {verifying
            ? 'Please wait while we activate your subscription...'
            : 'Your subscription has been activated successfully. You now have access to all premium features.'}
        </p>

        {sessionId && (
          <p className="text-sm text-gray-500 mb-6">
            Session ID: {sessionId.slice(0, 20)}...
          </p>
        )}

        {!verifying && (
          <>
            <div className="flex items-center justify-center space-x-2 text-gray-300">
              <Loader2 size={16} className="animate-spin" />
              <span>Redirecting to chat in {countdown} seconds...</span>
            </div>

            <button
              onClick={() => router.push('/chat')}
              className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
            >
              Go to Chat Now
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-green-900/30 flex items-center justify-center">
            <Loader2 size={48} className="text-green-400 animate-spin" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Loading...</h1>
        <p className="text-gray-400">Please wait...</p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
