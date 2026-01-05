# Quick Start Guide - Get Running in 10 Minutes

## Prerequisites Check

Before you start, make sure you have:
- [ ] Node.js installed (v18 or higher) - Run: `node --version`
- [ ] npm installed - Run: `npm --version`

## Step 1: Get Your Supabase Credentials (3 minutes)

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or login
3. Click "New Project"
4. Name it "acenexa-cbt", set password, choose region
5. Wait for project to be created (1-2 minutes)
6. Go to Settings → API
7. Copy these three values:
   - Project URL
   - anon public key
   - service_role key

**Database is already set up!** The migration ran automatically when you loaded the project.

## Step 2: Get Your Paystack Keys (2 minutes)

### For Testing (Recommended First)
1. Go to [https://paystack.com](https://paystack.com)
2. Sign up
3. Go to Settings → API Keys & Webhooks
4. Copy:
   - Test Public Key (starts with pk_test_)
   - Test Secret Key (starts with sk_test_)

### For Production (Later)
- Complete business verification
- Use Live Public Key (pk_live_) and Live Secret Key (sk_live_)

## Step 3: Configure Your Project (2 minutes)

### Create .env file
```bash
cp .env.example .env
```

### Edit .env with your credentials
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
PORT=5000
```

### Update services/config.ts
Open the file and update:
```typescript
export const BACKEND_URL = "http://localhost:5000";
export const FORCE_OFFLINE = false; // Changed from true
export const PAYSTACK_PUBLIC_KEY = "pk_test_your_public_key_here";
```

## Step 4: Install & Run (3 minutes)

### Install dependencies
```bash
npm install
```

### Open two terminal windows

**Terminal 1 - Backend:**
```bash
npm start
```
You should see: "Server running on port 5000"

**Terminal 2 - Frontend:**
```bash
npm run dev
```
You should see: "Local: http://localhost:5173"

## Step 5: First Login

1. Open browser: http://localhost:5173
2. Login with default admin credentials:
   - Username: `admin`
   - Password: `admin`
3. Click the lock icon in top right to switch to admin login
4. You should see the admin dashboard

## Step 6: Change Admin Password (Important!)

1. In admin dashboard, click "Settings" tab
2. Fill in:
   - Current Username: admin
   - Current Password: admin
   - New Username: (your choice)
   - New Password: (choose strong password)
3. Click "Update Profile"
4. You'll be logged out - login with new credentials

## Step 7: Add Your First Questions

### Option A: Single Question (Quick Test)
1. Go to "Add Question" tab
2. Select exam type (JAMB or WAEC)
3. Select subject
4. Fill in question and options
5. Select correct answer
6. Click "Add to Bank"

### Option B: Bulk Upload (Faster)
1. Create a CSV file like this:
```csv
Subject,ExamType,Question,OptionA,OptionB,OptionC,OptionD,Answer,Explanation
Mathematics,JAMB,"What is 2+2?",2,3,4,5,C,Basic addition
English,JAMB,"Opposite of 'happy'",Sad,Glad,Mad,Bad,A,Antonym
```

2. Go to "Bulk Upload" tab
3. Click "Choose File"
4. Select your CSV
5. Click "Process & Upload"
6. Review and confirm

## Step 8: Test Payment Flow

1. Logout from admin
2. Click "Purchase Access Now"
3. Fill in test details:
   - Name: Test User
   - Email: test@example.com
   - Phone: 08012345678
4. Select package (e.g., "Full Access")
5. Click "Proceed to Pay"
6. Click "Pay with Card / Bank"
7. Use test card:
   - Card: 4084 0840 8408 4081
   - CVV: 408
   - Expiry: 12/25
   - PIN: 0000
   - OTP: 123456

8. You'll receive an access code like: ACE-ABCD-1234-WXYZ
9. Copy it and go back to login
10. Enter the code
11. Click "Bind to this Device" - this starts the 1-year countdown!
12. You should now be logged in

## Step 9: Verify 1-Year Validity

1. Logout and login as admin
2. Go to "Tokens" tab
3. Find your test token
4. You should see: "Valid until: [date 1 year from now]"

## Congratulations!

Your ACENEXA CBT Portal is now fully operational!

## Common Issues & Quick Fixes

### Issue: Backend won't start
**Fix:** Check if port 5000 is already in use
```bash
# Kill process on port 5000 (Mac/Linux)
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Issue: "Server returned non-JSON response"
**Fix:**
1. Make sure backend is running (Terminal 1)
2. Check `.env` file has correct Supabase credentials
3. Set `FORCE_OFFLINE = false` in `config.ts`

### Issue: Payment verification fails
**Fix:**
1. Use test keys (sk_test_ and pk_test_)
2. Use the test card numbers provided
3. Check Paystack dashboard for transaction status

### Issue: Can't see subjects when starting exam
**Fix:**
1. Login as admin
2. Go to "Subjects" tab
3. Default subjects should be there (English, Mathematics, etc.)
4. If not, add them manually

## What's Next?

- [ ] Add more questions to the database
- [ ] Test the exam flow end-to-end
- [ ] Set up production Paystack keys
- [ ] Deploy to production (see SETUP_GUIDE.md)

## Getting Help

- **Full Setup Guide:** See `SETUP_GUIDE.md`
- **Technical Details:** See `TOKEN_VALIDITY_REFERENCE.md`
- **All Changes:** See `CHANGES_SUMMARY.md`

## Development vs Production

### Current Setup (Development)
- Backend: http://localhost:5000
- Frontend: http://localhost:5173
- Database: Your Supabase project
- Payments: Test mode (sandbox)

### For Production
1. Deploy backend to Render.com or similar
2. Deploy frontend to Vercel or Netlify
3. Update `BACKEND_URL` in config.ts
4. Switch to live Paystack keys
5. Update CORS origins in server.js

See `SETUP_GUIDE.md` for detailed deployment instructions.

## File Structure

```
project/
├── .env                          # Your credentials (DO NOT COMMIT)
├── .env.example                  # Template
├── server.js                     # Backend API
├── services/
│   ├── config.ts                # Frontend config (update this)
│   ├── auth.ts                  # Authentication logic
│   └── db.ts                    # Database operations
├── components/                   # React components
├── SETUP_GUIDE.md               # Detailed setup instructions
├── TOKEN_VALIDITY_REFERENCE.md  # Technical reference
├── CHANGES_SUMMARY.md           # What was implemented
└── QUICK_START.md               # This file
```

## Support Checklist

If something doesn't work:

- [ ] Backend is running (`npm start` in Terminal 1)
- [ ] Frontend is running (`npm run dev` in Terminal 2)
- [ ] `.env` file exists and has correct values
- [ ] `FORCE_OFFLINE` is `false` in `config.ts`
- [ ] Supabase project is active
- [ ] No console errors in browser (F12)
- [ ] Tried clearing browser cache

## That's it!

You're now ready to use your ACENEXA CBT Portal with full 1-year token validity!

Happy testing!
