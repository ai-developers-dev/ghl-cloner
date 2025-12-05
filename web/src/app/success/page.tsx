'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface SuccessData {
  status: 'success' | 'pending';
  email: string;
  name?: string;
  licenseKey?: string;
  credits: number;
  tierName: string;
  chromeStoreUrl?: string;
  message?: string;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [data, setData] = useState<SuccessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(`/api/success?session_id=${sessionId}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch data');
        }

        setData(result);

        // If pending, retry after a few seconds
        if (result.status === 'pending') {
          setTimeout(() => fetchData(), 3000);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

  const copyLicenseKey = () => {
    if (data?.licenseKey) {
      navigator.clipboard.writeText(data.licenseKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading your purchase details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-slate-400 mb-8">{error}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-emerald-500 rounded-lg font-semibold"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  if (data?.status === 'pending') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-4">Processing Your Purchase</h1>
          <p className="text-slate-400 mb-4">{data.message}</p>
          <p className="text-sm text-slate-500">This usually takes just a few seconds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-slate-950 font-bold">
              G
            </div>
            <span className="font-bold text-lg">GHL Cloner</span>
          </Link>
        </div>
      </nav>

      {/* Success Content */}
      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-emerald-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">Thank You for Your Purchase!</h1>
          <p className="text-slate-400">
            Your {data?.tierName} package with {data?.credits} credits is ready to use.
          </p>
        </div>

        {/* License Key Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8">
          <div className="text-center">
            <p className="text-slate-400 text-sm uppercase tracking-wider mb-2">
              Your License Key
            </p>
            <div className="bg-slate-950 border-2 border-emerald-500 rounded-xl p-6 mb-4">
              <p className="text-2xl md:text-3xl font-mono font-bold text-emerald-400 tracking-wider">
                {data?.licenseKey}
              </p>
            </div>
            <button
              onClick={copyLicenseKey}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy License Key
                </>
              )}
            </button>
          </div>
        </div>

        {/* Download Button */}
        <div className="text-center mb-8">
          <a
            href={data?.chromeStoreUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-semibold text-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-shadow"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29zm13.342 2.166a5.446 5.446 0 0 1 1.45 7.09l.002.001h-.002l-3.952 6.848a12.014 12.014 0 0 0 9.298-9.298H15.273zM12 8.182a3.818 3.818 0 1 0 0 7.636 3.818 3.818 0 0 0 0-7.636z" />
            </svg>
            Download Chrome Extension
          </a>
          <p className="text-slate-500 text-sm mt-3">
            Click to open Chrome Web Store
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <h2 className="font-bold text-lg mb-6">Getting Started</h2>
          <div className="space-y-4">
            {[
              'Install the Chrome extension from the button above',
              'Click the GHL Cloner icon in your browser toolbar',
              'Enter your license key when prompted',
              'Navigate to any GHL funnel page you want to copy',
              'Click "Copy" to capture the page',
              'Go to your own funnel and click "Paste"',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-400 font-bold text-sm">{i + 1}</span>
                </div>
                <p className="text-slate-300 pt-1">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Email Confirmation */}
        <div className="mt-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700 text-center">
          <p className="text-slate-400 text-sm">
            A confirmation email with your license key has been sent to{' '}
            <span className="text-white font-medium">{data?.email}</span>
          </p>
        </div>

        {/* Return Home */}
        <div className="text-center mt-8">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400">Loading...</p>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SuccessContent />
    </Suspense>
  );
}
