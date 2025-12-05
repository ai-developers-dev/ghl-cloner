// Supabase Configuration - Read from environment variables
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ghlcloner2024'; // Fallback password

export interface User {
  id: string;
  email: string;
  name: string;
  license_key: string;
  credits: number;
  status: 'active' | 'inactive';
  is_admin?: boolean;
  created_at: string;
  updated_at: string;
}

// Admin login - checks email and password
export async function adminLogin(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  // Check if user exists and is admin
  const response = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}&is_admin=eq.true&select=*`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  const data = await response.json();

  if (!Array.isArray(data) || data.length === 0) {
    return { success: false, error: 'Invalid email or not an admin' };
  }

  const user = data[0];

  // Check password (using the shared admin password for now)
  // In production, you'd want to hash passwords properly
  if (password !== ADMIN_PASSWORD) {
    return { success: false, error: 'Invalid password' };
  }

  return { success: true, user };
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'usage' | 'purchase' | 'admin_adjustment';
  amount: number;
  balance_after: number;
  description: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  users?: { email: string; name: string };
}

export interface CreateUserData {
  name: string;
  email: string;
  credits?: number;
  status?: 'active' | 'inactive';
}

// Generate a unique license key
export function generateLicenseKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `GHLC-${segment()}-${segment()}-${segment()}`;
}

// API Functions
export async function validateLicense(licenseKey: string): Promise<{ valid: boolean; user?: User; error?: string }> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/users?license_key=eq.${licenseKey}&select=*`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  const data = await response.json();

  if (data.length > 0 && data[0].status === 'active') {
    return { valid: true, user: data[0] };
  }
  return { valid: false, error: 'Invalid license key' };
}

export async function getUser(licenseKey: string): Promise<User | null> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/users?license_key=eq.${licenseKey}&select=*`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  const data = await response.json();
  return data[0] || null;
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=*`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  const data = await response.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

// Add credits to existing user (for purchases)
export async function addCredits(
  userId: string,
  currentCredits: number,
  amount: number,
  description: string,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  const newBalance = currentCredits + amount;

  // Update user credits
  const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ credits: newBalance })
  });

  if (!updateResponse.ok) {
    return { success: false, error: 'Failed to update credits' };
  }

  // Log the transaction
  await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user_id: userId,
      type: 'purchase',
      amount: amount,
      balance_after: newBalance,
      description: description,
      metadata: metadata || {}
    })
  });

  return { success: true, newBalance };
}

export async function fetchUsers(): Promise<User[]> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/users?select=*&order=created_at.desc`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/transactions?select=*,users(email,name)&order=created_at.desc&limit=50`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function useCredit(licenseKey: string, funnelId: string, stepId: string): Promise<{ success: boolean; remaining_credits?: number; error?: string }> {
  const user = await getUser(licenseKey);
  if (!user) return { success: false, error: 'User not found' };
  if (user.credits <= 0) return { success: false, error: 'No credits remaining' };

  const newCredits = user.credits - 1;
  await fetch(`${SUPABASE_URL}/rest/v1/users?license_key=eq.${licenseKey}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ credits: newCredits })
  });

  await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user_id: user.id,
      type: 'usage',
      amount: -1,
      balance_after: newCredits,
      description: 'Page clone',
      metadata: { funnel_id: funnelId, step_id: stepId }
    })
  });

  return { success: true, remaining_credits: newCredits };
}

// Create a new user
export async function createUser(data: CreateUserData): Promise<{ success: boolean; user?: User; error?: string }> {
  const license_key = generateLicenseKey();

  const response = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      license_key,
      email: data.email,
      name: data.name,
      credits: data.credits || 0,
      status: data.status || 'active'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    return { success: false, error: error.message || 'Failed to create user' };
  }

  const users = await response.json();
  return { success: true, user: users[0] };
}

// Update an existing user
export async function updateUser(id: string, data: Partial<User>): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    return { success: false, error: 'Failed to update user' };
  }

  return { success: true };
}

// Delete a user
export async function deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
  // First delete related transactions
  await fetch(`${SUPABASE_URL}/rest/v1/transactions?user_id=eq.${id}`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });

  // Then delete the user
  const response = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${id}`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });

  if (!response.ok) {
    return { success: false, error: 'Failed to delete user' };
  }

  return { success: true };
}

// Adjust credits with transaction logging
export async function adjustCredits(
  userId: string,
  currentCredits: number,
  amount: number,
  description: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  const newBalance = currentCredits + amount;

  // Update user credits
  const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ credits: newBalance })
  });

  if (!updateResponse.ok) {
    return { success: false, error: 'Failed to update credits' };
  }

  // Log the transaction
  await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user_id: userId,
      type: 'admin_adjustment',
      amount: amount,
      balance_after: newBalance,
      description: description || 'Admin credit adjustment'
    })
  });

  return { success: true, newBalance };
}
