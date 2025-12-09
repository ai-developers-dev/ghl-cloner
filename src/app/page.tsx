'use client';

import { useState } from 'react';
import ToolCard from '@/components/ToolCard';
import Link from 'next/link';

const tools = [
  {
    icon: '📋',
    title: 'Page Cloner',
    description: 'Clone any GoHighLevel page in seconds. Copy funnels, websites, and landing pages with one click.',
    status: 'available' as const,
    href: '/cloner',
  },
  {
    icon: '📞',
    title: 'Contact Buttons',
    description: 'Add floating contact buttons to any GHL page. Phone, SMS, WhatsApp, and more.',
    status: 'coming-soon' as const,
  },
  {
    icon: '🗺️',
    title: 'Google Maps',
    description: 'Embed interactive Google Maps on your GHL pages with custom styling and markers.',
    status: 'coming-soon' as const,
  },
  {
    icon: '🏠',
    title: 'Zillow Links',
    description: 'Add property links and Zillow integration for real estate funnels and websites.',
    status: 'coming-soon' as const,
  },
  {
    icon: '📱',
    title: 'Dialer',
    description: 'Click-to-call functionality with tracking and analytics for your GHL pages.',
    status: 'coming-soon' as const,
  },
  {
    icon: '✨',
    title: 'More Coming',
    description: "We're constantly building new tools to help GHL agencies save time and grow faster.",
    status: 'coming-soon' as const,
  },
];

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
              <h3 className="text-xl font-bold mb-2">Application Received!</h3>
              <p className="text-slate-400 mb-6">
                Check your email for instructions to set up your password and access your affiliate dashboard.
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 rounded-lg font-semibold transition-colors"
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
                <h2 className="text-xl font-bold mb-2">Become an Affiliate</h2>
                <p className="text-slate-400 text-sm">
                  Earn 20% commission on every sale you refer. Get your unique link and start earning!
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
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

export default function HomePage() {
  const [showAffiliateModal, setShowAffiliateModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero Section */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-sm mb-8">
            <span>🚀</span> Professional GHL Extensions
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            GHL Tools That{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
              Save You Hours
            </span>
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Professional GoHighLevel extensions for agencies. Clone pages, add contact buttons, embed maps, and more.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/cloner"
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-semibold text-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-shadow"
            >
              Try Page Cloner →
            </Link>
            <a
              href="#tools"
              className="px-8 py-4 bg-slate-800 border border-slate-700 rounded-xl font-semibold text-lg hover:bg-slate-700 transition-colors"
            >
              View All Tools
            </a>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 px-4 border-y border-slate-800 bg-slate-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-emerald-400">10,000+</div>
              <div className="text-slate-500 text-sm">Pages Cloned</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-400">500+</div>
              <div className="text-slate-500 text-sm">Happy Agencies</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-400">6</div>
              <div className="text-slate-500 text-sm">Powerful Tools</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid Section */}
      <section id="tools" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Tools</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Everything you need to supercharge your GoHighLevel workflow. More tools launching soon.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool, index) => (
              <ToolCard
                key={index}
                icon={tool.icon}
                title={tool.title}
                description={tool.description}
                status={tool.status}
                href={tool.href}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-slate-900/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Save Hours?</h2>
          <p className="text-slate-400 mb-8">
            Start with our Page Cloner - the fastest way to copy any GHL page. No subscriptions, just buy credits when you need them.
          </p>
          <Link
            href="/cloner"
            className="inline-flex px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-semibold text-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-shadow"
          >
            Get Started with Page Cloner →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-slate-950 font-bold text-sm">
              HE
            </div>
            <span className="font-bold">HLExtras</span>
          </div>
          <div className="flex gap-6 items-center flex-wrap justify-center">
            <a href="#" className="text-slate-500 text-sm hover:text-slate-300">Privacy</a>
            <a href="#" className="text-slate-500 text-sm hover:text-slate-300">Terms</a>
            <a href="#" className="text-slate-500 text-sm hover:text-slate-300">Contact</a>
            <button
              onClick={() => setShowAffiliateModal(true)}
              className="text-emerald-400 text-sm hover:text-emerald-300 transition-colors"
            >
              Become an Affiliate
            </button>
            <a
              href="/admin"
              className="flex items-center gap-1.5 text-slate-500 text-sm px-3 py-1.5 bg-slate-800 rounded-md border border-slate-700 hover:text-slate-300"
            >
              🔐 Admin
            </a>
          </div>
          <div className="text-slate-500 text-sm">© 2024 HLExtras. All rights reserved.</div>
        </div>
      </footer>

      {/* Affiliate Signup Modal */}
      <AffiliateSignupModal
        isOpen={showAffiliateModal}
        onClose={() => setShowAffiliateModal(false)}
      />
    </div>
  );
}
