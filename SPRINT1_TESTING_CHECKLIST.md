# Sprint 1 Security Testing Checklist

Use this checklist in a non-production environment with Owner, Editor, and Break-glass test accounts. Record evidence beside each checked item.

## Automated gates

- [ ] Run all backend tests with a configured test database driver.
- [ ] Inspect the API route list for authentication, session, access, reauthentication, and role middleware.
- [ ] Every PHP file passes syntax validation.
- [ ] Composer manifest validation passes.
- [ ] Frontend lint and production build pass.
- [ ] Backend asset production build passes when its JavaScript dependencies are installed.

## Product retention and recovery

- [ ] Owner deletion soft-deletes the product, records deleted_by, and sets purge_eligible_at exactly 30 days after deletion.
- [ ] Editor cannot open the Recycle Bin, archive, restore, or permanently delete a product.
- [ ] Owner can view and restore a product throughout retention.
- [ ] Break-glass cannot restore a product.
- [ ] Owner and Editor cannot permanently delete a product at any time.
- [ ] Break-glass purge returns HTTP 409 before purge_eligible_at, including one second before the deadline.
- [ ] Break-glass purge succeeds at or after the deadline only with recent MFA, the correct password, and exact confirmation text.
- [ ] A legacy deleted product with no purge_eligible_at cannot be permanently deleted.
- [ ] Restoring clears deleted_at, deleted_by, and purge_eligible_at.
- [ ] Permanent purge removes the database row and product image directory.

## Authentication and sessions

- [ ] Correct password starts OTP login without issuing an access token.
- [ ] Incorrect identity or password returns a generic error and creates auth.login.failure.
- [ ] Disabled and locked accounts cannot log in.
- [ ] Valid OTP creates auth.otp.success and auth.login.success; invalid/expired OTP creates auth.otp.failure.
- [ ] OTP expires after five minutes, is single-use, and enforces its attempt limit.
- [ ] Resend cooldown and endpoint throttles return HTTP 429 when exceeded.
- [ ] Successful OTP verification revokes all older tokens and admin sessions.
- [ ] Activity within 30 minutes refreshes last_activity_at.
- [ ] A session idle for more than 30 minutes returns HTTP 401 and revokes its token.
- [ ] A session older than eight hours returns HTTP 401 even if recently active.
- [ ] Logout records auth.logout, revokes the server-side session, and deletes the token.
- [ ] Disabled users with previously valid tokens receive HTTP 401.
- [ ] A token without the admin ability receives HTTP 403 on admin routes.

## Sensitive operations and token revocation

- [ ] Password change, email-change request/verification, product restore, and permanent purge require MFA verified within 15 minutes.
- [ ] A stale sensitive request returns HTTP 428 with reauthentication_required set to true.
- [ ] Password change verifies the current password and revokes every token/session, including the current one.
- [ ] Email change verifies the current password and new-email OTP, then revokes every token/session, including the current one.
- [ ] The frontend removes its token after HTTP 401/428 and after successful password/email changes.
- [ ] A revoked token cannot call the current-user endpoint or any admin business route.

## Authorization and public API exposure

- [ ] All admin and authenticated admin-auth routes reject anonymous requests.
- [ ] Owner, Editor, and Break-glass permissions match the approved role matrix.
- [ ] Only product listing, checkout, tracking, and login/OTP endpoints are anonymous.
- [ ] The former generic user route is absent.
- [ ] CORS accepts configured trusted origins and rejects an unlisted origin.
- [ ] Checkout rejects soft-deleted product IDs.
- [ ] Order status accepts only approved lifecycle states.
- [ ] Tracking rejects malformed identifiers, is throttled, and returns no customer email, phone, or address.

## Audit-log verification

- [ ] Login success/failure, OTP success/failure, logout, profile, password, and email-change events are present.
- [ ] Product create/update/delete/restore/purge events include actor and target IDs.
- [ ] Admin order-status changes include before/after status.
- [ ] Authorization denials include required role/ability without passwords, OTPs, tokens, or raw email addresses.
- [ ] Logs include timestamp, IP, bounded user agent, request ID, actor, result, resource, and session ID when available.
- [ ] Ordinary application routes cannot update or delete audit-log rows.

## Sign-off

- Tester:
- Environment and commit:
- Date:
- Failed checks / follow-up tickets:
- Owner approval:
