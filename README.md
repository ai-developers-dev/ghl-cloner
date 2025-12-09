# GHL Page Cloner

A SaaS Chrome Extension that allows users to clone GoHighLevel funnel pages. Users purchase credits and each page clone uses 1 credit.

## Project Structure

```
ghl-cloner-complete/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page with affiliate signup modal
│   │   ├── admin/page.tsx        # Admin dashboard
│   │   ├── affiliate/page.tsx    # Affiliate login/dashboard
│   │   ├── affiliate/setup/      # Affiliate password setup
│   │   ├── cloner/page.tsx       # Product page
│   │   ├── download/page.tsx     # Extension download page
│   │   └── api/
│   │       ├── checkout/         # Stripe checkout
│   │       ├── webhook/          # Stripe webhooks
│   │       ├── affiliate-signup/ # Public affiliate registration
│   │       └── ...
│   ├── components/
│   │   ├── Header.tsx
│   │   └── ToolCard.tsx
│   └── lib/
│       ├── supabase.ts           # Database & affiliate functions
│       ├── email.ts              # Resend email functions
│       └── stripe.ts             # Stripe configuration
├── GHL Cloner/                   # Chrome Extension (Manifest V3)
│   ├── manifest.json
│   ├── popup/                    # License UI & main interface
│   ├── background/               # Service worker
│   └── content-scripts/          # GHL API integration
├── supabase/                     # Edge functions
└── README.md
```

## Database Schema (Supabase)

**URL**: https://yayykhctnywepnvalivp.supabase.co

### users table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | Text | Unique email |
| name | Text | User's name |
| license_key | Text | Format: GHLC-XXXX-XXXX-XXXX |
| credits | Integer | Current credit balance |
| status | Text | 'active' or 'inactive' |
| is_admin | Boolean | Admin flag for dashboard access |
| affiliate_id | UUID | Foreign key to affiliates (for tracking referrals) |
| created_at | Timestamp | Account creation date |
| updated_at | Timestamp | Last update |

### transactions table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| type | Text | 'usage', 'purchase', or 'admin_adjustment' |
| amount | Integer | Positive (add) or negative (deduct) |
| balance_after | Integer | Credit balance after transaction |
| description | Text | Transaction description |
| metadata | JSONB | Extra data (funnel_id, step_id, etc.) |
| created_at | Timestamp | Transaction date |

### affiliates table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | Text | Affiliate's name |
| email | Text | Unique email |
| code | Text | Unique referral code (e.g., "jsmith") |
| commission_rate | Decimal | Commission rate (0.20 = 20%) |
| status | Text | 'active' or 'inactive' |
| total_earned | Integer | Total commissions earned (cents) |
| total_paid | Integer | Total commissions paid out (cents) |
| password | Text | Hashed password for dashboard login |
| setup_token | Text | One-time setup token for new affiliates |
| setup_token_expires | Timestamp | Token expiration (7 days) |
| created_at | Timestamp | Account creation date |
| updated_at | Timestamp | Last update |

### affiliate_commissions table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| affiliate_id | UUID | Foreign key to affiliates |
| user_id | UUID | Foreign key to users (the customer) |
| purchase_amount | Integer | Sale amount (cents) |
| commission_amount | Integer | Commission amount (cents) |
| stripe_session_id | Text | Stripe checkout session ID |
| status | Text | 'pending', 'approved', or 'paid' |
| paid_at | Timestamp | When commission was paid |
| created_at | Timestamp | Commission date |

### sales table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| stripe_session_id | Text | Stripe checkout session ID |
| stripe_payment_intent | Text | Stripe payment intent ID |
| amount | Integer | Sale amount (cents) |
| credits | Integer | Credits purchased |
| tier | Text | Package name |
| affiliate_id | UUID | Referring affiliate (if any) |
| affiliate_commission | Integer | Commission amount (cents) |
| created_at | Timestamp | Sale date |

## Pricing Tiers
| Package | Credits | Price | Per Credit |
|---------|---------|-------|------------|
| Starter | 2 | $25 | $12.50 |
| Basic | 10 | $125 | $12.50 |
| Professional | 20 | $200 | $10.00 |
| Agency | 50 | $375 | $7.50 |
| Enterprise | 100 | $500 | $5.00 |

## Affiliate System

### Public Signup Flow
1. User clicks "Become an Affiliate" in footer
2. Modal form collects: name, email, phone
3. API creates affiliate with setup token (expires in 7 days)
4. Welcome email sent with:
   - Setup link to create password
   - Referral code and URL
   - Commission rate (20% default)
5. User clicks link → sets password at `/affiliate/setup`
6. User logs in at `/affiliate` to view dashboard

### Referral Tracking
- Referral URLs: `hlextras.com/cloner?ref={code}`
- Cookie stored for 30 days
- Commission logged on successful purchase
- Admin can approve/mark commissions as paid

### API Endpoints
- `POST /api/affiliate-signup` - Public registration
  - Body: `{ name, email, phone }`
  - Returns: `{ success, message, affiliateCode }`

### Key Files
- `src/app/page.tsx` - Contains AffiliateSignupModal component
- `src/app/api/affiliate-signup/route.ts` - Registration endpoint
- `src/app/affiliate/page.tsx` - Affiliate dashboard
- `src/app/affiliate/setup/page.tsx` - Password setup
- `src/lib/supabase.ts` - Affiliate database functions
- `src/lib/email.ts` - `sendAffiliateWelcomeEmail()`

## Admin Dashboard
- **URL**: https://hlextras.com/admin
- **Admin User**: doug@aideveloper.dev (is_admin=true)
- **Password**: ghlcloner2024

### Features
- Create/edit/delete users
- Add/remove credits (logged as transactions)
- View all transactions
- Manage affiliates
- View commissions and mark as paid
- Sales reports (daily/weekly/monthly)

## Running the Project

### Web App
```bash
npm install
npm run dev
# Open http://localhost:3000
```

### Chrome Extension
1. Go to chrome://extensions
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `GHL Cloner` folder

## How Credits Flow
1. User purchases credits via Stripe checkout
2. Webhook provisions credits automatically
3. User enters license key in Chrome extension
4. User copies a GHL page, pastes into their builder
5. On successful paste → 1 credit deducted → transaction logged

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://yayykhctnywepnvalivp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Email (Resend)
RESEND_API_KEY=re_...
ADMIN_EMAIL=doug@aideveloper.dev

# Admin
ADMIN_PASSWORD=ghlcloner2024
```

## Quick Reference

### Key Commands
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Type check
npx tsc --noEmit
```

### Important Files
- `src/lib/supabase.ts` - All database functions
- `src/lib/email.ts` - Email templates
- `src/app/admin/page.tsx` - Admin dashboard
- `src/app/page.tsx` - Landing page + affiliate modal
- `GHL Cloner/content-scripts/inject.js` - Extension clone logic
