import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import axios from 'axios';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS SETUP ---
const allowedOrigins = [
  'https://ebus-edu-consult-main-i97f.vercel.app',
  'https://ebus-edu-consult-main.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) return callback(null, true);
    return callback(null, true);
  }
}));

app.use(express.json({ limit: '50mb' }));

// --- SUPABASE SETUP ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) console.error("Missing Supabase credentials.");

const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co', 
    supabaseKey || 'placeholder', 
    { auth: { persistSession: false } }
);

// --- HELPERS ---

// Generate Access Code
const generateAccessCode = (prefix = 'ACE') => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const length = 12;
  const randomBytes = crypto.randomBytes(length);

  let result = '';
  for (let i = 0; i < length; i++) {
    const index = randomBytes[i] % chars.length;
    result += chars[index];
  }
  return `${prefix}-${result.slice(0,4)}-${result.slice(4,8)}-${result.slice(8,12)}`;
};

// Create Access Code (student or admin)
async function createAccessCode({ createdBy = 'student', price = 0 }) {
  const code = generateAccessCode('ACE');
  const { data, error } = await supabase
      .from('access_codes')
      .insert([{ code, price, created_by: createdBy }])
      .select()
      .single();
  if (error) throw error;
  return data.code;
}

// Bind Access Code to Candidate & Device
async function bindAccessCode({ code, candidateId, deviceFingerprint }) {
  const { data, error } = await supabase
      .from('access_codes')
      .select('*')
      .eq('code', code)
      .single();
  if (error || !data) throw new Error('Invalid Access Code');

  if (data.is_used && data.device_fingerprint !== deviceFingerprint) {
      throw new Error('Access Code already used on another device');
  }

  const { error: updateError } = await supabase
      .from('access_codes')
      .update({
        candidate_id: candidateId,
        device_fingerprint: deviceFingerprint,
        is_used: true,
        updated_at: new Date()
      })
      .eq('id', data.id);

  if (updateError) throw updateError;
  return { success: true, message: 'Access Code bound to device' };
}

// Verify Offline Access
async function verifyOfflineAccess({ code, deviceFingerprint }) {
  const { data, error } = await supabase
      .from('access_codes')
      .select('*')
      .eq('code', code)
      .eq('device_fingerprint', deviceFingerprint)
      .single();
  if (error || !data) throw new Error('Access Code not valid on this device');
  return { success: true, candidateId: data.candidate_id };
}

// --- ROUTES ---

// Health Check
app.get('/health', (req, res) => res.status(200).send('OK'));

// PAYMENT VERIFICATION & TOKEN GENERATION
app.post('/api/payments/verify-paystack', async (req, res) => {
  const { reference, email, fullName, phoneNumber, examType } = req.body;
  if (!reference) return res.status(400).json({ error: "Missing transaction reference." });
  if (!paystackSecretKey) return res.status(500).json({ error: "Missing Paystack Key" });

  try {
    const { data: existingToken } = await supabase
      .from('access_tokens')
      .select('token_code, is_active')
      .eq('metadata->>payment_ref', reference)
      .single();

    if (existingToken) return res.json({ success: true, token: existingToken.token_code, message: "Payment already verified." });

    const paystackUrl = `https://api.paystack.co/transaction/verify/${reference}`;
    const verifyRes = await axios.get(paystackUrl, { headers: { Authorization: `Bearer ${paystackSecretKey}` } });
    const data = verifyRes.data.data;

    if (data.status !== 'success' || data.amount < 150000) return res.status(400).json({ error: "Payment verification failed." });

    const tokenCode = generateAccessCode('ACE');
    const finalExamType = examType || 'BOTH';

    const { data: dbData, error } = await supabase
      .from('access_tokens')
      .insert([{
          token_code: tokenCode,
          is_active: true,
          device_fingerprint: null,
          metadata: {
              payment_ref: reference,
              amount_paid: data.amount / 100,
              exam_type: finalExamType,
              full_name: fullName,
              phone_number: phoneNumber,
              email: email,
              paystack_id: data.id,
              verified_at: new Date().toISOString()
          }
      }])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, token: dbData.token_code });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Server Error: Could not verify payment." });
  }
});

// ADMIN ROUTES
app.post('/api/admin/generate-code', async (req, res) => {
  const { price = 0 } = req.body;
  try {
    const code = await createAccessCode({ createdBy: 'admin', price });
    res.json({ success: true, code });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/access-code/purchase', async (req, res) => {
  const { price } = req.body;
  try {
    const code = await createAccessCode({ createdBy: 'student', price });
    res.json({ success: true, code });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// LOGIN WITH TOKEN AND DEVICE BINDING
app.post('/api/auth/login-with-token', async (req, res) => {
  const { token, deviceFingerprint, confirm_binding, candidateId } = req.body;
  try {
    const { data: tokenData, error } = await supabase.from('access_codes').select('*').eq('code', token).single();
    if (error || !tokenData) return res.status(401).json({ error: 'Invalid Access Token.' });
    if (!tokenData.is_active) return res.status(403).json({ error: 'This token has been deactivated.' });

    if (!tokenData.device_fingerprint) {
      if (!confirm_binding) return res.json({ requires_binding: true });
      const result = await bindAccessCode({ code: token, candidateId, deviceFingerprint });
      return res.json({ success: true, message: result.message });
    } else {
      if (tokenData.device_fingerprint !== deviceFingerprint) {
        return res.status(403).json({ error: 'Access Code locked to another device.' });
      }
    }

    res.json({ success: true, candidateId: tokenData.candidate_id, token, message: 'Access Code valid for this device' });
  } catch (err) {
    console.error('Token login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- EXISTING USER AUTH, SUBJECTS, QUESTIONS, RESULTS ROUTES ---
// Keep all your original /api/auth/login, /api/subjects, /api/questions, /api/results endpoints here
// You can copy them as-is from your existing server.js

// --- SERVE FRONTEND ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
} else {
  app.get('*', (req, res) => {
    res.status(503).send(`
      <h1>Website Building...</h1>
      <p>The backend is running, but the frontend files are missing.</p>
      <p>Ensure Build Command: <code>npm install && npm run build</code></p>
    `);
  });
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
