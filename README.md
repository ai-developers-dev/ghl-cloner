# GHL Page Cloner

A SaaS Chrome Extension that allows users to clone GoHighLevel funnel pages. Users purchase credits and each page clone uses 1 credit.

## Project Structure

```
ghl-cloner-complete/
├── web/                          # Next.js 16 web app
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # Landing page
│   │   │   ├── admin/page.tsx    # Admin dashboard
│   │   │   └── layout.tsx        # Root layout
│   │   └── lib/
│   │       └── supabase.ts       # Supabase API functions
│   └── package.json
├── chrome-extension/             # Chrome Extension (Manifest V3)
│   ├── manifest.json
│   ├── popup/                    # License UI & main interface
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── popup.css
│   ├── background/
│   │   └── service-worker.js     # Badge updates
│   ├── content-scripts/
│   │   ├── detector.js           # Message router
│   │   └── inject.js             # GHL API integration
│   └── utils/
│       └── helpers.js
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

## Pricing Tiers
| Package | Credits | Price | Per Credit |
|---------|---------|-------|------------|
| Starter | 2 | $25 | $12.50 |
| Basic | 10 | $125 | $12.50 |
| Professional | 20 | $200 | $10.00 |
| Agency | 50 | $375 | $7.50 |
| Enterprise | 100 | $500 | $5.00 |

## Admin Dashboard
- **URL**: http://localhost:3000/admin
- **Admin User**: doug@aideveloper.dev (is_admin=true)
- **Password**: ghlcloner2024

### Features
- Create new users (auto-generates license key)
- Edit user name/email/status
- Add/remove credits (logged as transactions)
- Delete users
- View all transactions

## Running the Project

### Web App
```bash
cd web
npm install
npm run dev
# Open http://localhost:3000
```

### Chrome Extension
1. Go to chrome://extensions
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `chrome-extension` folder

## How Credits Flow
1. Admin creates user in dashboard -> auto-generates license key (GHLC-XXXX-XXXX-XXXX)
2. Admin adds credits to user (logged as transaction)
3. User enters license key in Chrome extension
4. User copies a GHL page, pastes into their builder
5. On successful paste -> 1 credit deducted -> transaction logged

---

## CURRENT STATUS

### Completed
- [x] Next.js 16 web app setup
- [x] Landing page with pricing
- [x] Admin dashboard with full CRUD
- [x] Email + password login for admin
- [x] User creation with auto-generated license keys
- [x] Credit adjustment with transaction logging
- [x] Chrome extension with license validation
- [x] Copy/paste functionality
- [x] Credit deduction on successful clone
- [x] Stripe MCP installed and configured

### In Progress
- [ ] **Stripe Integration** - Create products/prices for credit packages
- [ ] Connect "Get Started" buttons to Stripe checkout
- [ ] Webhook to auto-provision credits after payment

### TODO
- [ ] Enable Supabase Row-Level Security (RLS)
- [ ] Move API calls to server-side (security)
- [ ] Email verification for new users

---

## NEXT SESSION: Stripe Setup

**IMPORTANT**: Restart Claude Code to activate Stripe MCP!

Stripe MCP has been installed and configured. On next session:

1. **Restart Claude Code** to activate Stripe MCP
2. Create Stripe products for each pricing tier:
   - Starter: 2 credits @ $25
   - Basic: 10 credits @ $125
   - Professional: 20 credits @ $200
   - Agency: 50 credits @ $375
   - Enterprise: 100 credits @ $500
3. Create checkout session API route
4. Create webhook endpoint to add credits after payment
5. Connect landing page buttons to checkout

### Stripe Configuration
- **Mode**: Live
- **API Key**: Configured in MCP (sk_live_51JrPd...)

### Files to Create for Stripe
- `web/src/app/api/checkout/route.ts` - Create checkout session
- `web/src/app/api/webhook/route.ts` - Handle Stripe webhooks
- Update `web/src/app/page.tsx` - Connect buttons to checkout

---

## Quick Reference

### Key Commands
```bash
# Start web app
cd web && npm run dev

# Check Stripe MCP status
claude mcp list
```

### Important Files
- `web/src/lib/supabase.ts` - All database functions
- `web/src/app/admin/page.tsx` - Admin dashboard
- `web/src/app/page.tsx` - Landing page
- `chrome-extension/popup/popup.js` - Extension logic
