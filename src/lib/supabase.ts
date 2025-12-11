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
  affiliate_id?: string;
  commission_rate?: number; // Commission rate for this user (0.20 = 20%)
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
  commission_rate?: number; // Commission rate (0.20 = 20%)
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
  try {
    console.log('getUserByEmail: Looking up user:', email);

    const response = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('getUserByEmail failed:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const user = Array.isArray(data) && data.length > 0 ? data[0] : null;

    console.log('getUserByEmail result:', user ? { id: user.id, email: user.email } : 'not found');
    return user;
  } catch (error) {
    console.error('getUserByEmail exception:', error);
    return null;
  }
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

export async function updateUserByEmail(email: string, data: Partial<User>): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ...data, updated_at: new Date().toISOString() })
    });

    if (!response.ok) {
      return { success: false, error: 'Failed to update user' };
    }

    return { success: true };
  } catch (error) {
    console.error('updateUserByEmail exception:', error);
    return { success: false, error: 'Network error updating user' };
  }
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

export async function useCredit(licenseKey: string, funnelId: string, stepId: string): Promise<{ success: boolean; remaining_credits?: number; error?: string; user?: { name: string; email: string; isAffiliate: boolean } }> {
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

  return {
    success: true,
    remaining_credits: newCredits,
    user: {
      name: user.name || 'Unknown',
      email: user.email || '',
      isAffiliate: user.commission_rate !== null && user.commission_rate !== undefined
    }
  };
}

// Create a new user
export async function createUser(data: CreateUserData): Promise<{ success: boolean; user?: User; error?: string }> {
  const license_key = generateLicenseKey();

  console.log('createUser: Creating user with data:', {
    email: data.email,
    name: data.name,
    credits: data.credits,
    license_key_prefix: license_key.substring(0, 9) + '...'
  });

  try {
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
        status: data.status || 'active',
        commission_rate: data.commission_rate || null
      })
    });

    // Check response status BEFORE parsing JSON
    if (!response.ok) {
      const errorText = await response.text();
      console.error('createUser failed:', response.status, errorText);
      return { success: false, error: `Database error: ${response.status} - ${errorText}` };
    }

    const users = await response.json();

    if (!Array.isArray(users) || users.length === 0) {
      console.error('createUser: Supabase returned empty result');
      return { success: false, error: 'User creation returned no data' };
    }

    console.log('createUser: User created successfully:', {
      id: users[0].id,
      email: users[0].email,
      license_key: users[0].license_key,
      credits: users[0].credits
    });

    return { success: true, user: users[0] };
  } catch (error) {
    console.error('createUser exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Network error creating user' };
  }
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

// ============================================
// AFFILIATE SYSTEM
// ============================================

export interface Affiliate {
  id: string;
  name: string;
  email: string;
  code: string;
  commission_rate: number;
  status: 'active' | 'inactive';
  total_earned: number;
  total_paid: number;
  password?: string;
  setup_token?: string;
  setup_token_expires?: string;
  created_at: string;
  updated_at: string;
}

export interface AffiliateCommission {
  id: string;
  affiliate_id: string;
  user_id: string;
  purchase_amount: number;
  commission_amount: number;
  stripe_session_id?: string;
  status: 'pending' | 'approved' | 'paid';
  paid_at?: string;
  created_at: string;
  affiliates?: { name: string; email: string; code: string };
  users?: { name: string; email: string };
}

export interface CreateAffiliateData {
  name: string;
  email: string;
  commission_rate?: number;
}

// Generate affiliate code from name (first initial + last name, lowercase)
export function generateAffiliateCode(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) {
    // If only one name, use first 6 chars
    return name.toLowerCase().replace(/[^a-z]/g, '').substring(0, 6);
  }
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  return (firstName[0] + lastName).toLowerCase().replace(/[^a-z]/g, '');
}

// Create a new affiliate
export async function createAffiliate(data: CreateAffiliateData): Promise<{ success: boolean; affiliate?: Affiliate; error?: string }> {
  const code = generateAffiliateCode(data.name);

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/affiliates`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        code: code,
        commission_rate: data.commission_rate || 0.30,
        status: 'active',
        total_earned: 0,
        total_paid: 0
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('createAffiliate failed:', response.status, errorText);
      return { success: false, error: `Database error: ${response.status}` };
    }

    const affiliates = await response.json();
    return { success: true, affiliate: affiliates[0] };
  } catch (error) {
    console.error('createAffiliate exception:', error);
    return { success: false, error: 'Network error creating affiliate' };
  }
}

// Fetch all affiliates
export async function fetchAffiliates(): Promise<Affiliate[]> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/affiliates?select=*&order=created_at.desc`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!response.ok) {
      console.error('fetchAffiliates failed:', response.status);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('fetchAffiliates exception:', error);
    return [];
  }
}

