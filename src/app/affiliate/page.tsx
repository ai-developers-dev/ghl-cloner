'use client';

import { useState, useEffect } from 'react';
import { affiliateLogin, fetchAffiliateCommissions, type Affiliate, type AffiliateCommission } from '@/lib/supabase';

const AFFILIATE_SESSION_KEY = 'hlextras_affiliate_session';

export default function AffiliateDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Check for existing session on load
  useEffect(() => {
    const savedSession = localStorage.getItem(AFFILIATE_SESSION_KEY);
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setAffiliate(parsed);
        setIsLoggedIn(true);
        loadCommissions(parsed.id);
      } catch {
        localStorage.removeItem(AFFILIATE_SESSION_KEY);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const loadCommissions = async (affiliateId: string) => {
    try {
      const data = await fetchAffiliateCommissions(affiliateId);
      setCommissions(data);
    } catch (err) {
      console.error('Failed to load commissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoginLoading(true);

    try {
      const result = await affiliateLogin(email, password);
      if (result.success && result.affiliate) {
        setAffiliate(result.affiliate);
        setIsLoggedIn(true);
        localStorage.setItem(AFFILIATE_SESSION_KEY, JSON.stringify(result.affiliate));
        loadCommissions(result.affiliate.id);
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(AFFILIATE_SESSION_KEY);
    setAffiliate(null);
    setIsLoggedIn(false);
    setCommissions([]);
    setEmail('');
    setPassword('');
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      approved: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      paid: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    };
    return colors[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  // Calculate stats
  const pendingCommissions = commissions.filter(c => c.status === 'pending' || c.status === 'approved');
  const paidCommissions = commissions.filter(c => c.status === 'paid');
  const pendingTotal = pendingCommissions.reduce((sum, c) => sum + c.commission_amount, 0);
  const paidTotal = paidCommissions.reduce((sum, c) => sum + c.commission_amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Login form
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-slate-950 font-bold">
                HE
              </div>
              <span className="text-2xl font-bold">HLExtras</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">Affiliate Portal</h1>
            <p className="text-slate-400">Sign in to view your commissions</p>
          </div>

          <form onSubmit={handleLogin} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>

            <p className="mt-4 text-center text-sm text-slate-500">
              Don't have an account?{' '}
              <a href="mailto:support@hlextras.com" className="text-emerald-400 hover:underline">
                Contact us
              </a>
            </p>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-slate-950 font-bold text-sm">
              HE
            </div>
            <span className="font-bold">HLExtras</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">Affiliate Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">{affiliate?.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {affiliate?.name?.split(' ')[0]}!</h1>
          <p className="text-slate-400">Track your referrals and commissions</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-sm text-slate-400 mb-1">Your Referral Link</div>
            <div className="font-mono text-sm text-emerald-400 break-all">
              hlextras.com/cloner?ref={affiliate?.code}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-sm text-slate-400 mb-1">Commission Rate</div>
            <div className="text-2xl font-bold">{((affiliate?.commission_rate || 0) * 100).toFixed(0)}%</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-sm text-slate-400 mb-1">Pending Payout</div>
            <div className="text-2xl font-bold text-yellow-400">{formatCurrency(pendingTotal)}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-sm text-slate-400 mb-1">Total Earned</div>
            <div className="text-2xl font-bold text-emerald-400">{formatCurrency(affiliate?.total_earned || 0)}</div>
          </div>
        </div>

        {/* Copy referral link button */}
        <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
          <div>
            <div className="font-semibold mb-1">Share your referral link</div>
            <div className="text-sm text-slate-400">Earn {((affiliate?.commission_rate || 0) * 100).toFixed(0)}% on every sale from your referrals</div>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`https://hlextras.com/cloner?ref=${affiliate?.code}`);
              alert('Referral link copied!');
            }}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 rounded-lg font-semibold transition-colors whitespace-nowrap"
          >
            Copy Link
          </button>
        </div>

        {/* Commissions table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-lg font-semibold">Commission History</h2>
          </div>

          {commissions.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <div className="text-4xl mb-4">💰</div>
              <div className="font-medium mb-2">No commissions yet</div>
              <div className="text-sm">Share your referral link to start earning!</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-slate-400 border-b border-slate-800">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Sale Amount</th>
                    <th className="px-4 py-3 font-medium">Commission</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((commission) => (
                    <tr key={commission.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-sm">{formatDate(commission.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium">{commission.users?.name || 'Unknown'}</div>
                        <div className="text-xs text-slate-500">{commission.users?.email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{formatCurrency(commission.purchase_amount)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-emerald-400">
                        {formatCurrency(commission.commission_amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(commission.status)}`}>
                          {commission.status.charAt(0).toUpperCase() + commission.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary stats at bottom */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-sm text-slate-400 mb-2">Total Referrals</div>
            <div className="text-3xl font-bold">{commissions.length}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-sm text-slate-400 mb-2">Total Paid Out</div>
            <div className="text-3xl font-bold text-emerald-400">{formatCurrency(paidTotal)}</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-12 py-6 px-4">
        <div className="max-w-6xl mx-auto text-center text-sm text-slate-500">
          Questions about payouts?{' '}
          <a href="mailto:support@hlextras.com" className="text-emerald-400 hover:underline">
            Contact support
          </a>
        </div>
      </footer>
    </div>
  );
}
