# Climoraone Backend Security Audit — Phase 1

## Scope

Reviewed the Laravel API routes, product and order controllers, model mass-assignment configuration, CORS configuration, frontend admin routing, and backend dependency manifest on branch `climoraone-dev`.

## Executive summary

The application currently has **critical authorization gaps**. Product creation, product modification, permanent product deletion, order listing, and order-status changes are exposed without authentication. Anyone who can reach the API can call these endpoints directly, even without opening the React admin pages.

The current ORM usage substantially reduces classic SQL-injection risk because Eloquent and the query builder bind values. However, authentication, authorization, CORS, rate limiting, sensitive-data exposure, input allow-listing, account controls, audit logging, and secure deletion controls are not yet implemented.

## Critical findings

### C-01 — Administrative write APIs are public

The following routes are unauthenticated:

- `POST /api/products`
- `PUT /api/products/{id}`
- `DELETE /api/products/{id}`
- `GET /api/orders`
- `PUT /api/orders/{id}/status`

Impact:

- Anonymous users can create or modify products.
- Anonymous users can permanently delete products and product images.
- Anonymous users can retrieve all orders and customer personal data.
- Anonymous users can change order statuses.

Required remediation:

- Put all administrative endpoints under authenticated middleware.
- Enforce roles and permissions on the server.
- Keep only storefront product listing, order creation, and carefully designed order tracking public.

### C-02 — Permanent product deletion is directly available

The delete endpoint removes the product image directory and then deletes the database row immediately.

Impact:

- A compromised or anonymous request can permanently destroy product records and files.
- There is no recovery period, approval, reauthentication, MFA challenge, reason, or audit trail.

Required remediation:

- Replace normal delete with soft delete/archive.
- Restrict permanent deletion to the Owner role.
- Require recent password verification and fresh MFA.
- Record the reason, actor, request ID, IP address, and timestamps.

### C-03 — All orders and customer PII are publicly readable

`GET /api/orders` returns orders with their items without authentication.

Impact:

- Exposure of customer names, email addresses, phone numbers, shipping addresses, order contents, payment status, and order history.

Required remediation:

- Protect the route with authenticated Owner/Admin access.
- Return only fields required by the admin UI.
- Add pagination, filtering allow-lists, and audit logging.

### C-04 — CORS permits every origin, method, and header

Both the route-level preflight handler and Laravel CORS configuration allow wildcard origins and broad methods/headers.

Impact:

- Any website can attempt to call the API from a user's browser.
- This becomes especially dangerous once cookie-based authenticated sessions are introduced.

Required remediation:

- Allow only approved development and production origins from environment configuration.
- Remove the custom wildcard OPTIONS route.
- Enable credentials only with explicit origins.

## High findings

### H-01 — React admin pages have no route guard

The frontend exposes `/admin`, `/admin/orders`, `/admin/products`, and `/admin/reports` directly.

Impact:

- Anyone can load the admin interface.
- Frontend hiding alone would not secure APIs, but a route guard is still required for user experience and accidental disclosure.

Required remediation:

- Add an admin login route.
- Add a protected-route component that verifies the server session.
- Redirect unauthenticated users to login.

### H-02 — Order status accepts arbitrary text

The API accepts any string as an order status.

Impact:

- Invalid or malicious status values can be stored.
- Large or unexpected values can pollute reports and workflows.

Required remediation:

- Use a strict allow-list such as `Order Received`, `Confirmed`, `Packed`, `Shipped`, `Out for Delivery`, `Delivered`, and `Cancelled`.
- Limit length and log every transition.

### H-03 — Order tracking endpoint lacks throttling and strict validation

Order tracking uses order number and phone but has no visible rate limiting.

Impact:

- Automated guessing can enumerate valid orders.
- Customer order information may be exposed through repeated attempts.

Required remediation:

- Apply aggressive rate limits by IP and normalized identifier.
- Use generic failure messages.
- Normalize and strictly validate order number and phone formats.
- Return only customer-safe tracking fields.

### H-04 — No audit logging

