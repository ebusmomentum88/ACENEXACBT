# START HERE - 3 Step Quick Start

## Issue You're Having
- ❌ "Server returned non-JSON response (Status 404)" when adding subjects
- ❌ Payment keeps rolling/loading forever

## Root Cause
**You need TWO servers running:**
1. ✗ Backend (Node.js) - PORT 5000 - NOT RUNNING
2. ✗ Frontend (Vite) - PORT 5173 - maybe running

**Currently:** Your frontend is trying to call a backend at `http://localhost:5000` but nothing is listening there!

---

## QUICK FIX (15 Minutes)

### Step 1: Update Configuration Files

#### File 1: `services/config.ts` (Line 5, 9, 15)
```typescript
export const BACKEND_URL = "http://localhost:5000";  // ← CHANGE THIS
export const FORCE_OFFLINE = false;                  // ← Keep false
export const PAYSTACK_PUBLIC_KEY = "pk_test_xxxx";   // ← Add your test public key
```

#### File 2: `.env` (Check these exist)
```env
SUPABASE_URL=https://nskxahaavvlnduhweyuy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PAYSTACK_SECRET_KEY=sk_test_xxxx                    # ← Add your test secret key
PORT=5000
```

### Step 2: Get Your Paystack Keys

1. Go to https://paystack.com/dashboard
2. Settings → API Keys & Webhooks
3. Copy **Test Public Key** (starts with `pk_test_`)
4. Copy **Test Secret Key** (starts with `sk_test_`)
5. Paste them in:
   - Public key → `services/config.ts` line 15
   - Secret key → `.env` line 5

### Step 3: Start Both Servers

**Terminal 1: Backend**
```bash
npm start
```
Wait for: `Server running on port 5000`

**Terminal 2: Frontend** (Open NEW terminal)
```bash
npm run dev
```
Wait for: `Local: http://localhost:5173`

---

## Test It Works

### Test 1: Can You Access Backend?
```bash
curl http://localhost:5000/health
# Should return: OK
```

### Test 2: Can You Add Subjects?
1. Open http://localhost:5173
2. Admin login: `admin` / `admin`
3. Go to "Subjects" tab
4. Try adding a subject
5. ✓ Should work without 404

### Test 3: Can You Make Payment?
1. Go back to token login
2. Click "Purchase Access Now"
3. Fill details and proceed to payment
4. Use test card: `4084 0840 8408 4081`
5. ✓ Should get access code quickly

---

## If Still Not Working

### Check 1: Is Backend Actually Running?
```bash
# In Terminal 1, you should see:
Server running on port 5000

# If you see error, read that error message!
```

### Check 2: Did You Update config.ts?
Open `services/config.ts` and verify line 5:
```typescript
export const BACKEND_URL = "http://localhost:5000";  // NOT onrender or production URL
```

### Check 3: Is Port 5000 Free?
```bash
# Mac/Linux
lsof -i :5000

# Windows
netstat -ano | findstr :5000

# If something is using it, either:
# 1. Stop that process
# 2. Change PORT in .env to 5001, update config.ts to :5001
```

### Check 4: Open Browser DevTools (F12)
1. Go to Network tab
2. Try adding subject again
3. Look for request to `/api/subjects`
4. Click it and check the error

**Common errors:**
- `404` → Backend not running
- `CORS error` → Backend running but config wrong
- `No response` → Backend crashed

### Check 5: Do You Have Paystack Keys?
- In `services/config.ts` line 15, value should start with `pk_test_`
- In `.env` line 5, value should start with `sk_test_`
- If they have `xxxx` or are blank → Update them!

---

## Complete Checklist Before Testing

- [ ] `services/config.ts` line 5 = `"http://localhost:5000"`
- [ ] `services/config.ts` line 9 = `false`
- [ ] `services/config.ts` line 15 = starts with `pk_test_`
- [ ] `.env` has 5 lines (SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY, PAYSTACK_SECRET_KEY, PORT)
- [ ] `.env` PAYSTACK_SECRET_KEY starts with `sk_test_`
- [ ] Terminal 1: `npm start` running (Backend)
- [ ] Terminal 2: `npm run dev` running (Frontend)
- [ ] Browser: http://localhost:5173 accessible
- [ ] Backend: `curl http://localhost:5000/health` returns OK

---

## What's Running Where?

```
Your Browser: http://localhost:5173 (Frontend - Vite)
                    ↓ API calls ↓
Your Backend: http://localhost:5000 (Node.js - Express)
                    ↓ Database ↓
Supabase:    https://nskxahaavvlnduhweyuy.supabase.co (Hosted Database)
                    ↓ Payment ↓
Paystack:    https://api.paystack.co (Payment Gateway)
```

All parts need to work together for full functionality.

---

## 2-Minute Summary

The error happens because:
1. Your backend isn't running at `http://localhost:5000`
2. Your frontend tries to call it but gets nothing back
3. Browser shows "404 - Server unreachable"

Fix by:
1. Update config files with correct URLs
2. Add Paystack test keys
3. Run `npm start` (backend)
4. Run `npm run dev` (frontend)
5. Open http://localhost:5173

That's it! You should be up and running.

---

## If You Get Stuck

Read this file in order:
1. **This file** (you're reading it) - Quick overview
2. **QUICK_START.md** - 10-minute walkthrough
3. **TROUBLESHOOTING.md** - Detailed debugging
4. **SETUP_GUIDE.md** - Complete reference

**Something still broken?** The error messages will tell you what's wrong. Read the console carefully!

---

**Last Updated:** January 2026
**Status:** All systems ready, just needs to be started
