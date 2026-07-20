# Customer account security and deferred work

- Customer and admin identities use different models and Sanctum token abilities. Customer tokens cannot satisfy admin access middleware.
- Phone numbers are stored in E.164 form when valid, but `phone_verified_at` is never set in this sprint. `CustomerPhoneVerificationProvider` is bound to a disabled implementation. Configure and review an SMS provider before exposing phone verification or phone/password login.
- Account deletion is deferred to a dedicated privacy workflow. It must revoke tokens/social links and deactivate or anonymize the customer while retaining paid orders, payments, invoices and legally required transaction identity. The `orders.customer_id` foreign key uses `nullOnDelete`; it never cascades financial records.
- Google identities matching an existing email are not automatically merged. Customers must first authenticate locally before a future explicit linking flow is enabled.
- Buy Again is deferred. It must use current product prices and inventory rather than copying historical order totals.
