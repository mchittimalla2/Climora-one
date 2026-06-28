# Climoraone Development Guide

## Project Structure

```text
Climora-one/
│
├── src/                    # React Frontend
├── public/
├── backend/                # Laravel Backend
│   ├── app/
│   ├── routes/
│   ├── database/
│   └── storage/
│
├── package.json
└── README.md
```

---

# Daily Startup Procedure

Every time you open GitHub Codespaces, follow these steps.

---

## Step 1: Open Codespaces

1. Open GitHub
2. Open Climoraone Repository
3. Click Code
4. Click Codespaces
5. Open Existing Codespace

Wait for VS Code to load completely.

---

# Frontend Startup

Open Terminal 1

```bash
cd /workspaces/Climora-one
npm install
npm run dev
```

Expected Output:

```bash
VITE ready
Local: http://localhost:5173
```

Open Port 5173.

Frontend URL:

```text
http://localhost:5173
```

---

# Backend Startup

Open Terminal 2

```bash
cd /workspaces/Climora-one/backend
composer install
php artisan serve --host=0.0.0.0 --port=8000
```

Expected Output:

```bash
Laravel development server started
http://localhost:8000
```

Open Port 8000.

Backend URL:

```text
http://localhost:8000
```

---

# First Time Laravel Setup Only

If Laravel throws APP_KEY errors:

```bash
cd /workspaces/Climora-one/backend

cp .env.example .env

php artisan key:generate
```

Then start Laravel again:

```bash
php artisan serve --host=0.0.0.0 --port=8000
```

This only needs to be done once.

---

# Verify Frontend Pages

After starting Vite, verify:

```text
/
```

Store Home Page

```text
/track-order
```

Customer Order Tracking

```text
/admin
```

Admin Dashboard

```text
/admin/orders
```

Order Management

```text
/admin/products
```

Product Management

```text
/admin/reports
```

Reports Dashboard

```text
/contact
```

Contact Page

```text
/return-policy
```

Return Policy

```text
/shipping-policy
```

Shipping Policy

---

# Verify Backend

Open:

```text
http://localhost:8000
```

You should see the Laravel welcome page.

If this loads, Laravel is working.

---

# Save Code Changes

Before ending the day:

```bash
git status
```

```bash
git add .
```

```bash
git commit -m "Describe changes"
```

```bash
git push
```

---

# Stop Servers

In each terminal:

```bash
CTRL + C
```

---

# Quick Daily Startup

Most days you only need:

Terminal 1:

```bash
cd /workspaces/Climora-one
npm run dev
```

Terminal 2:

```bash
cd /workspaces/Climora-one/backend
php artisan serve --host=0.0.0.0 --port=8000
```

That's it.

---

# Current Project Status

## Completed

- React Frontend
- Store Page
- Cart
- Checkout
- Admin Dashboard
- Orders Management
- Reports Dashboard
- Product Management
- Customer Order Tracking
- Multi Image Product Upload
- GitHub Repository
- GitHub Codespaces
- Laravel Backend Installed

---

## Next Milestones

### Phase 1

- Laravel API
- Product Database
- Order Database
- Customer Database

### Phase 2

- Email Notifications
  - Admin Order Alert
  - Customer Order Confirmation

### Phase 3

- Razorpay Integration

### Phase 4

- Order Status Updates
- Customer Email Updates
- Customer WhatsApp Updates

### Phase 5

- Production Deployment to GoDaddy

---

# Tomorrow's First Task

Build Laravel API endpoints:

```text
POST /api/orders
GET /api/orders
POST /api/products
GET /api/products
```

After that:

```text
React → Laravel → Database
```

The project will then move from LocalStorage to a real backend.