// Get affiliate by code
export async function getAffiliateByCode(code: string): Promise<Affiliate | null> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/affiliates?code=eq.${encodeURIComponent(code)}&select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!response.ok) {
      console.error('getAffiliateByCode failed:', response.status);
      return null;
    }

    const data = await response.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('getAffiliateByCode exception:', error);
    return null;
  }
}

// Update an affiliate
export async function updateAffiliate(id: string, data: Partial<Affiliate>): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/affiliates?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ...data, updated_at: new Date().toISOString() })
    });

    if (!response.ok) {
      return { success: false, error: 'Failed to update affiliate' };
    }

    return { success: true };
  } catch (error) {
    console.error('updateAffiliate exception:', error);
    return { success: false, error: 'Network error updating affiliate' };
  }
}

// Delete an affiliate
export async function deleteAffiliate(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    // First delete related commissions
    await fetch(`${SUPABASE_URL}/rest/v1/affiliate_commissions?affiliate_id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    // Then delete the affiliate
    const response = await fetch(`${SUPABASE_URL}/rest/v1/affiliates?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!response.ok) {
      return { success: false, error: 'Failed to delete affiliate' };
    }

    return { success: true };
  } catch (error) {
    console.error('deleteAffiliate exception:', error);
    return { success: false, error: 'Network error deleting affiliate' };
  }
}

