'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';
import Footer from '@/components/Footer';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const AFFILIATE_REF_KEY = 'hlextras_affiliate_ref';

type PricingTier = 'starter' | 'basic' | 'professional' | 'agency' | 'enterprise';

export default function ClonerPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<PricingTier>('professional');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Capture affiliate ref parameter on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      // Store in localStorage for use during checkout
      localStorage.setItem(AFFILIATE_REF_KEY, ref);
      console.log('Affiliate ref captured:', ref);
    }
  }, []);

  // Helper to get affiliate code from localStorage
  const getAffiliateCode = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(AFFILIATE_REF_KEY);
    }
    return null;
  };

  const features = [
    { icon: '⚡', title: 'Instant Cloning', desc: 'Copy any page with a single click.' },
    { icon: '🎯', title: 'Perfect Accuracy', desc: "Uses GHL's native API to clone exactly." },
    { icon: '🛡️', title: 'Secure & Private', desc: 'Your data never leaves GHL servers.' },
    { icon: '🌐', title: 'Works Everywhere', desc: 'Clone from any public GHL page.' },
    { icon: '⏱️', title: 'Save Hours', desc: 'What took 2-4 hours now takes 30 seconds.' },
    { icon: '💳', title: 'Pay Per Clone', desc: 'No subscriptions. Buy credits when needed.' },
  ];

  const pricing: { tier: PricingTier; name: string; credits: number; price: number; perCredit: string; popular?: boolean; savings?: string }[] = [
    { tier: 'starter', name: 'Starter', credits: 2, price: 20, perCredit: '10.00' },
    { tier: 'basic', name: 'Basic', credits: 5, price: 45, perCredit: '9.00', savings: '10%' },
    { tier: 'professional', name: 'Professional', credits: 10, price: 80, perCredit: '8.00', popular: true, savings: '20%' },
    { tier: 'agency', name: 'Agency', credits: 25, price: 150, perCredit: '6.00', savings: '40%' },
    { tier: 'enterprise', name: 'Enterprise', credits: 50, price: 250, perCredit: '5.00', savings: '50%' },
  ];

  const faqs = [
    { q: 'What can HL Cloner do?', a: 'HL Cloner can clone any HighLevel Funnel or Website page EXACTLY as is, including any custom CSS and tracking code. After that is done, you are responsible for making edits and changes to make it uniquely yours. Clone responsibly. Each credit is one page.' },
    { q: 'What does 1 credit mean?', a: 'Each page cloned consumes 1 credit. A page is defined as a unique page in the funnel or website. If your funnel has 5 pages, this would require 5 credits.' },
    { q: "Is it wrong to copy someone else's funnel or website?", a: "Simply copying and publishing someone else's funnel or website exactly as-is is not acceptable nor ethical—you wouldn't want someone to do that to you. However, it's natural to look online for inspiration. Many people use existing designs as a starting point, drawing ideas from layouts, color schemes, or design elements they admire. HL Cloner helps streamline this process. Instead of hiring/managing VAs or developers to build a funnel from scratch, you can now simply clone one you already like and modify it to fit your needs. It will be far more cost effective and save you time. However, always customize the content and images to ensure the final result is uniquely yours." },
    { q: 'How long does it take to clone a funnel or website?', a: 'The process takes less than 30 seconds.' },
    { q: 'Do my credits expire?', a: 'No! Your credits never expire. Use them whenever you want.' },
    { q: 'How do I use it?', a: "Simply open up 2 tabs. The first tab will be the funnel/website you are looking to clone and the other tab will be with your blank funnel builder already open. Tab 1: Go to tab 1 with the public funnel page and Click Copy. Tab 2: Go to tab 2 the Funnel Builder and Click Paste. That's it! Clone responsibly!" },
    { q: 'What if paste fails?', a: "You won't be charged. Credits are only deducted on successful clones." },
  ];

  const handleGetStarted = async (tier: PricingTier) => {
    setSelectedTier(tier);
    setShowCheckoutModal(true);
    setError('');
    setLoading(true);

    try {
      const affiliateCode = getAffiliateCode();
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, affiliateCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout');
      }

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTierChange = async (tier: PricingTier) => {
    setSelectedTier(tier);
    setClientSecret(null);
    setLoading(true);
    setError('');

    try {
      const affiliateCode = getAffiliateCode();
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, affiliateCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout');
      }

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const closeCheckout = () => {
    setShowCheckoutModal(false);
    setClientSecret(null);
    setError('');
  };

  const selectedPricing = pricing.find(p => p.tier === selectedTier);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero Section */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-sm mb-8">
            <span>✨</span> Works with all GHL accounts
          </div>
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Clone Any GHL Page in{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">Seconds</span>
          </h1>
          <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto">
            Stop rebuilding pages from scratch. Copy any GoHighLevel funnel or website and paste it directly into your account.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => handleGetStarted('professional')}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-semibold text-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-shadow"
            >
              Get Started Now →
            </button>
            <a
              href="#pricing"
              className="px-8 py-4 bg-slate-800 border border-slate-700 rounded-xl font-semibold text-lg hover:bg-slate-700 transition-colors"
            >
              View Pricing
            </a>
          </div>
          <div className="grid grid-cols-3 gap-6 mt-16 pt-10 border-t border-slate-800">
            <div>
              <div className="text-3xl font-bold text-emerald-400">10,000+</div>
              <div className="text-slate-500 text-sm">Pages Cloned</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-400">500+</div>
              <div className="text-slate-500 text-sm">Happy Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-400">&lt;30s</div>
              <div className="text-slate-500 text-sm">Clone Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Agencies Love It</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Simple Pricing</h2>
          <p className="text-slate-400 text-center mb-12">Buy credits, use them whenever. No subscriptions.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {pricing.map((p, i) => (
              <div
                key={i}
                className={`rounded-xl p-5 relative ${
                  p.popular ? 'bg-emerald-500/10 border-2 border-emerald-500' : 'bg-slate-900 border border-slate-800'
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-xs font-bold rounded-full">
                    POPULAR
                  </div>
                )}
                <div className={`text-center mb-4 ${p.popular ? 'pt-2' : ''}`}>
                  <h3 className="font-semibold mb-1">{p.name}</h3>
                  <div className="text-3xl font-bold">${p.price}</div>
                  <div className="text-xs text-slate-500">${p.perCredit}/credit</div>
                  {p.savings && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                      Save {p.savings}
                    </span>
                  )}
                </div>
                <div className="bg-slate-800 rounded-lg p-2 text-center mb-4">🪙 {p.credits} Credits</div>
                <button
                  onClick={() => handleGetStarted(p.tier)}
                  className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all ${
                    p.popular
                      ? 'bg-emerald-500 hover:bg-emerald-400'
                      : 'bg-slate-800 hover:bg-slate-700'
                  }`}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-slate-900/50">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">FAQ</h2>
          <div className="flex flex-col gap-3">
            {faqs.map((f, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-5 py-4 flex justify-between items-center text-left font-medium"
                >
                  <span>{f.q}</span>
                  <span className={`transition-transform ${openFaq === i ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {openFaq === i && <div className="px-5 pb-4 text-slate-400">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer showDisclaimer={true} />

      {/* Stripe Checkout Modal with Package Selector */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={closeCheckout}
          />

          {/* Checkout Modal */}
          <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header with package selector and close button */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-slate-950 font-bold text-sm">HE</div>
                  <span className="font-semibold text-white">HLExtras</span>
                </div>
                <button
                  onClick={closeCheckout}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Package Selector */}
              <div className="grid grid-cols-5 gap-1 bg-slate-700/50 p-1 rounded-lg">
                {pricing.map((p) => (
                  <button
                    key={p.tier}
                    onClick={() => !loading && handleTierChange(p.tier)}
                    disabled={loading}
                    className={`py-2 px-1 rounded-md text-xs font-medium transition-all ${
                      selectedTier === p.tier
                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg'
                        : 'text-slate-300 hover:bg-slate-600/50'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="font-bold">${p.price}</div>
                    <div className="text-[10px] opacity-80">{p.credits} credits</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mx-4 mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Embedded Checkout - hide product info with CSS */}
            {!loading && clientSecret && (
              <div
                className="overflow-auto checkout-hide-product"
                style={{ maxHeight: 'calc(90vh - 140px)' }}
              >
                <style>{`
                  .checkout-hide-product iframe {
                    margin-top: -180px;
                  }
                `}</style>
                <EmbeddedCheckoutProvider
                  stripe={stripePromise}
                  options={{ clientSecret }}
                >
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
