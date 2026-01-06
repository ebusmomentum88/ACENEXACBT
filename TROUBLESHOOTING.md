# Troubleshooting: Subject 404 & Payment Rolling Issues

## Problem 1: "Server returned non-JSON response (Status 404)" - Adding Subjects

This error means the backend is either not running or not reachable.

### Solution Checklist:

#### Step 1: Verify Backend is Running
```bash
# In a terminal, run:
npm start
```

You should see:
```
Server running on port 5000
```

If it doesn't, check:
- Do you have all dependencies? Run: `npm install`
- Is port 5000 free? Check: `lsof -i :5000` (Mac/Linux)
- Any Node errors? Look at the terminal output

#### Step 2: Verify Frontend Configuration
Open `services/config.ts` and ensure:
```typescript
export const BACKEND_URL = "http://localhost:5000"; // Must be localhost for local dev
export const FORCE_OFFLINE = false; // Must be false
```

#### Step 3: Test the Connection
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to add a subject
4. Look for a failed request to `http://localhost:5000/api/subjects`
5. Click on it to see the actual error

**Common Issues:**
- ✗ If URL shows `https://ebus-edu-consult-main.onrender.com` → Update config.ts
- ✗ If URL shows `undefined` → Check if config.ts is importing correctly
- ✗ If you see "CORS error" → Backend is running but might have wrong CORS setup

#### Step 4: Check .env File
Verify your `.env` file has these lines (EXACTLY):
```env
SUPABASE_URL=https://nskxahaavvlnduhweyuy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PAYSTACK_SECRET_KEY=sk_test_your_key_here
PORT=5000
```

**Note:** Make sure you're editing the `.env` file, NOT `.env.example`

---

## Problem 2: Payment "Rolling" (Keeps Loading)

The payment never completes and keeps showing the loading spinner.

### Solution Checklist:

#### Step 1: Verify Paystack Configuration
Open `services/config.ts` and check:
```typescript
export const PAYSTACK_PUBLIC_KEY = "pk_test_something"; // Must START with pk_test_
```

