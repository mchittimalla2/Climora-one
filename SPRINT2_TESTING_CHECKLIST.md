# Sprint 2 Razorpay and Order Email Testing

Use Razorpay Test Mode only. Do not use live credentials or real customer information.

## Deployment

- [ ] Pull the latest `climoraone-dev` branch.
- [ ] Run `php artisan migrate` from `backend`.
- [ ] Run `php artisan optimize:clear`.
- [ ] Run `npm run build` from the repository root.
- [ ] Confirm `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `BREVO_API_KEY`, and `ADMIN_NOTIFICATION_EMAIL` are configured in `backend/.env`.

## Successful payment

- [ ] Checkout total is calculated by Laravel, not trusted from the browser.
- [ ] Razorpay Checkout opens with the correct amount, customer name, email, and phone.
- [ ] A successful test payment redirects to the Climoraone success screen.
- [ ] The order changes from `Pending Payment` to `Confirmed`.
- [ ] `payment_status` changes to `Paid`.
- [ ] Inventory decreases exactly once after payment capture.
- [ ] Refreshing or replaying verification does not decrease inventory again.
- [ ] The customer receives an order-confirmation email.
- [ ] The admin receives a new-paid-order email.

## Failed and cancelled payment

- [ ] Closing Razorpay records the order as `Payment Cancelled`.
- [ ] A failed test payment records failure details through the webhook.
- [ ] Failed and cancelled payments do not reduce inventory.
- [ ] Failed and cancelled payments do not send order-confirmation emails.

## Webhook

- [ ] Razorpay webhook delivery receives HTTP 200 for valid events.
- [ ] Invalid webhook signatures receive HTTP 401.
- [ ] Replaying the same webhook event does not duplicate inventory deductions or emails.
- [ ] `payment_events` contains the webhook event ID, type, processing status, and timestamp.

## Delivery emails

- [ ] Changing an order to `Out for Delivery` sends one customer email.
- [ ] Repeating `Out for Delivery` does not send a duplicate email.
- [ ] Changing an order to `Delivered` sends one customer email.
- [ ] Repeating `Delivered` does not send a duplicate email.
- [ ] Failed email attempts appear in `email_notifications` with the error and attempt count.

## Support visibility

- [ ] Admin order data includes Razorpay order ID, payment ID, payment status, method, amount, and verification state.
- [ ] Search or database lookup can trace an issue by Climoraone order number or Razorpay payment ID.
- [ ] A captured payment with insufficient inventory is retained as `captured_review` for manual investigation and is not silently lost.