// Log a commission for an affiliate
export async function logAffiliateCommission(data: {
  affiliate_id: string;
  user_id: string;
  purchase_amount: number;
  commission_amount: number;
  stripe_session_id?: string;
  status?: 'pending' | 'approved' | 'paid';
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/affiliate_commissions`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        affiliate_id: data.affiliate_id,
        user_id: data.user_id,
        purchase_amount: data.purchase_amount,
        commission_amount: data.commission_amount,
        stripe_session_id: data.stripe_session_id || null,
        status: data.status || 'pending'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('logAffiliateCommission failed:', response.status, errorText);
      return { success: false, error: 'Failed to log commission' };
    }

    return { success: true };
  } catch (error) {
    console.error('logAffiliateCommission exception:', error);
    return { success: false, error: 'Network error logging commission' };
  }
}

// Fetch commissions with optional filters
export async function fetchCommissions(filters?: {
  affiliate_id?: string;
  status?: string;
  year?: number;
  month?: number;
}): Promise<AffiliateCommission[]> {
  try {
    let url = `${SUPABASE_URL}/rest/v1/affiliate_commissions?select=*,affiliates(name,email,code),users(name,email)&order=created_at.desc`;

    if (filters?.affiliate_id) {
      url += `&affiliate_id=eq.${filters.affiliate_id}`;
    }
    if (filters?.status) {
      url += `&status=eq.${filters.status}`;
    }
    if (filters?.year && filters?.month) {
      const startDate = new Date(filters.year, filters.month - 1, 1).toISOString();
      const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59).toISOString();
      url += `&created_at=gte.${startDate}&created_at=lte.${endDate}`;
    }

    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!response.ok) {
      console.error('fetchCommissions failed:', response.status);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('fetchCommissions exception:', error);
    return [];
  }
}

// Update commission status (approve or mark as paid)
export async function updateCommissionStatus(
  commissionId: string,
  status: 'pending' | 'approved' | 'paid'
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: Record<string, unknown> = { status };
    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString();
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/affiliate_commissions?id=eq.${commissionId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      return { success: false, error: 'Failed to update commission status' };
    }

    return { success: true };
  } catch (error) {
    console.error('updateCommissionStatus exception:', error);
    return { success: false, error: 'Network error updating commission' };
  }
}

// Mark multiple commissions as paid and update affiliate total_paid
export async function markCommissionsPaid(
  commissionIds: string[],
  affiliateId: string,
  totalAmount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update all commissions to paid
    for (const id of commissionIds) {
      await updateCommissionStatus(id, 'paid');
    }

    // Get current affiliate to update total_paid
    const affiliateResponse = await fetch(`${SUPABASE_URL}/rest/v1/affiliates?id=eq.${affiliateId}&select=total_paid`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (affiliateResponse.ok) {
      const affiliates = await affiliateResponse.json();
      if (affiliates.length > 0) {
        const currentPaid = affiliates[0].total_paid || 0;
        await updateAffiliate(affiliateId, { total_paid: currentPaid + totalAmount });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('markCommissionsPaid exception:', error);
    return { success: false, error: 'Network error marking commissions paid' };
  }
}

// ============================================
// AFFILIATE AUTHENTICATION
// ============================================

// Generate a random setup token for new affiliates
export function generateSetupToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// Simple hash function for passwords (in production, use bcrypt on server)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'hlextras_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Get affiliate by email
export async function getAffiliateByEmail(email: string): Promise<Affiliate | null> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/affiliates?email=eq.${encodeURIComponent(email)}&select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!response.ok) {
      console.error('getAffiliateByEmail failed:', response.status);
      return null;
    }

    const data = await response.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('getAffiliateByEmail exception:', error);
    return null;
  }
}

// Get affiliate by ID
export async function getAffiliateById(id: string): Promise<Affiliate | null> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/affiliates?id=eq.${encodeURIComponent(id)}&select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!response.ok) {
      console.error('getAffiliateById failed:', response.status);
      return null;
    }

    const data = await response.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('getAffiliateById exception:', error);
    return null;
  }
}

// Regenerate setup token for an affiliate (for resending welcome email)
export async function regenerateAffiliateSetupToken(affiliateId: string): Promise<{ success: boolean; setupToken?: string; error?: string }> {
  const setupToken = generateSetupToken();
  const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/affiliates?id=eq.${affiliateId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        setup_token: setupToken,
        setup_token_expires: tokenExpires.toISOString(),
        updated_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      return { success: false, error: 'Failed to update setup token' };
    }

    return { success: true, setupToken };
  } catch (error) {
    console.error('regenerateAffiliateSetupToken exception:', error);
    return { success: false, error: 'Network error updating setup token' };
  }
}

// Get affiliate by setup token
export async function getAffiliateBySetupToken(token: string): Promise<Affiliate | null> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/affiliates?setup_token=eq.${encodeURIComponent(token)}&select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!response.ok) {
      console.error('getAffiliateBySetupToken failed:', response.status);
      return null;
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const affiliate = data[0];

    // Check if token is expired
    if (affiliate.setup_token_expires) {
      const expiresAt = new Date(affiliate.setup_token_expires);
      if (expiresAt < new Date()) {
        console.log('Setup token expired for affiliate:', affiliate.email);
        return null;
      }
    }

    return affiliate;
  } catch (error) {
    console.error('getAffiliateBySetupToken exception:', error);
    return null;
  }
}

// Affiliate login - validates email and password
export async function affiliateLogin(email: string, password: string): Promise<{ success: boolean; affiliate?: Affiliate; error?: string }> {
  try {
    const affiliate = await getAffiliateByEmail(email);

    if (!affiliate) {
      return { success: false, error: 'Invalid email or password' };
    }

    if (!affiliate.password) {
      return { success: false, error: 'Account not set up. Please check your email for setup instructions.' };
    }

    if (affiliate.status !== 'active') {
      return { success: false, error: 'Account is inactive. Please contact support.' };
    }

    // Hash the provided password and compare
    const hashedPassword = await hashPassword(password);
    if (hashedPassword !== affiliate.password) {
      return { success: false, error: 'Invalid email or password' };
    }

    return { success: true, affiliate };
  } catch (error) {
    console.error('affiliateLogin exception:', error);
    return { success: false, error: 'Login failed. Please try again.' };
  }
}

// Set up affiliate password using setup token
export async function setupAffiliatePassword(token: string, password: string): Promise<{ success: boolean; affiliate?: Affiliate; error?: string }> {
  try {
    const affiliate = await getAffiliateBySetupToken(token);

    if (!affiliate) {
      return { success: false, error: 'Invalid or expired setup link. Please contact support.' };
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Update affiliate with password and clear the setup token
    const response = await fetch(`${SUPABASE_URL}/rest/v1/affiliates?id=eq.${affiliate.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        password: hashedPassword,
        setup_token: null,
        setup_token_expires: null,
        updated_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      return { success: false, error: 'Failed to set up password' };
    }

    const updatedAffiliates = await response.json();
    return { success: true, affiliate: updatedAffiliates[0] };
  } catch (error) {
    console.error('setupAffiliatePassword exception:', error);
    return { success: false, error: 'Failed to set up password. Please try again.' };
  }
}

