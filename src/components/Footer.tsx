'use client';

import { useState } from 'react';

// Affiliate Signup Modal Component
function AffiliateSignupModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/affiliate-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('Failed to submit. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setEmail('');
    setPhone('');
    setError('');
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          {success ? (
            // Success state
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-6">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Application Received!</h3>
              <p className="text-slate-400 mb-6">
                Check your email for instructions to set up your password and access your affiliate dashboard.
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 rounded-lg font-semibold text-white transition-colors"
              >
                Got it!
              </button>
            </div>
          ) : (
            // Form state
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-950 font-bold text-lg mb-4">
                  HE
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Become an Affiliate</h2>
                <p className="text-slate-400 text-sm">
                  Earn 30% commission on every sale you refer. Get your unique link and start earning!
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="John Smith"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg font-semibold text-white hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    'Apply Now'
                  )}
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-slate-500">
                Already an affiliate?{' '}
                <a href="/affiliate" className="text-emerald-400 hover:underline">
                  Sign in to your dashboard
                </a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface FooterProps {
  showDisclaimer?: boolean;
}

export default function Footer({ showDisclaimer = false }: FooterProps) {
  const [showAffiliateModal, setShowAffiliateModal] = useState(false);

  return (
    <>
      <footer className="border-t border-slate-800 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-slate-950 font-bold text-sm">
              HE
            </div>
            <span className="font-bold text-white">HLExtras</span>
          </div>
          <div className="flex gap-6 items-center flex-wrap justify-center">
            <a href="/privacy" className="text-slate-500 text-sm hover:text-slate-300">Privacy</a>
            <a href="/terms" className="text-slate-500 text-sm hover:text-slate-300">Terms</a>
            <a href="mailto:support@hlextras.com" className="text-slate-500 text-sm hover:text-slate-300">Contact</a>
            <button
              onClick={() => setShowAffiliateModal(true)}
              className="text-emerald-400 text-sm hover:text-emerald-300 transition-colors"
            >
              Become an Affiliate
            </button>
            <a
              href="/login"
              className="text-slate-500 text-sm hover:text-slate-300"
            >
              Login
            </a>
          </div>

          {showDisclaimer && (
            <div className="max-w-xl text-center mt-4 pt-4 border-t border-slate-800">
              <p className="text-slate-500 text-xs leading-relaxed">
                Cloning funnels or websites without permission may infringe on intellectual property and copyrights.
                Use these resources for inspiration, not duplication. Copying someone else&apos;s page or content without
                consent isn&apos;t ethical. Model their structure, don&apos;t steal their substance.
              </p>
            </div>
          )}

          <div className="text-slate-500 text-sm">© 2024 HLExtras. All rights reserved.</div>
        </div>
      </footer>

      {/* Affiliate Signup Modal */}
      <AffiliateSignupModal
        isOpen={showAffiliateModal}
        onClose={() => setShowAffiliateModal(false)}
      />
    </>
  );
}