**Fix if needed:**
1. Go to [https://paystack.com/dashboard](https://paystack.com/dashboard)
2. Go to Settings → API Keys & Webhooks
3. Copy your **Test Public Key** (starts with `pk_test_`)
4. Update `config.ts`:
```typescript
export const PAYSTACK_PUBLIC_KEY = "pk_test_your_actual_key_here";
```

#### Step 2: Verify Backend Paystack Secret Key
Open `.env` and check:
```env
PAYSTACK_SECRET_KEY=sk_test_something  # Must START with sk_test_
```

**Fix if needed:**
1. Go to [https://paystack.com/dashboard](https://paystack.com/dashboard)
2. Go to Settings → API Keys & Webhooks
3. Copy your **Test Secret Key** (starts with `sk_test_`)
4. Update `.env`:
```env
PAYSTACK_SECRET_KEY=sk_test_your_actual_key_here
```

#### Step 3: Restart Backend After Changing .env
```bash
# Stop the running backend (Ctrl+C)
# Then restart:
npm start
```

**Why?** The backend loads `.env` when it starts. Changes take effect only after restart.

#### Step 4: Test Paystack Integration
1. Frontend: http://localhost:5173 → Try to add subject (NOT payment yet)
2. If subject works → Backend is connected ✓
3. If subject still fails → Follow "Problem 1" solution first
4. Once subjects work, try payment

#### Step 5: Check Payment Verification
When payment completes:
1. Open DevTools (F12)
2. Go to Network tab
3. Look for a request to `/api/payments/verify-paystack`
4. Check the response for errors

**Common responses:**
- ✓ `{ "success": true, "token": "ACE-..." }` → Payment worked!
- ✗ `{ "error": "Server Error: Could not verify payment." }` → Backend issue
- ✗ "Failed to fetch" → Backend not running
- ✗ "CORS error" → Backend CORS issue

---

## Step-by-Step: Get Everything Working

### Part 1: Backend Setup (5 minutes)

1. **Install dependencies:**
```bash
npm install
```

2. **Update `.env` file:**
   - Open `.env` (NOT `.env.example`)
   - Make sure it has:
     ```env
     SUPABASE_URL=https://nskxahaavvlnduhweyuy.supabase.co
     SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     PAYSTACK_SECRET_KEY=sk_test_your_secret_key
     PORT=5000
     ```

3. **Start backend:**
```bash
npm start
```
Wait for: `Server running on port 5000`

### Part 2: Frontend Setup (5 minutes)

1. **Open NEW terminal** (keep backend running in first terminal)

2. **Update `services/config.ts`:**
   - Line 5: `export const BACKEND_URL = "http://localhost:5000";`
   - Line 9: `export const FORCE_OFFLINE = false;`
   - Line 15: `export const PAYSTACK_PUBLIC_KEY = "pk_test_your_public_key";`

3. **Start frontend:**
```bash
npm run dev
```
Should show: `Local: http://localhost:5173`

### Part 3: Test Everything

1. **Open** http://localhost:5173 in browser
2. **Test subjects:**
   - Go to admin login
   - Username: admin, Password: admin
   - Go to "Subjects" tab
   - Try to add a new subject
   - Should work without 404 error

3. **Test payment:**
   - Go back to token login
   - Click "Purchase Access Now"
   - Fill in details
   - Select package
   - Try test payment with:
     - Card: 4084 0840 8408 4081
     - CVV: 408
     - Expiry: 12/25
     - PIN: 0000
   - Should get access code

---

## Debugging Checklist

### If subjects still show 404:
- [ ] Backend is running (`npm start` in Terminal 1)
- [ ] No TypeScript errors in backend terminal
- [ ] `config.ts` has `BACKEND_URL = "http://localhost:5000"`
- [ ] `config.ts` has `FORCE_OFFLINE = false`
- [ ] Browser shows request to `http://localhost:5000/api/subjects` in Network tab
- [ ] Paystack SDK is loaded (check Browser Console for Paystack errors)

### If payment keeps rolling:
- [ ] Backend is running
- [ ] `.env` has `PAYSTACK_SECRET_KEY` starting with `sk_test_`
- [ ] `config.ts` has `PAYSTACK_PUBLIC_KEY` starting with `pk_test_`
- [ ] Backend was restarted AFTER updating `.env`
- [ ] Payment verification request shows in Network tab
- [ ] Browser Console has no CORS or Paystack errors

---

## Terminal Commands Reference

```bash
# Install dependencies
npm install

# Start backend (Terminal 1)
npm start

# Start frontend (Terminal 2 - new terminal)
npm run dev

# Build for production
npm run build

# Kill process on port 5000 (if stuck)
lsof -ti:5000 | xargs kill -9  # Mac/Linux
netstat -ano | findstr :5000   # Windows (then taskkill /PID <PID> /F)

# Check if Supabase is accessible
curl https://nskxahaavvlnduhweyuy.supabase.co

# Test backend is running
curl http://localhost:5000/health
# Should return: OK
```

---

## Browser Console Tips

1. **Open DevTools:** Press F12
2. **Go to Console tab**
3. **Look for errors** in red/orange
4. **Network tab:**
   - Click on request
   - Look at "Response" tab
   - Check for actual error message

**Example errors:**
```
GET http://localhost:5000/api/subjects 404
→ Backend not running or endpoint wrong

CORS error: blocked by browser
→ Backend running but CORS misconfigured

Paystack error: key not found
→ PAYSTACK_PUBLIC_KEY wrong in config.ts
```

---

## When to Contact Support

If you've followed all steps and still have issues:
1. Take a screenshot of the error message
2. Note the exact error in browser console
3. Verify `.env` file has all 4 required keys
4. Verify `config.ts` has correct values
5. Confirm both terminals show no errors

---

## Important Notes

- **Backend MUST be running** for any API calls to work
- **Do NOT change VITE_* variables** in `.env` - use SUPABASE_* instead
- **Test mode only:** Use `sk_test_` and `pk_test_` keys
- **Production mode:** Use `sk_live_` and `pk_live_` keys
- **Changes to `.env`:** Require backend restart to take effect
- **Changes to `config.ts`:** Require browser refresh (or frontend restart)

---

## Expected Behavior After Fix

✓ Can add subjects without 404 error
✓ Admin panel loads subjects list
✓ Payment form shows up
✓ Clicking "Pay with Card" opens Paystack popup
✓ Test card payment completes
✓ Receive access code after payment
✓ Can login with access code
✓ Can start exam

If you see all of these, everything is working correctly!