// Create affiliate with setup token (for admin use)
export async function createAffiliateWithSetupToken(data: CreateAffiliateData): Promise<{ success: boolean; affiliate?: Affiliate; setupToken?: string; error?: string }> {
  const code = generateAffiliateCode(data.name);
  const setupToken = generateSetupToken();
  const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/affiliates`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        code: code,
        commission_rate: data.commission_rate || 0.30,
        status: 'active',
        total_earned: 0,
        total_paid: 0,
        setup_token: setupToken,
        setup_token_expires: tokenExpires.toISOString()
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('createAffiliateWithSetupToken failed:', response.status, errorText);
      return { success: false, error: `Database error: ${response.status}` };
    }

    const affiliates = await response.json();
    return { success: true, affiliate: affiliates[0], setupToken };
  } catch (error) {
    console.error('createAffiliateWithSetupToken exception:', error);
    return { success: false, error: 'Network error creating affiliate' };
  }
}

// Fetch commissions for a specific affiliate (for affiliate dashboard)
export async function fetchAffiliateCommissions(affiliateId: string): Promise<AffiliateCommission[]> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/affiliate_commissions?affiliate_id=eq.${affiliateId}&select=*,users(name,email)&order=created_at.desc`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!response.ok) {
      console.error('fetchAffiliateCommissions failed:', response.status);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('fetchAffiliateCommissions exception:', error);
    return [];
  }
}

// ============================================
// SALES TRACKING & REPORTING
// ============================================

export interface Sale {
  id: string;
  user_id: string;
  stripe_session_id: string;
  stripe_payment_intent?: string;
  amount: number; // cents
  credits: number;
  tier: string;
  affiliate_id?: string;
  affiliate_commission?: number; // cents
  created_at: string;
  users?: { name: string; email: string };
  affiliates?: { name: string; code: string };
}

export interface SalesReport {
  totalSales: number;
  totalRevenue: number;
  totalCredits: number;
  totalAffiliateCommissions: number;
  salesCount: number;
  sales: Sale[];
}

// Log a sale (called from webhook)
export async function logSale(data: {
  user_id: string;
  stripe_session_id: string;
  stripe_payment_intent?: string;
  amount: number;
  credits: number;
  tier: string;
  affiliate_id?: string;
  affiliate_commission?: number;
}): Promise<{ success: boolean; sale?: Sale; error?: string }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/sales`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: data.user_id,
        stripe_session_id: data.stripe_session_id,
        stripe_payment_intent: data.stripe_payment_intent || null,
        amount: data.amount,
        credits: data.credits,
        tier: data.tier,
        affiliate_id: data.affiliate_id || null,
        affiliate_commission: data.affiliate_commission || 0
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('logSale failed:', response.status, errorText);
      return { success: false, error: `Database error: ${response.status}` };
    }

    const sales = await response.json();
    return { success: true, sale: sales[0] };
  } catch (error) {
    console.error('logSale exception:', error);
    return { success: false, error: 'Network error logging sale' };
  }
}

// Fetch sales with optional date filtering
export async function fetchSales(filters?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<Sale[]> {
  try {
    let url = `${SUPABASE_URL}/rest/v1/sales?select=*,users(name,email),affiliates(name,code)&order=created_at.desc`;

    if (filters?.startDate) {
      url += `&created_at=gte.${filters.startDate}`;
    }
    if (filters?.endDate) {
      url += `&created_at=lte.${filters.endDate}`;
    }
    if (filters?.limit) {
      url += `&limit=${filters.limit}`;
    }

    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!response.ok) {
      console.error('fetchSales failed:', response.status);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('fetchSales exception:', error);
    return [];
  }
}

// Get sales report for a date range
export async function getSalesReport(startDate: string, endDate: string): Promise<SalesReport> {
  const sales = await fetchSales({ startDate, endDate });

  const totalRevenue = sales.reduce((sum, s) => sum + s.amount, 0);
  const totalCredits = sales.reduce((sum, s) => sum + s.credits, 0);
  const totalAffiliateCommissions = sales.reduce((sum, s) => sum + (s.affiliate_commission || 0), 0);

  return {
    totalSales: sales.length,
    totalRevenue,
    totalCredits,
    totalAffiliateCommissions,
    salesCount: sales.length,
    sales
  };
}

// Helper to get date ranges
export function getDateRanges() {
  const now = new Date();

  // Today
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  // This week (Monday to Sunday)
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // This month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return {
    today: {
      start: todayStart.toISOString(),
      end: todayEnd.toISOString()
    },
    week: {
      start: weekStart.toISOString(),
      end: weekEnd.toISOString()
    },
    month: {
      start: monthStart.toISOString(),
      end: monthEnd.toISOString()
    }
  };
}

// Get all reports (daily, weekly, monthly)
export async function getAllSalesReports(): Promise<{
  daily: SalesReport;
  weekly: SalesReport;
  monthly: SalesReport;
}> {
  const ranges = getDateRanges();

  const [daily, weekly, monthly] = await Promise.all([
    getSalesReport(ranges.today.start, ranges.today.end),
    getSalesReport(ranges.week.start, ranges.week.end),
    getSalesReport(ranges.month.start, ranges.month.end)
  ]);

  return { daily, weekly, monthly };
}
