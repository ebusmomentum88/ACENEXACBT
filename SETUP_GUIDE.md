# ACENEXA CBT Portal - Complete Setup Guide

This guide will help you set up the ACENEXA CBT Portal with full backend, database, and payment integration.

## Prerequisites

- Node.js (v18 or higher)
- A Supabase account (free tier is fine)
- A Paystack account (for payment processing)
- Git (for deployment)

## Part 1: Database Setup (Supabase)

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in the details:
   - Name: ACENEXA-CBT
   - Database Password: (Choose a strong password)
   - Region: (Choose closest to your users)
4. Click "Create new project" and wait for setup to complete

### Step 2: Get Your Database Credentials

1. In your Supabase project dashboard, click on "Settings" (gear icon)
2. Click on "API" in the sidebar
3. Copy these values:
   - **Project URL** (e.g., https://xxxxx.supabase.co)
   - **anon public key** (starts with eyJhbGc...)
   - **service_role key** (starts with eyJhbGc... but different from anon)

### Step 3: Run the Database Migration

1. In Supabase dashboard, click "SQL Editor" in the left sidebar
2. Click "New Query"
3. The migration has already been applied during setup, but if you need to verify:
   - Go to "Database" → "Tables"
   - You should see: `users`, `access_tokens`, `questions`, `results`, `subjects`

## Part 2: Payment Setup (Paystack)

### Step 1: Create a Paystack Account

1. Go to [https://paystack.com](https://paystack.com) and sign up
2. Complete your business verification (required for live payments)
3. For testing, you can use test mode immediately

### Step 2: Get Your API Keys

1. Login to Paystack Dashboard
2. Go to "Settings" → "API Keys & Webhooks"
3. Copy these keys:
   - **Test Public Key** (starts with pk_test_)
   - **Test Secret Key** (starts with sk_test_)
   - For production, use **Live Public Key** (pk_live_) and **Live Secret Key** (sk_live_)

## Part 3: Local Development Setup

### Step 1: Configure Environment Variables

1. Open the project folder
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and fill in your credentials:
   ```env
   # Supabase Configuration
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

   # Paystack Configuration (Use test keys for development)
   PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here

   # Server Configuration
   PORT=5000
   ```

### Step 2: Configure Frontend Settings

1. Open `services/config.ts`
2. Update the following:
   ```typescript
   export const BACKEND_URL = "http://localhost:5000"; // For local dev
   export const FORCE_OFFLINE = false; // Set to false to use real backend
   export const PAYSTACK_PUBLIC_KEY = "pk_test_your_public_key_here";
   ```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Run the Application

**Terminal 1 - Backend:**
```bash
npm start
```

**Terminal 2 - Frontend (in a new terminal):**
```bash
npm run dev
```

The application should now be running at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Part 4: Default Admin Access

The system comes with a default admin account:

- **Username:** admin
- **Password:** admin

**IMPORTANT:** Change these credentials immediately after first login!

1. Login as admin
2. Go to "Settings" tab
3. Update your admin credentials

## Part 5: Testing Payment Flow

### Test Payment (Sandbox Mode)

1. Set up test keys in `.env` and `config.ts`
2. Go to the payment page
3. Use Paystack test card numbers:
   - Card: 4084 0840 8408 4081
   - CVV: 408
   - Expiry: Any future date
   - PIN: 0000
   - OTP: 123456

### Live Payment (Production Mode)

1. Complete Paystack business verification
2. Replace test keys with live keys in:
   - `.env` (PAYSTACK_SECRET_KEY)
   - `services/config.ts` (PAYSTACK_PUBLIC_KEY)
3. Deploy to production (see deployment section)

## Part 6: How the 1-Year Validity Works

### Access Code Lifecycle

1. **Code Generation:**
   - When a payment is verified, a unique access code is generated
   - Code is NOT yet bound to any device
   - No expiry date is set yet

2. **First Login (Device Binding):**
   - Student enters the access code
   - System prompts for confirmation to bind to this device
   - Upon confirmation:
     - Code is locked to this specific device (browser + hardware signature)
     - `bound_at` timestamp is set to current date/time
     - `expires_at` is automatically set to 1 year from `bound_at`

3. **Subsequent Logins:**
   - Student can only login from the same device
   - Each login checks if current date is before `expires_at`
   - If expired, access is denied with expiry date message

4. **Admin Controls:**
   - Admin can reset device lock (allows re-binding to a different device)
   - Admin can manually deactivate codes
   - Admin can view all tokens with expiry dates in the Admin Panel

### Admin Panel - Token Management

The admin panel shows:
- **Active/Inactive Status:** Manual admin control
- **Locked/Unlocked:** Device binding status
- **Expiry Date:** Shows "Valid until DD-MMM-YYYY" or "Expired: DD-MMM-YYYY"
- **Actions:**
  - Reset Device Lock (unbind device, allows re-binding)
  - Activate/Deactivate (manual control)
  - Delete Token

## Part 7: Deployment to Production

### Option A: Render.com (Recommended)

1. Push your code to GitHub
2. Go to [Render.com](https://render.com) and sign up
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - Name: acenexa-cbt
   - Environment: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
6. Add Environment Variables (from your `.env`)
7. Click "Create Web Service"

### Option B: Vercel (Frontend) + Render (Backend)

**Backend (Render):**
- Same as Option A above

**Frontend (Vercel):**
1. Go to [Vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Framework Preset: Vite
4. Update `services/config.ts`:
   ```typescript
   export const BACKEND_URL = "https://your-backend.onrender.com";
   ```
5. Deploy

### Update Production URLs

After deployment, update:

1. **server.js** - Add your production URL to CORS:
   ```javascript
   const allowedOrigins = [
     'https://your-vercel-app.vercel.app', // Add your frontend URL
     'https://your-backend.onrender.com',
     // ... existing URLs
   ];
   ```

2. **config.ts** - Set production backend URL:
   ```typescript
   export const BACKEND_URL = "https://your-backend.onrender.com";
   ```

## Part 8: Adding Questions to the Database

### Method 1: Single Question Entry (Admin Panel)

1. Login as admin
2. Go to "Add Question" tab
3. Fill in the form:
   - Exam Type (JAMB or WAEC)
   - Subject
   - Question text
   - All 4 options
   - Correct answer
   - Explanation (optional)
4. Click "Add to Bank"

### Method 2: Bulk Upload (CSV)

1. Create a CSV file with this format:
   ```csv
   Subject,ExamType,Question,OptionA,OptionB,OptionC,OptionD,Answer,Explanation
   Mathematics,JAMB,"What is 2+2?",2,3,4,5,C,Basic addition
   English,WAEC,"Choose the correct spelling",Recieve,Receive,Recive,Receeve,B,I before E except after C
   ```

2. In Admin Panel, go to "Bulk Upload" tab
3. Click "Choose File" and select your CSV
4. Click "Process & Upload"
5. Review the preview and confirm

## Part 9: Managing Subjects

### Adding New Subjects

1. Login as admin
2. Go to "Subjects" tab
3. Enter subject name
4. Select category (General/Science/Commercial/Arts)
5. Click "Add Subject"

### Deleting Subjects

- Note: Deleting a subject does NOT delete its questions
- Questions remain in the database and can be accessed

## Part 10: Troubleshooting

### Issue: "Server returned non-JSON response (Status 404)"

**Solution:**
1. Make sure backend is running: `npm start`
2. Check `.env` file has correct Supabase credentials
3. Verify `FORCE_OFFLINE` is set to `false` in `config.ts`
4. Check network tab in browser for actual error

### Issue: "Payment verification failed"

**Solution:**
1. Verify Paystack secret key in `.env` is correct
2. Check if you're using test keys in test mode
3. Ensure webhook URL is configured in Paystack (for production)

### Issue: "Access Code Expired"

**Explanation:**
- Access codes expire exactly 1 year after first device binding
- This is expected behavior
- User needs to purchase a new access code

**Admin Action:**
- Cannot extend expired codes
- Admin can generate a new manual token for the user

### Issue: "Device Already Bound"

**Solution:**
1. In Admin Panel, find the token
2. Click "Reset Device Lock" button
3. Student can now re-bind the code to a new device

## Part 11: Best Practices

### Security

1. Change default admin credentials immediately
2. Use strong passwords
3. Never commit `.env` file to Git
4. Use test keys for development only
5. Enable 2FA on Supabase and Paystack accounts

### Performance

1. Add indexes to frequently queried fields (already done in migration)
2. Monitor Supabase database usage
3. Consider upgrading Supabase plan for production

### Backup

1. Supabase provides automatic backups
2. Export questions regularly from Admin Panel
3. Keep a backup of your `.env` file securely

## Part 12: Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Supabase logs in dashboard
3. Check browser console for errors
4. Verify all environment variables are set correctly

## Summary Checklist

- [ ] Supabase project created
- [ ] Database migration applied
- [ ] Supabase credentials added to `.env`
- [ ] Paystack account created
- [ ] Paystack keys added to `.env` and `config.ts`
- [ ] Dependencies installed
- [ ] Backend running successfully
- [ ] Frontend running successfully
- [ ] Admin login working
- [ ] Admin credentials changed
- [ ] Test payment successful
- [ ] Questions added to database
- [ ] Production deployment complete
- [ ] Production URLs updated in code

Your ACENEXA CBT Portal is now fully operational with 1-year access code validity!
