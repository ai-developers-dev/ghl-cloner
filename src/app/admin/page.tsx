'use client';

import { useState, FormEvent } from 'react';
import {
  fetchUsers,
  fetchTransactions,
  createUser,
  updateUser,
  deleteUser,
  adjustCredits,
  adminLogin,
  User,
  Transaction,
  // Affiliate imports
  Affiliate,
  AffiliateCommission,
  fetchAffiliates,
  createAffiliateWithSetupToken,
  updateAffiliate,
  deleteAffiliate,
  fetchCommissions,
  updateCommissionStatus,
  markCommissionsPaid,
  generateAffiliateCode,
  // Sales/Reports imports
  Sale,
  SalesReport,
  getAllSalesReports,
  fetchSales,
} from '@/lib/supabase';
import { sendAffiliateWelcomeEmail, sendNewAffiliateAdminNotification } from '@/lib/email';

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'transactions' | 'affiliates' | 'reports'>('users');

  // Reports states
  const [salesReports, setSalesReports] = useState<{
    daily: SalesReport;
    weekly: SalesReport;
    monthly: SalesReport;
  } | null>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Affiliate states
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);
  const [showAffiliateModal, setShowAffiliateModal] = useState(false);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [showDeleteAffiliateModal, setShowDeleteAffiliateModal] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null);
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([]);
  const [commissionFilter, setCommissionFilter] = useState<'all' | 'pending' | 'approved' | 'paid'>('all');

  // Affiliate form states
  const [affName, setAffName] = useState('');
  const [affEmail, setAffEmail] = useState('');
  const [affCommissionRate, setAffCommissionRate] = useState(20);
  const [affStatus, setAffStatus] = useState<'active' | 'inactive'>('active');
  const [previewCode, setPreviewCode] = useState('');

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCredits, setFormCredits] = useState(0);
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [creditAmount, setCreditAmount] = useState(0);
  const [creditDescription, setCreditDescription] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersData, txData, affiliatesData, commissionsData, reportsData, salesData] = await Promise.all([
        fetchUsers(),
        fetchTransactions(),
        fetchAffiliates(),
        fetchCommissions(),
        getAllSalesReports(),
        fetchSales({ limit: 50 }),
      ]);
      setUsers(usersData);
      setTransactions(txData);
      setAffiliates(affiliatesData);
      setCommissions(commissionsData);
      setSalesReports(reportsData);
      setRecentSales(salesData);
    } catch (err) {
      setError('Failed to fetch data: ' + (err as Error).message);
    }
    setLoading(false);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await adminLogin(loginEmail, loginPassword);
      if (result.success && result.user) {
        setAdminUser(result.user);
        setIsLoggedIn(true);
        fetchData();
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('Login error: ' + (err as Error).message);
    }

    setLoading(false);
  };

  // Open create user modal
  const openCreateModal = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormCredits(0);
    setFormStatus('active');
    setShowUserModal(true);
  };

  // Open edit user modal
  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormName(user.name || '');
    setFormEmail(user.email);
    setFormStatus(user.status);
    setShowUserModal(true);
  };

  // Open credits modal
  const openCreditsModal = (user: User) => {
    setSelectedUser(user);
    setCreditAmount(0);
    setCreditDescription('');
    setShowCreditsModal(true);
  };

  // Open delete modal
  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // Handle create/edit user
  const handleSaveUser = async () => {
    if (!formEmail) {
      setError('Email is required');
      return;
    }

    setFormLoading(true);
    setError('');

    try {
      if (editingUser) {
        // Update existing user
        const result = await updateUser(editingUser.id, {
          name: formName,
          email: formEmail,
          status: formStatus,
        });
        if (!result.success) {
          setError(result.error || 'Failed to update user');
        }
      } else {
        // Create new user
        const result = await createUser({
          name: formName,
          email: formEmail,
          credits: formCredits,
          status: formStatus,
        });
        if (!result.success) {
          setError(result.error || 'Failed to create user');
        }
      }
      setShowUserModal(false);
      fetchData();
    } catch (err) {
      setError('Error: ' + (err as Error).message);
    }

    setFormLoading(false);
  };

  // Handle add credits
  const handleAddCredits = async () => {
    if (!selectedUser || creditAmount === 0) return;

    setFormLoading(true);
    setError('');

    try {
      const result = await adjustCredits(
        selectedUser.id,
        selectedUser.credits,
        creditAmount,
        creditDescription || 'Admin adjustment'
      );
      if (!result.success) {
        setError(result.error || 'Failed to adjust credits');
      }
      setShowCreditsModal(false);
      fetchData();
    } catch (err) {
      setError('Error: ' + (err as Error).message);
    }

    setFormLoading(false);
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setFormLoading(true);
    setError('');

    try {
      const result = await deleteUser(selectedUser.id);
      if (!result.success) {
        setError(result.error || 'Failed to delete user');
      }
      setShowDeleteModal(false);
      fetchData();
    } catch (err) {
      setError('Error: ' + (err as Error).message);
    }

    setFormLoading(false);
  };

  // =====================
  // AFFILIATE HANDLERS
  // =====================

  // Update preview code when name changes
  const handleAffNameChange = (name: string) => {
    setAffName(name);
    if (name.trim()) {
      setPreviewCode(generateAffiliateCode(name));
    } else {
      setPreviewCode('');
    }
  };

  // Open create affiliate modal
  const openCreateAffiliateModal = () => {
    setEditingAffiliate(null);
    setAffName('');
    setAffEmail('');
    setAffCommissionRate(20);
    setAffStatus('active');
    setPreviewCode('');
    setShowAffiliateModal(true);
  };

  // Open edit affiliate modal
  const openEditAffiliateModal = (affiliate: Affiliate) => {
    setEditingAffiliate(affiliate);
    setAffName(affiliate.name);
    setAffEmail(affiliate.email);
    setAffCommissionRate(Math.round(affiliate.commission_rate * 100));
    setAffStatus(affiliate.status);
    setPreviewCode(affiliate.code);
    setShowAffiliateModal(true);
  };

  // Open delete affiliate modal
  const openDeleteAffiliateModal = (affiliate: Affiliate) => {
    setSelectedAffiliate(affiliate);
    setShowDeleteAffiliateModal(true);
  };

  // Open commission report modal for specific affiliate
  const openCommissionModal = (affiliate: Affiliate) => {
    setSelectedAffiliate(affiliate);
    setSelectedCommissions([]);
    setShowCommissionModal(true);
  };

  // Handle create/edit affiliate
  const handleSaveAffiliate = async () => {
    if (!affName || !affEmail) {
      setError('Name and email are required');
      return;
    }

    setFormLoading(true);
    setError('');

    try {
      if (editingAffiliate) {
        // Update existing affiliate
        const result = await updateAffiliate(editingAffiliate.id, {
          name: affName,
          email: affEmail,
          commission_rate: affCommissionRate / 100,
          status: affStatus,
        });
        if (!result.success) {
          setError(result.error || 'Failed to update affiliate');
          setFormLoading(false);
          return;
        }
      } else {
        // Create new affiliate with setup token
        const result = await createAffiliateWithSetupToken({
          name: affName,
          email: affEmail,
          commission_rate: affCommissionRate / 100,
        });
        if (!result.success || !result.affiliate || !result.setupToken) {
          setError(result.error || 'Failed to create affiliate');
          setFormLoading(false);
          return;
        }

        // Send welcome email with setup link
        const emailResult = await sendAffiliateWelcomeEmail({
          email: result.affiliate.email,
          name: result.affiliate.name,
          setupToken: result.setupToken,
          affiliateCode: result.affiliate.code,
          commissionRate: result.affiliate.commission_rate,
        });

        if (!emailResult.success) {
          console.error('Failed to send welcome email:', emailResult.error);
          // Don't fail the whole operation, just log the error
        }

        // Send admin notification
        const adminNotifyResult = await sendNewAffiliateAdminNotification({
          affiliateName: result.affiliate.name,
          affiliateEmail: result.affiliate.email,
          affiliateCode: result.affiliate.code,
          commissionRate: result.affiliate.commission_rate,
          source: 'Admin Created',
        });

        if (!adminNotifyResult.success) {
          console.error('Failed to send admin notification:', adminNotifyResult.error);
          // Don't fail the whole operation, just log the error
        }
      }
      setShowAffiliateModal(false);
      fetchData();
    } catch (err) {
      setError('Error: ' + (err as Error).message);
    }

    setFormLoading(false);
  };

  // Handle delete affiliate
  const handleDeleteAffiliate = async () => {
    if (!selectedAffiliate) return;

    setFormLoading(true);
    setError('');

    try {
      const result = await deleteAffiliate(selectedAffiliate.id);
      if (!result.success) {
        setError(result.error || 'Failed to delete affiliate');
      }
      setShowDeleteAffiliateModal(false);
      fetchData();
    } catch (err) {
      setError('Error: ' + (err as Error).message);
    }

    setFormLoading(false);
  };

  // Handle commission status change
  const handleCommissionStatusChange = async (commissionId: string, newStatus: 'pending' | 'approved' | 'paid') => {
    setFormLoading(true);
    setError('');

    try {
      const result = await updateCommissionStatus(commissionId, newStatus);
      if (!result.success) {
        setError(result.error || 'Failed to update commission status');
      }
      fetchData();
    } catch (err) {
      setError('Error: ' + (err as Error).message);
    }

    setFormLoading(false);
  };

  // Handle mark selected commissions as paid
  const handleMarkSelectedPaid = async () => {
    if (selectedCommissions.length === 0 || !selectedAffiliate) return;

    setFormLoading(true);
    setError('');

    try {
      // Calculate total amount for selected commissions
      const totalAmount = commissions
        .filter((c) => selectedCommissions.includes(c.id) && c.status !== 'paid')
        .reduce((sum, c) => sum + c.commission_amount, 0);

      const result = await markCommissionsPaid(selectedCommissions, selectedAffiliate.id, totalAmount);
      if (!result.success) {
        setError(result.error || 'Failed to mark commissions as paid');
      }
      setSelectedCommissions([]);
      fetchData();
    } catch (err) {
      setError('Error: ' + (err as Error).message);
    }

    setFormLoading(false);
  };

  // Toggle commission selection
  const toggleCommissionSelection = (commissionId: string) => {
    setSelectedCommissions((prev) =>
      prev.includes(commissionId) ? prev.filter((id) => id !== commissionId) : [...prev, commissionId]
    );
  };

  // Get filtered commissions for selected affiliate
  const getFilteredCommissions = () => {
    let filtered = commissions;
    if (selectedAffiliate) {
      filtered = filtered.filter((c) => c.affiliate_id === selectedAffiliate.id);
    }
    if (commissionFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === commissionFilter);
    }
    return filtered;
  };

  // Get referral URL for affiliate
  const getAffiliateUrl = (code: string) => {
    return `https://www.hlextras.com/?ref=${code}`;
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Calculate affiliate stats
  const getAffiliateStats = () => {
    const totalEarned = affiliates.reduce((sum, a) => sum + a.total_earned, 0);
    const totalPaid = affiliates.reduce((sum, a) => sum + a.total_paid, 0);
    const pendingCommissions = commissions.filter((c) => c.status === 'pending').reduce((sum, c) => sum + c.commission_amount, 0);
    return { totalEarned, totalPaid, pendingCommissions };
  };

  const totalCreditsUsed = transactions
    .filter((t) => t.type === 'usage')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-slate-950 font-bold">
              G
            </div>
            <span className="font-bold text-xl text-white">GHL Cloner Admin</span>
          </div>

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-slate-400 text-sm mb-2">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-slate-400 text-sm mb-2">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                required
              />
            </div>
            {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg font-semibold text-white disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-slate-950 font-bold">
            G
          </div>
          <span className="font-bold text-lg">GHL Cloner Admin</span>
        </div>
        <div className="flex items-center gap-4">
          {adminUser && (
            <span className="text-slate-400 text-sm">
              Logged in as <span className="text-emerald-400">{adminUser.name || adminUser.email}</span>
            </span>
          )}
          <button
            onClick={() => {
              setIsLoggedIn(false);
              setAdminUser(null);
              setLoginEmail('');
              setLoginPassword('');
            }}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-slate-500 text-sm mb-1">Total Users</div>
            <div className="text-3xl font-bold text-emerald-400">{users.length}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-slate-500 text-sm mb-1">Total Credits</div>
            <div className="text-3xl font-bold text-cyan-400">
              {users.reduce((sum, u) => sum + (u.credits || 0), 0)}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-slate-500 text-sm mb-1">Credits Used</div>
            <div className="text-3xl font-bold text-amber-400">{totalCreditsUsed}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-slate-500 text-sm mb-1">Transactions</div>
            <div className="text-3xl font-bold text-purple-400">{transactions.length}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-5 py-2.5 rounded-lg font-semibold ${
              activeTab === 'users' ? 'bg-emerald-500' : 'bg-slate-800'
            }`}
          >
            👥 Users
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-5 py-2.5 rounded-lg font-semibold ${
              activeTab === 'transactions' ? 'bg-emerald-500' : 'bg-slate-800'
            }`}
          >
            📊 Transactions
          </button>
          <button
            onClick={() => setActiveTab('affiliates')}
            className={`px-5 py-2.5 rounded-lg font-semibold ${
              activeTab === 'affiliates' ? 'bg-emerald-500' : 'bg-slate-800'
            }`}
          >
            🤝 Affiliates
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-5 py-2.5 rounded-lg font-semibold ${
              activeTab === 'reports' ? 'bg-emerald-500' : 'bg-slate-800'
            }`}
          >
            📈 Reports
          </button>
          <div className="flex gap-2 ml-auto">
            {activeTab === 'users' && (
              <button
                onClick={openCreateModal}
                className="px-5 py-2.5 rounded-lg font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500"
              >
                + New User
              </button>
            )}
            {activeTab === 'affiliates' && (
              <button
                onClick={openCreateAffiliateModal}
                className="px-5 py-2.5 rounded-lg font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500"
              >
                + New Affiliate
              </button>
            )}
            <button
              onClick={fetchData}
              className="px-5 py-2.5 rounded-lg font-semibold bg-slate-900 border border-slate-700 hover:bg-slate-800"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {loading && <div className="text-center py-10 text-slate-500">Loading...</div>}

        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6 text-red-300">
            {error}
            <button onClick={() => setError('')} className="ml-4 text-red-400 hover:text-red-200">
              ✕
            </button>
          </div>
        )}

        {/* Users Table */}
        {activeTab === 'users' && !loading && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800">
                  <th className="px-4 py-4 text-left font-semibold text-slate-400">User</th>
                  <th className="px-4 py-4 text-left font-semibold text-slate-400">License Key</th>
                  <th className="px-4 py-4 text-center font-semibold text-slate-400">Credits</th>
                  <th className="px-4 py-4 text-center font-semibold text-slate-400">Status</th>
                  <th className="px-4 py-4 text-left font-semibold text-slate-400">Joined</th>
                  <th className="px-4 py-4 text-center font-semibold text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-slate-800">
                    <td className="px-4 py-4">
                      <div className="font-medium">{user.name || 'No name'}</div>
                      <div className="text-slate-500 text-sm">{user.email}</div>
                    </td>
                    <td className="px-4 py-4">
                      <code className="bg-slate-800 px-2 py-1 rounded text-sm text-emerald-400">
                        {user.license_key}
                      </code>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full font-semibold ${
                          user.credits > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {user.credits}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                          user.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-500 text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-sm"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => openCreditsModal(user)}
                          className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-sm"
                          title="Add Credits"
                        >
                          💳
                        </button>
                        <button
                          onClick={() => openDeleteModal(user)}
                          className="p-2 bg-slate-800 rounded-lg hover:bg-red-900 text-sm"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <div className="py-10 text-center text-slate-500">No users yet</div>}
          </div>
        )}

        {/* Transactions Table */}
        {activeTab === 'transactions' && !loading && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800">
                  <th className="px-4 py-4 text-left font-semibold text-slate-400">User</th>
                  <th className="px-4 py-4 text-center font-semibold text-slate-400">Type</th>
                  <th className="px-4 py-4 text-center font-semibold text-slate-400">Amount</th>
                  <th className="px-4 py-4 text-left font-semibold text-slate-400">Description</th>
                  <th className="px-4 py-4 text-left font-semibold text-slate-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-t border-slate-800">
                    <td className="px-4 py-4">
                      <div className="font-medium">{tx.users?.name || 'Unknown'}</div>
                      <div className="text-slate-500 text-sm">{tx.users?.email}</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                          tx.type === 'purchase'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : tx.type === 'usage'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-purple-500/20 text-purple-400'
                        }`}
                      >
                        {tx.type === 'admin_adjustment' ? 'admin' : tx.type}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-4 text-center font-semibold ${
                        tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {tx.amount > 0 ? '+' : ''}
                      {tx.amount}
                    </td>
                    <td className="px-4 py-4 text-slate-400 text-sm">{tx.description || '-'}</td>
                    <td className="px-4 py-4 text-slate-500 text-sm">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length === 0 && (
              <div className="py-10 text-center text-slate-500">No transactions yet</div>
            )}
          </div>
        )}

        {/* Affiliates Table */}
        {activeTab === 'affiliates' && !loading && (
          <>
            {/* Affiliate Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="text-slate-500 text-sm mb-1">Total Affiliates</div>
                <div className="text-3xl font-bold text-emerald-400">{affiliates.length}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="text-slate-500 text-sm mb-1">Total Earned</div>
                <div className="text-3xl font-bold text-cyan-400">
                  ${(getAffiliateStats().totalEarned / 100).toFixed(2)}
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="text-slate-500 text-sm mb-1">Pending Payout</div>
                <div className="text-3xl font-bold text-amber-400">
                  ${(getAffiliateStats().pendingCommissions / 100).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800">
                    <th className="px-4 py-4 text-left font-semibold text-slate-400">Affiliate</th>
                    <th className="px-4 py-4 text-left font-semibold text-slate-400">Referral URL</th>
                    <th className="px-4 py-4 text-center font-semibold text-slate-400">Commission</th>
                    <th className="px-4 py-4 text-center font-semibold text-slate-400">Earned</th>
                    <th className="px-4 py-4 text-center font-semibold text-slate-400">Paid</th>
                    <th className="px-4 py-4 text-center font-semibold text-slate-400">Status</th>
                    <th className="px-4 py-4 text-center font-semibold text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {affiliates.map((affiliate) => (
                    <tr key={affiliate.id} className="border-t border-slate-800">
                      <td className="px-4 py-4">
                        <div className="font-medium">{affiliate.name}</div>
                        <div className="text-slate-500 text-sm">{affiliate.email}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <code className="bg-slate-800 px-2 py-1 rounded text-xs text-emerald-400 truncate max-w-[200px]">
                            ?ref={affiliate.code}
                          </code>
                          <button
                            onClick={() => copyToClipboard(getAffiliateUrl(affiliate.code))}
                            className="p-1 bg-slate-700 rounded hover:bg-slate-600 text-xs"
                            title="Copy full URL"
                          >
                            📋
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 font-semibold">
                          {Math.round(affiliate.commission_rate * 100)}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-semibold text-emerald-400">
                          ${(affiliate.total_earned / 100).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-semibold text-slate-400">
                          ${(affiliate.total_paid / 100).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                            affiliate.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {affiliate.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => openCommissionModal(affiliate)}
                            className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-sm"
                            title="View Commissions"
                          >
                            💰
                          </button>
                          <button
                            onClick={() => openEditAffiliateModal(affiliate)}
                            className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-sm"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => openDeleteAffiliateModal(affiliate)}
                            className="p-2 bg-slate-800 rounded-lg hover:bg-red-900 text-sm"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {affiliates.length === 0 && (
                <div className="py-10 text-center text-slate-500">No affiliates yet. Click &quot;+ New Affiliate&quot; to create one.</div>
              )}
            </div>
          </>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && !loading && (
          <>
            {/* Period Selector */}
            <div className="flex gap-2 mb-6">
              {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setReportPeriod(period)}
                  className={`px-5 py-2.5 rounded-lg font-semibold ${
                    reportPeriod === period ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>

            {/* Report Summary Cards */}
            {salesReports && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="text-slate-500 text-sm mb-1">
                    {reportPeriod === 'daily' ? "Today's" : reportPeriod === 'weekly' ? "This Week's" : "This Month's"} Sales
                  </div>
                  <div className="text-3xl font-bold text-emerald-400">
                    {salesReports[reportPeriod].salesCount}
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="text-slate-500 text-sm mb-1">Revenue</div>
                  <div className="text-3xl font-bold text-cyan-400">
                    ${(salesReports[reportPeriod].totalRevenue / 100).toFixed(2)}
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="text-slate-500 text-sm mb-1">Credits Sold</div>
                  <div className="text-3xl font-bold text-amber-400">
                    {salesReports[reportPeriod].totalCredits}
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="text-slate-500 text-sm mb-1">Affiliate Commissions</div>
                  <div className="text-3xl font-bold text-purple-400">
                    ${(salesReports[reportPeriod].totalAffiliateCommissions / 100).toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            {/* Period Comparison */}
            {salesReports && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4">Period Comparison</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-slate-400 text-sm mb-2">Today</div>
                    <div className="text-2xl font-bold text-emerald-400">
                      ${(salesReports.daily.totalRevenue / 100).toFixed(2)}
                    </div>
                    <div className="text-slate-500 text-xs">{salesReports.daily.salesCount} sales</div>
                  </div>
                  <div className="text-center border-x border-slate-700">
                    <div className="text-slate-400 text-sm mb-2">This Week</div>
                    <div className="text-2xl font-bold text-cyan-400">
                      ${(salesReports.weekly.totalRevenue / 100).toFixed(2)}
                    </div>
                    <div className="text-slate-500 text-xs">{salesReports.weekly.salesCount} sales</div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-400 text-sm mb-2">This Month</div>
                    <div className="text-2xl font-bold text-amber-400">
                      ${(salesReports.monthly.totalRevenue / 100).toFixed(2)}
                    </div>
                    <div className="text-slate-500 text-xs">{salesReports.monthly.salesCount} sales</div>
                  </div>
                </div>
              </div>
            )}

            {/* Sales Table for Selected Period */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800">
                <h3 className="text-lg font-semibold">
                  {reportPeriod === 'daily' ? "Today's" : reportPeriod === 'weekly' ? "This Week's" : "This Month's"} Sales
                </h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800">
                    <th className="px-4 py-4 text-left font-semibold text-slate-400">Date</th>
                    <th className="px-4 py-4 text-left font-semibold text-slate-400">Customer</th>
                    <th className="px-4 py-4 text-center font-semibold text-slate-400">Tier</th>
                    <th className="px-4 py-4 text-center font-semibold text-slate-400">Credits</th>
                    <th className="px-4 py-4 text-center font-semibold text-slate-400">Amount</th>
                    <th className="px-4 py-4 text-left font-semibold text-slate-400">Affiliate</th>
                    <th className="px-4 py-4 text-center font-semibold text-slate-400">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {salesReports && salesReports[reportPeriod].sales.map((sale) => (
                    <tr key={sale.id} className="border-t border-slate-800">
                      <td className="px-4 py-4 text-sm text-slate-400">
                        {new Date(sale.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium">{sale.users?.name || 'Unknown'}</div>
                        <div className="text-slate-500 text-sm">{sale.users?.email}</div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-semibold">
                          {sale.tier}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center font-semibold">{sale.credits}</td>
                      <td className="px-4 py-4 text-center font-semibold text-emerald-400">
                        ${(sale.amount / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-4">
                        {sale.affiliates ? (
                          <div>
                            <div className="font-medium">{sale.affiliates.name}</div>
                            <div className="text-slate-500 text-xs">ref={sale.affiliates.code}</div>
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {sale.affiliate_commission ? (
                          <span className="font-semibold text-purple-400">
                            ${(sale.affiliate_commission / 100).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {salesReports && salesReports[reportPeriod].sales.length === 0 && (
                <div className="py-10 text-center text-slate-500">No sales in this period yet.</div>
              )}
            </div>

            {/* Recent Sales (All Time) */}
            <div className="mt-8 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800">
                <h3 className="text-lg font-semibold">Recent Sales (All Time)</h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800">
                    <th className="px-4 py-4 text-left font-semibold text-slate-400">Date</th>
                    <th className="px-4 py-4 text-left font-semibold text-slate-400">Customer</th>
                    <th className="px-4 py-4 text-center font-semibold text-slate-400">Tier</th>
                    <th className="px-4 py-4 text-center font-semibold text-slate-400">Credits</th>
                    <th className="px-4 py-4 text-center font-semibold text-slate-400">Amount</th>
                    <th className="px-4 py-4 text-left font-semibold text-slate-400">Affiliate</th>
                    <th className="px-4 py-4 text-center font-semibold text-slate-400">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((sale) => (
                    <tr key={sale.id} className="border-t border-slate-800">
                      <td className="px-4 py-4 text-sm text-slate-400">
                        {new Date(sale.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium">{sale.users?.name || 'Unknown'}</div>
                        <div className="text-slate-500 text-sm">{sale.users?.email}</div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-semibold">
                          {sale.tier}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center font-semibold">{sale.credits}</td>
                      <td className="px-4 py-4 text-center font-semibold text-emerald-400">
                        ${(sale.amount / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-4">
                        {sale.affiliates ? (
                          <div>
                            <div className="font-medium">{sale.affiliates.name}</div>
                            <div className="text-slate-500 text-xs">ref={sale.affiliates.code}</div>
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {sale.affiliate_commission ? (
                          <span className="font-semibold text-purple-400">
                            ${(sale.affiliate_commission / 100).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recentSales.length === 0 && (
                <div className="py-10 text-center text-slate-500">No sales recorded yet.</div>
              )}
            </div>
          </>
        )}
      </div>

      {/* User Modal (Create/Edit) */}
      {showUserModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowUserModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-6">{editingUser ? 'Edit User' : 'Create New User'}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-1">Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-1">Email *</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  required
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Initial Credits</label>
                  <input
                    type="number"
                    value={formCredits}
                    onChange={(e) => setFormCredits(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-400 text-sm mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as 'active' | 'inactive')}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUserModal(false)}
                className="flex-1 py-3 bg-slate-800 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                disabled={formLoading}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg font-semibold disabled:opacity-50"
              >
                {formLoading ? 'Saving...' : editingUser ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credits Modal */}
      {showCreditsModal && selectedUser && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreditsModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2">Adjust Credits</h2>
            <p className="text-slate-400 text-sm mb-6">
              {selectedUser.name || selectedUser.email} - Current: {selectedUser.credits} credits
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-1">Amount (use negative to remove)</label>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                  placeholder="10"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-1">Description</label>
                <input
                  type="text"
                  value={creditDescription}
                  onChange={(e) => setCreditDescription(e.target.value)}
                  placeholder="Bonus credits, refund, etc."
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-sm text-slate-400">New Balance:</div>
                <div className="text-2xl font-bold text-emerald-400">
                  {selectedUser.credits + creditAmount} credits
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreditsModal(false)}
                className="flex-1 py-3 bg-slate-800 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCredits}
                disabled={formLoading || creditAmount === 0}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg font-semibold disabled:opacity-50"
              >
                {formLoading ? 'Saving...' : 'Update Credits'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2 text-red-400">Delete User</h2>
            <p className="text-slate-400 mb-6">
              Are you sure you want to delete <strong>{selectedUser.name || selectedUser.email}</strong>? This will
              also delete all their transactions. This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 bg-slate-800 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={formLoading}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold disabled:opacity-50"
              >
                {formLoading ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Affiliate Modal (Create/Edit) */}
      {showAffiliateModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAffiliateModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-6">{editingAffiliate ? 'Edit Affiliate' : 'Create New Affiliate'}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-1">Name *</label>
                <input
                  type="text"
                  value={affName}
                  onChange={(e) => handleAffNameChange(e.target.value)}
                  placeholder="John Smith"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-1">Email *</label>
                <input
                  type="email"
                  value={affEmail}
                  onChange={(e) => setAffEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-1">Commission Rate (%)</label>
                <input
                  type="number"
                  value={affCommissionRate}
                  onChange={(e) => setAffCommissionRate(Math.min(100, Math.max(1, parseInt(e.target.value) || 0)))}
                  min="1"
                  max="100"
                  placeholder="20"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              {editingAffiliate && (
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Status</label>
                  <select
                    value={affStatus}
                    onChange={(e) => setAffStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}

              {previewCode && (
                <div className="bg-slate-800 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-2">Referral URL Preview:</div>
                  <code className="text-emerald-400 text-sm break-all">
                    https://www.hlextras.com/?ref={previewCode}
                  </code>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAffiliateModal(false)}
                className="flex-1 py-3 bg-slate-800 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAffiliate}
                disabled={formLoading}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg font-semibold disabled:opacity-50"
              >
                {formLoading ? 'Saving...' : editingAffiliate ? 'Save Changes' : 'Create Affiliate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Affiliate Modal */}
      {showDeleteAffiliateModal && selectedAffiliate && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeleteAffiliateModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2 text-red-400">Delete Affiliate</h2>
            <p className="text-slate-400 mb-6">
              Are you sure you want to delete <strong>{selectedAffiliate.name}</strong>? This will also delete all their
              commission records. This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteAffiliateModal(false)}
                className="flex-1 py-3 bg-slate-800 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAffiliate}
                disabled={formLoading}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold disabled:opacity-50"
              >
                {formLoading ? 'Deleting...' : 'Delete Affiliate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Commission Report Modal */}
      {showCommissionModal && selectedAffiliate && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCommissionModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold">Commission Report</h2>
                <p className="text-slate-400 text-sm">{selectedAffiliate.name} ({selectedAffiliate.email})</p>
              </div>
              <button
                onClick={() => setShowCommissionModal(false)}
                className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-800 rounded-lg p-4 text-center">
                <div className="text-slate-500 text-sm">Total Earned</div>
                <div className="text-xl font-bold text-emerald-400">
                  ${(selectedAffiliate.total_earned / 100).toFixed(2)}
                </div>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 text-center">
                <div className="text-slate-500 text-sm">Total Paid</div>
                <div className="text-xl font-bold text-cyan-400">
                  ${(selectedAffiliate.total_paid / 100).toFixed(2)}
                </div>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 text-center">
                <div className="text-slate-500 text-sm">Pending</div>
                <div className="text-xl font-bold text-amber-400">
                  ${((selectedAffiliate.total_earned - selectedAffiliate.total_paid) / 100).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2 mb-4">
              {(['all', 'pending', 'approved', 'paid'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setCommissionFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                    commissionFilter === status ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* Commissions Table */}
            <div className="flex-1 overflow-auto bg-slate-800 rounded-lg">
              <table className="w-full">
                <thead className="sticky top-0 bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCommissions(
                              getFilteredCommissions()
                                .filter((c) => c.status !== 'paid')
                                .map((c) => c.id)
                            );
                          } else {
                            setSelectedCommissions([]);
                          }
                        }}
                        checked={
                          selectedCommissions.length > 0 &&
                          selectedCommissions.length ===
                            getFilteredCommissions().filter((c) => c.status !== 'paid').length
                        }
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">Customer</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-400">Purchase</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-400">Commission</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-400">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredCommissions().map((commission) => (
                    <tr key={commission.id} className="border-t border-slate-700">
                      <td className="px-4 py-3">
                        {commission.status !== 'paid' && (
                          <input
                            type="checkbox"
                            checked={selectedCommissions.includes(commission.id)}
                            onChange={() => toggleCommissionSelection(commission.id)}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {new Date(commission.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {commission.users?.email || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        ${(commission.purchase_amount / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-emerald-400">
                        ${(commission.commission_amount / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            commission.status === 'paid'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : commission.status === 'approved'
                              ? 'bg-cyan-500/20 text-cyan-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {commission.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {commission.status === 'pending' && (
                          <button
                            onClick={() => handleCommissionStatusChange(commission.id, 'approved')}
                            className="px-2 py-1 bg-cyan-600 rounded text-xs hover:bg-cyan-700"
                            disabled={formLoading}
                          >
                            Approve
                          </button>
                        )}
                        {commission.status === 'approved' && (
                          <button
                            onClick={() => handleCommissionStatusChange(commission.id, 'paid')}
                            className="px-2 py-1 bg-emerald-600 rounded text-xs hover:bg-emerald-700"
                            disabled={formLoading}
                          >
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {getFilteredCommissions().length === 0 && (
                <div className="py-10 text-center text-slate-500">No commissions found</div>
              )}
            </div>

            {/* Bulk Actions */}
            {selectedCommissions.length > 0 && (
              <div className="mt-4 flex items-center justify-between bg-slate-800 rounded-lg p-4">
                <span className="text-slate-400">
                  {selectedCommissions.length} commission(s) selected
                </span>
                <button
                  onClick={handleMarkSelectedPaid}
                  disabled={formLoading}
                  className="px-4 py-2 bg-emerald-600 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {formLoading ? 'Processing...' : 'Mark Selected as Paid'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