There is no immutable record of administrative login attempts, product changes, stock changes, order status changes, archive/restore activity, or deletion attempts.

Required remediation:

- Add an `audit_logs` table.
- Log actor, action, target type/ID, before/after summaries, IP, user agent, request ID, and timestamp.
- Prevent ordinary admins from modifying or deleting audit records.

### H-05 — No login throttling, lockout, session timeout, or MFA

Administrative authentication has not yet been implemented.

Required remediation:

- Password hashing with Laravel's password hasher.
- Email OTP as phase-one MFA.
- Rate limiting and progressive delays.
- Short OTP expiry, single-use verification, resend cooldown, and attempt limits.
- HttpOnly, Secure, SameSite cookies.
- Idle and absolute session expiration.

## Medium findings

### M-01 — Dependency baseline is old

The backend is based on Laravel 8 and older package constraints. Before production launch, dependencies should be upgraded to a currently supported release and checked with `composer audit`.

### M-02 — Product image replacement is not transactional

Product records and file operations are not wrapped in one compensating workflow. A failed request after file deletion could leave inconsistent files or records.

Required remediation:

- Validate all files first.
- Store new files under temporary names.
- Commit database changes before deleting old files, or implement cleanup/rollback handling.

### M-03 — Product listing exposes all products

The public product endpoint currently returns every product. There is no published/archived state.

Required remediation:

- Add `status`, `published_at`, and soft-delete fields.
- Public listing should return only published, non-archived products.

### M-04 — No database-level constraints visible for business states

Application validation exists, but database constraints should also protect critical values such as non-negative stock, non-negative price, unique order numbers, valid role names, and unique admin email addresses.

## SQL injection assessment

No direct raw SQL string concatenation was identified in the reviewed controllers. Product and order operations use Eloquent/query-builder methods and Laravel validation, which normally bind parameters.

This is a positive baseline, but SQL-injection protection must be preserved by policy:

- Do not add `DB::raw()` with user-controlled content.
- Never concatenate request data into SQL.
- Allow-list dynamic sort columns and directions.
- Use parameter binding for any future raw query.
- Give the application database account only the minimum table privileges it requires.

## Existing positive controls

- Product and checkout inputs use Laravel validation.
- Product IDs are validated as integers and checked against the products table during order creation.
- Product stock updates use a database transaction and row locking.
- Product images are restricted by MIME/extension and size.
- Eloquent fillable properties are explicitly defined for products.
- Generic server-error responses are used during order placement.

## Recommended remediation sequence

1. Create admin-user, OTP, session, and audit-log schema.
2. Implement password login plus email OTP.
3. Protect all administrative API routes with authentication middleware.
4. Add `owner` and `editor` authorization policies.
5. Replace product deletion with archive/soft-delete.
6. Restrict permanent deletion to Owner with fresh MFA.
7. Lock CORS to approved origins.
8. Add rate limiting to login, OTP, tracking, and all write endpoints.
9. Add strict status allow-lists and request validation.
10. Add frontend protected admin routes.
11. Upgrade Laravel/dependencies and run automated security audits.
12. Add automated authorization, injection, ID-tampering, upload, rate-limit, and session tests.

## Proposed role permissions

| Capability | Editor | Owner | Break glass |
|---|---:|---:|---:|
| View admin dashboard | Yes | Yes | Emergency only |
| View orders | Yes | Yes | Emergency only |
| Add/edit products | Yes | Yes | Emergency only |
| Update stock/status | Yes | Yes | Emergency only |
| Archive products | Yes | Yes | Emergency only |
| Restore products | No | Yes | Emergency only |
| Permanently delete | No | Fresh MFA required | Emergency only |
| Manage admin users | No | Yes | Recovery only |
| Change MFA/security settings | No | Fresh MFA required | Recovery only |

## Phase-one conclusion

The immediate priority is not SQL injection; the most urgent risk is **missing authentication and authorization on administrative APIs**. The next implementation task should establish the admin identity, session, email OTP, role, and audit-log foundation before changing additional admin functionality.
