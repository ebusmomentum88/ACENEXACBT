# Access Code 1-Year Validity - Quick Reference

## Overview

All access codes now have a **1-year validity period** that starts from the moment a student binds the code to their device.

## How It Works

### Stage 1: Code Generation
```
Code Generated → NOT bound to device → NO expiry date set
```
- Admin or payment system generates an access code
- Code is stored in database with `device_fingerprint: null` and `expires_at: null`
- Code can be used by anyone at this stage

### Stage 2: First Login (Device Binding)
```
Student enters code → Confirmation prompt → Device binding + Expiry set
```
1. Student enters access code on login screen
2. System shows confirmation modal: "Bind this code to this device?"
3. Student clicks "Yes, Bind to this Device"
4. Database trigger automatically executes:
   ```sql
   bound_at = NOW()
   expires_at = NOW() + 1 YEAR
   device_fingerprint = [unique device hash]
   ```

### Stage 3: Subsequent Logins
```
Student logs in → Device check → Expiry check → Access granted/denied
```
- System verifies device matches stored fingerprint
- System checks if `NOW() < expires_at`
- If expired: Access denied with expiry date message
- If valid: Access granted with remaining days shown

## Database Schema

```sql
CREATE TABLE access_tokens (
  id uuid PRIMARY KEY,
  token_code text UNIQUE,
  is_active boolean DEFAULT true,
  device_fingerprint text,
  bound_at timestamptz,           -- Set when bound to device
  expires_at timestamptz,          -- 1 year from bound_at
  metadata jsonb,
  created_at timestamptz
);
```

## Automatic Expiry Trigger

The database has a trigger that automatically sets the expiry:

```sql
CREATE FUNCTION set_token_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.device_fingerprint IS NOT NULL AND OLD.device_fingerprint IS NULL THEN
    NEW.bound_at = now();
    NEW.expires_at = now() + interval '1 year';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## API Response Examples

### First Login (Binding)
```json
{
  "username": "ACE-ABCD-1234-WXYZ",
  "role": "student",
  "fullName": "John Doe",
  "allowedExamType": "BOTH",
  "message": "Access code bound successfully! Valid until 05-Jan-2027",
  "expiresAt": "2027-01-05T12:30:00Z"
}
```

### Subsequent Login (Valid)
```json
{
  "username": "ACE-ABCD-1234-WXYZ",
  "role": "student",
  "remainingDays": 364,
  "expiresAt": "2027-01-05T12:30:00Z",
  "expiryMessage": "364 days remaining (Valid until 05-Jan-2027)"
}
```

### Login Attempt (Expired)
```json
{
  "error": "Access Code Expired! This code expired on 05-Jan-2026. Please purchase a new access code to continue."
}
```

## Admin Panel Features

### Token List View

The Admin Panel shows expiry information for each token:

```
┌─────────────────┬──────────────┬──────────────────────────┬────────────┐
│ Code            │ Name         │ Details                  │ Status     │
├─────────────────┼──────────────┼──────────────────────────┼────────────┤
│ ACE-XXXX-XXXX   │ John Doe     │ BOTH                     │ Active     │
│ [Copy]          │              │ 08012345678              │ Locked     │
│                 │              │ Valid until: 05-Jan-2027 │            │
│                 │              │ Ref: PAY-123456789       │            │
└─────────────────┴──────────────┴──────────────────────────┴────────────┘
```

### Status Indicators

- **Green:** `Valid until: DD-MMM-YYYY` - Active and not expired
- **Red:** `Expired: DD-MMM-YYYY` - Past expiry date
- **Yellow:** `Legacy (No Expiry Set)` - Old tokens before feature was added
- **Gray:** `Not yet bound` - Code not yet used

### Admin Actions

| Action | Effect |
|--------|--------|
| **Reset Device Lock** | Unbinds device, allows re-binding to new device (DOES NOT reset expiry date) |
| **Activate/Deactivate** | Manual enable/disable (separate from expiry) |
| **Delete Token** | Permanently removes the code |

**Important:** Resetting device lock does NOT extend the expiry date. The 1-year countdown continues from the original binding date.

## Frontend Implementation

### Login Flow with Expiry Check

```typescript
// services/auth.ts
export const loginWithToken = async (token: string, confirmBinding: boolean) => {
  const response = await apiRequest('/api/auth/login-with-token', 'POST', {
    token,
    deviceFingerprint: await getDeviceFingerprint(),
    confirm_binding: confirmBinding
  });

  if (response.requires_binding) {
    // Show confirmation modal
    throw new Error("BINDING_REQUIRED");
  }

  // Backend checks expiry and returns error if expired
  return response; // Contains expiryMessage if valid
};
```

### Backend Expiry Validation

```javascript
// server.js
if (tokenData.expires_at) {
  const expiryDate = new Date(tokenData.expires_at);
  const now = new Date();

  if (now > expiryDate) {
    return res.status(403).json({
      error: `Access Code Expired! This code expired on ${formatDate(expiryDate)}...`
    });
  }
}
```

## Common Scenarios

### Scenario 1: Student Purchases Access Code

1. Payment successful → Code generated
2. Student receives: `ACE-ABCD-1234-WXYZ`
3. Code status: Not bound, No expiry
4. Validity: Unlimited until first use

### Scenario 2: Student First Login

1. Enters code on login page
2. Sees: "Bind this code to this device?"
3. Clicks "Yes"
4. Database trigger fires:
   - `bound_at = 2026-01-05 12:30:00`
   - `expires_at = 2027-01-05 12:30:00`
5. Can now use code for 1 year

### Scenario 3: Student Tries to Login from Different Device

1. Same code used on new device
2. Device fingerprint doesn't match
3. Response: "ACCESS DENIED: Token locked to another device"
4. Admin must reset device lock if legitimate

### Scenario 4: Student Login After 1 Year

1. Student tries to login
2. Current date: 2027-01-06
3. Expiry date: 2027-01-05
4. Response: "Access Code Expired! ...expired on 05-Jan-2027..."
5. Student must purchase new code

### Scenario 5: Admin Resets Device Lock

1. Admin clicks "Reset Device Lock"
2. `device_fingerprint` set to `null`
3. `expires_at` remains unchanged (e.g., still 2027-01-05)
4. Student can re-bind on new device
5. Same expiry date applies

## Testing Expiry (Development)

### Manual Expiry Test

To test expiry in development:

1. In Supabase SQL Editor:
   ```sql
   -- Set a token to expire in 1 minute
   UPDATE access_tokens
   SET expires_at = NOW() + interval '1 minute',
       bound_at = NOW() - interval '364 days'
   WHERE token_code = 'YOUR-TEST-TOKEN';
   ```

2. Login with the token
3. Wait 1 minute
4. Try to login again → Should show expired message

### Reset for Testing

```sql
-- Reset token for re-testing
UPDATE access_tokens
SET device_fingerprint = NULL,
    bound_at = NULL,
    expires_at = NULL
