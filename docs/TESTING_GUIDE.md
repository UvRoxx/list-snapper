# Testing Guide - Plan Limits Implementation

## Manual Testing Steps

### Test 1: Free Plan Limit Enforcement
**Goal**: Verify that FREE plan users cannot create more than 5 QR codes.

1. **Create a test account** (or use existing FREE plan account)
2. **Create 5 QR codes** via the Create QR page
3. **Observe the dashboard**:
   - Plan limit stat should show "5/5"
   - Yellow warning alert should appear at 4/5 (80%)
   - Red warning alert should appear at 5/5 (100%)
   - "Create QR Code" button should be disabled
4. **Try to create a 6th QR code**:
   - Navigate to `/create` 
   - Red warning alert should be visible
   - Submit button should be disabled and say "Plan Limit Reached"
   - If you manually trigger the API call (e.g., via Postman), backend should return 403 error

**Expected Result**: ✅ User is blocked from creating more than 5 QR codes

### Test 2: Backend API Validation
**Goal**: Verify that the backend properly rejects requests over the limit.

Using cURL or Postman:

```bash
# First, authenticate and get your token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Try to create a QR code when at limit
curl -X POST http://localhost:5000/api/qr-codes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test QR",
    "destinationUrl": "https://example.com"
  }'
```

**Expected Response** (when at limit):
```json
{
  "message": "You've reached your plan limit of 5 QR codes. Please upgrade to create more.",
  "limit": 5,
  "current": 5,
  "tierName": "FREE"
}
```

**HTTP Status**: 403 Forbidden

### Test 3: Plan Limits API Endpoint
**Goal**: Verify the new `/api/plan-limits` endpoint works correctly.

```bash
curl -X GET http://localhost:5000/api/plan-limits \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response**:
```json
{
  "tierName": "FREE",
  "displayName": "Free",
  "maxQrCodes": 5,
  "currentQrCodes": 5,
  "canCreateMore": false,
  "hasAnalytics": false,
  "hasCustomBranding": false,
  "hasApiAccess": false,
  "hasWhiteLabel": false
}
```

### Test 4: Standard Plan (50 QR codes)
**Goal**: Verify STANDARD plan enforces 50 QR code limit.

1. Upgrade a user to STANDARD plan (via Stripe or database update)
2. Create QR codes
3. Verify limit is enforced at 50

### Test 5: Pro Plan (Unlimited)
**Goal**: Verify PRO plan has no limits.

1. Upgrade a user to PRO plan
2. Create more than 50 QR codes
3. Verify no limit is enforced
4. Plan limit stat should show "X/∞"

### Test 6: Delete and Recreate
**Goal**: Verify that deleting QR codes frees up capacity.

1. Delete a QR code when at limit (5/5)
2. Dashboard should update to 4/5
3. "Create QR Code" button should become enabled
4. Create a new QR code successfully
5. Verify limit is enforced again at 5/5

### Test 7: Warning Alerts
**Goal**: Verify warning alerts appear at the right thresholds.

| QR Codes | Alert | Color | Appears Where |
|----------|-------|-------|---------------|
| 0-3 | None | - | - |
| 4 (80%) | "Approaching Limit" | Yellow | Dashboard |
| 5 (100%) | "Limit Reached" | Red | Dashboard & Create page |

### Test 8: UI/UX Elements
**Goal**: Verify all UI elements work correctly.

- [ ] Dashboard stat card shows correct counts
- [ ] "Create QR Code" button disabled when at limit
- [ ] Warning alerts are visible and styled correctly
- [ ] Links to pricing page work
- [ ] Create page shows warning alert
- [ ] Submit button is disabled and shows correct text
- [ ] Error toasts appear with clear messages

## Database Verification

### Check Current QR Code Count
```sql
SELECT 
  u.email,
  um.tier_name,
  COUNT(qr.id) as qr_count,
  mt.max_qr_codes
FROM users u
LEFT JOIN user_memberships um ON u.id = um.user_id AND um.is_active = true
LEFT JOIN membership_tiers mt ON um.tier_name = mt.name
LEFT JOIN qr_codes qr ON u.id = qr.user_id
GROUP BY u.id, u.email, um.tier_name, mt.max_qr_codes;
```

### Verify Tier Limits
```sql
SELECT name, display_name, max_qr_codes
FROM membership_tiers;
```

Expected:
- FREE: 5
- STANDARD: 50
- PRO: null (unlimited)

## Performance Testing

### Load Test: Plan Limits Endpoint
```bash
# Using Apache Bench (install via: brew install httpd)
ab -n 1000 -c 10 -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/plan-limits
```

**Expected**: Fast response times (< 100ms) due to efficient COUNT() query

### Database Query Performance
```sql
EXPLAIN ANALYZE 
SELECT COUNT(*) 
FROM qr_codes 
WHERE user_id = 'USER_ID_HERE';
```

**Expected**: Index scan on user_id (should be fast)

## Regression Testing

- [ ] Existing QR codes still work
- [ ] QR code scanning still tracks analytics
- [ ] Editing QR codes doesn't count against limit
- [ ] Deleting QR codes updates count correctly
- [ ] Login/logout still works
- [ ] Other dashboard features work normally
- [ ] Subscription/payment flow unaffected

## Edge Cases to Test

1. **User with no membership**: Should default to FREE tier
2. **User with expired membership**: Should revert to FREE tier
3. **User creating multiple QR codes rapidly**: Race conditions handled?
4. **Admin users**: Should have same limits (unless PRO plan)
5. **QR codes created before limit implementation**: Still count toward limit

## Common Issues & Solutions

### Issue: Button stays disabled even after deleting QR codes
**Solution**: Make sure React Query cache is invalidated after deletion. Check that `queryClient.invalidateQueries({ queryKey: ['/api/plan-limits'] })` is called.

### Issue: Warning alerts don't appear
**Solution**: Check that `planLimits` data is being fetched successfully. Open browser dev tools and verify the `/api/plan-limits` API call.

### Issue: Backend still allows creation over limit
**Solution**: Verify the `POST /api/qr-codes` route has the validation logic. Check server logs for errors.

### Issue: Count is incorrect
**Solution**: Verify that `getUserQrCodeCount()` is querying the correct user. Check for orphaned QR codes in the database.

## Automated Testing (Future)

Since the project doesn't have a testing framework yet, consider adding:

```javascript
// Example test (using Vitest or Jest)
describe('Plan Limits', () => {
  it('should reject QR code creation when at limit', async () => {
    // Setup: Create user with 5 QR codes
    // Action: Try to create 6th QR code
    // Assert: Response is 403 with correct error message
  });
  
  it('should allow creation when under limit', async () => {
    // Setup: Create user with 3 QR codes
    // Action: Create 4th QR code
    // Assert: Response is 200 with QR code data
  });
  
  it('should allow unlimited for PRO plan', async () => {
    // Setup: Create PRO user with 100 QR codes
    // Action: Create 101st QR code
    // Assert: Response is 200
  });
});
```

## Success Criteria

✅ All manual tests pass
✅ No linter errors
✅ Database queries are performant
✅ UI is intuitive and provides clear feedback
✅ Backend validation cannot be bypassed
✅ Error messages are user-friendly
✅ Plan upgrades work correctly

