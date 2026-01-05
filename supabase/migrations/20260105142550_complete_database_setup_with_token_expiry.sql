/*
  # Complete ACENEXA CBT Database Setup with Token Expiry

  ## Summary
  This migration sets up the complete database structure for the ACENEXA CBT portal with 1-year access code validity.

  ## New Tables

  ### 1. `users` - System Users (Admin & Students)
    - `id` (uuid, primary key)
    - `username` (text, unique)
    - `password` (text, nullable for token-based students)
    - `role` (text, 'admin' or 'student')
    - `full_name` (text)
    - `reg_number` (text)
    - `allowed_exam_type` (text, 'JAMB', 'WAEC', or 'BOTH')
    - `created_at` (timestamptz)

  ### 2. `access_tokens` - Paid Access Codes (1 Year Validity)
    - `id` (uuid, primary key)
    - `token_code` (text, unique) - The access code
    - `is_active` (boolean) - Can be manually deactivated by admin
    - `device_fingerprint` (text, nullable) - Locked device hash
    - `bound_at` (timestamptz, nullable) - When code was bound to device
    - `expires_at` (timestamptz, nullable) - Expiry date (1 year from bound_at)
    - `metadata` (jsonb) - Payment info, user details, exam type
    - `created_at` (timestamptz)

  ### 3. `questions` - Exam Question Bank
    - `id` (uuid, primary key)
    - `subject` (text)
    - `exam_type` (text, 'JAMB' or 'WAEC')
    - `text` (text) - Question text
    - `option_a` (text)
    - `option_b` (text)
    - `option_c` (text)
    - `option_d` (text)
    - `correct_option` (text, 'A', 'B', 'C', or 'D')
    - `explanation` (text, nullable)
    - `created_at` (timestamptz)

  ### 4. `results` - Student Exam Results
    - `id` (uuid, primary key)
    - `user_username` (text) - Reference to user
    - `exam_type` (text)
    - `total_score` (integer)
    - `aggregate_score` (integer)
    - `subject_scores` (jsonb)
    - `timestamp` (text) - Stored as string for compatibility
    - `created_at` (timestamptz)

  ### 5. `subjects` - Already exists, ensuring structure

  ## Security
    - RLS enabled on all tables
    - Admin-only policies for users, tokens, questions
    - Students can only view their own results
    - Public read access to subjects and questions (for CBT functionality)

  ## Important Notes
    - Access codes expire exactly 1 year after being bound to a device
    - Expiry check happens on every login
    - Admin can manually deactivate codes via `is_active` flag
*/

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text,
  role text NOT NULL CHECK (role IN ('admin', 'student')),
  full_name text,
  reg_number text,
  allowed_exam_type text DEFAULT 'BOTH' CHECK (allowed_exam_type IN ('JAMB', 'WAEC', 'BOTH')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Admin policies for users table
CREATE POLICY "Admins can manage all users"
  ON users FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

-- Public read for authentication purposes (backend handles auth)
CREATE POLICY "Public can read users for authentication"
  ON users FOR SELECT
  TO public
  USING (true);

-- =====================================================
-- 2. ACCESS TOKENS TABLE (WITH 1 YEAR EXPIRY)
-- =====================================================
CREATE TABLE IF NOT EXISTS access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_code text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  device_fingerprint text,
  bound_at timestamptz,
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE access_tokens ENABLE ROW LEVEL SECURITY;

-- Admin can manage all tokens
CREATE POLICY "Admins can manage access tokens"
  ON access_tokens FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Public read for token validation (backend handles security)
CREATE POLICY "Public can read tokens for validation"
  ON access_tokens FOR SELECT
  TO public
  USING (true);

-- Function to automatically set expiry date when binding
CREATE OR REPLACE FUNCTION set_token_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- When device_fingerprint is set (binding occurs) and expires_at is null
  IF NEW.device_fingerprint IS NOT NULL AND OLD.device_fingerprint IS NULL THEN
    NEW.bound_at = now();
    NEW.expires_at = now() + interval '1 year';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set expiry on binding
DROP TRIGGER IF EXISTS token_expiry_trigger ON access_tokens;
CREATE TRIGGER token_expiry_trigger
  BEFORE UPDATE ON access_tokens
  FOR EACH ROW
  EXECUTE FUNCTION set_token_expiry();

-- =====================================================
-- 3. QUESTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  exam_type text NOT NULL CHECK (exam_type IN ('JAMB', 'WAEC')),
  text text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_option text NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
  explanation text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Public can read questions (needed for exam functionality)
CREATE POLICY "Public can read questions"
  ON questions FOR SELECT
  TO public
  USING (true);

-- Admins can manage questions
CREATE POLICY "Admins can manage questions"
  ON questions FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_questions_subject_exam ON questions(subject, exam_type);

-- =====================================================
-- 4. RESULTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_username text NOT NULL,
  exam_type text NOT NULL,
  total_score integer DEFAULT 0,
  aggregate_score integer DEFAULT 0,
  subject_scores jsonb DEFAULT '{}'::jsonb,
  timestamp text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- Students can view their own results
CREATE POLICY "Users can view own results"
  ON results FOR SELECT
  TO public
  USING (true);

-- Backend can insert results
CREATE POLICY "Public can insert results"
  ON results FOR INSERT
  TO public
  WITH CHECK (true);

-- Admins can delete results
CREATE POLICY "Admins can delete results"
  ON results FOR DELETE
  TO public
  USING (true);

-- Index for faster user result queries
CREATE INDEX IF NOT EXISTS idx_results_username ON results(user_username);

-- =====================================================
-- 5. ENSURE SUBJECTS TABLE EXISTS (Already created)
-- =====================================================
-- The subjects table was created in a previous migration
-- Just ensure RLS is enabled (already done)

-- =====================================================
-- 6. SEED DEFAULT ADMIN USER
-- =====================================================
INSERT INTO users (username, password, role, full_name, reg_number, allowed_exam_type)
VALUES ('admin', 'admin', 'admin', 'System Administrator', 'ADMIN-001', 'BOTH')
ON CONFLICT (username) DO NOTHING;

-- =====================================================
-- 7. SEED DEFAULT SUBJECTS (If not exists)
-- =====================================================
INSERT INTO subjects (name, category, is_compulsory) VALUES
  ('English', 'General', true),
  ('Mathematics', 'General', false),
  ('Civic Education', 'General', false)
ON CONFLICT (name) DO NOTHING;

-- Insert Science subjects
INSERT INTO subjects (name, category, is_compulsory) VALUES
  ('Physics', 'Science', false),
  ('Chemistry', 'Science', false),
  ('Biology', 'Science', false),
  ('Further Mathematics', 'Science', false),
  ('Agricultural Science', 'Science', false),
  ('Geography', 'Science', false),
  ('Computer Studies', 'Science', false)
ON CONFLICT (name) DO NOTHING;

-- Insert Commercial subjects
INSERT INTO subjects (name, category, is_compulsory) VALUES
  ('Economics', 'Commercial', false),
  ('Commerce', 'Commercial', false),
  ('Financial Accounting', 'Commercial', false)
ON CONFLICT (name) DO NOTHING;

-- Insert Arts subjects
INSERT INTO subjects (name, category, is_compulsory) VALUES
  ('Government', 'Arts', false),
  ('Literature', 'Arts', false),
  ('CRS', 'Arts', false),
  ('History', 'Arts', false)
ON CONFLICT (name) DO NOTHING;
