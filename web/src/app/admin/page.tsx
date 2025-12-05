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
} from '@/lib/supabase';

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'transactions'>('users');

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
      const [usersData, txData] = await Promise.all([fetchUsers(), fetchTransactions()]);
      setUsers(usersData);
      setTransactions(txData);
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
          <div className="flex gap-2 ml-auto">
            {activeTab === 'users' && (
              <button
                onClick={openCreateModal}
                className="px-5 py-2.5 rounded-lg font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500"
              >
                + New User
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
    </div>
  );
}