WHERE token_code = 'YOUR-TEST-TOKEN';
```

## Important Notes

1. **Expiry is automatic:** No manual intervention needed once code is bound
2. **Cannot extend:** Once set, expiry date cannot be extended (by design)
3. **Device lock reset ≠ Expiry reset:** Changing device doesn't reset the 1-year timer
4. **Legacy tokens:** Tokens created before this feature may not have expiry dates
5. **Offline mode:** In offline mode, expiry checking happens on next online sync
6. **Timezone:** All dates use UTC timezone from database

## Troubleshooting

### Token Shows "Legacy (No Expiry Set)"

**Cause:** Token was created before 1-year validity feature
**Solution:**
- Option 1: Let it bind naturally on next login (expiry will be set)
- Option 2: Manually set expiry in database:
  ```sql
  UPDATE access_tokens
  SET bound_at = NOW(),
      expires_at = NOW() + interval '1 year'
  WHERE token_code = 'LEGACY-TOKEN' AND device_fingerprint IS NOT NULL;
  ```

### Expiry Date Not Showing in Admin Panel

**Cause:** Token not yet bound to device
**Status:** `Not yet bound` is shown (normal behavior)
**Action:** No action needed - wait for student to use the code

### Student Complains Code Expired Too Soon

**Check:**
1. Verify `bound_at` date in database
2. Calculate: `expires_at = bound_at + 1 year`
3. Confirm current date > expires_at
4. If error, contact support (may indicate database issue)

## Support Commands

### Check Token Status
```sql
SELECT
  token_code,
  bound_at,
  expires_at,
  CASE
    WHEN expires_at IS NULL THEN 'Not Set'
    WHEN NOW() > expires_at THEN 'EXPIRED'
    ELSE 'VALID'
  END as status,
  EXTRACT(days FROM expires_at - NOW()) as days_remaining
FROM access_tokens
WHERE token_code = 'ACE-XXXX-XXXX';
```

### Find Expiring Soon (Next 30 Days)
```sql
SELECT token_code, metadata->>'full_name' as name, expires_at
FROM access_tokens
WHERE expires_at BETWEEN NOW() AND NOW() + interval '30 days'
ORDER BY expires_at;
```

### Find All Expired Tokens
```sql
SELECT token_code, metadata->>'full_name' as name, expires_at
FROM access_tokens
WHERE expires_at < NOW()
ORDER BY expires_at DESC;
```
