# Climoraone

Climoraone is a custom e-commerce platform for eco-friendly handmade products created by rural women artisans.

## Final Target Architecture

Frontend: React + Vite  
Backend: Laravel REST API  
Database: MySQL  
Images: Optimized WebP upload storage  
Payments: Razorpay  
Notifications: Email first, WhatsApp later  
Hosting Target: GoDaddy Deluxe Linux Shared Hosting

## Current Status

### Completed

- React frontend setup
- Laravel backend installed
- GitHub Codespaces setup
- Store homepage
- Product listing
- Product detail page
- Multiple product images
- Cart
- Checkout form
- Order creation using LocalStorage
- Admin dashboard
- Admin orders page
- Date → customer → order folder structure
- Order lifecycle checklist
- Admin product upload page
- Product image upload preview
- Reports page
- Customer track order page
- Contact page
- Return policy page
- Shipping policy page
- Basic responsive mobile view

## Current Limitation

The app currently uses browser LocalStorage for products and orders.

This is only for prototype/demo.

Next major step is:

React → Laravel API → Database

## Daily Startup

### Frontend

```bash
cd /workspaces/Climora-one
npm install
npm run dev

Frontend:

http://localhost:5173
Backend
cd /workspaces/Climora-one/backend
composer install
php artisan serve --host=0.0.0.0 --port=8000

Backend:

http://localhost:8000
Frontend Routes
/

Customer store

/track-order

Customer order tracking

/admin

Admin dashboard

/admin/orders

Order operations

/admin/products

Product and inventory management

/admin/reports

Reports

/contact

Contact page

/return-policy

Return policy

/shipping-policy

Shipping policy

Next Phase: Backend API
Phase 1: Database Foundation
Configure Laravel database
Create products table
Create orders table
Create order_items table
Create customers table
Create order_status_history table
Create admin_users table
Phase 2: Laravel APIs

Build:

GET /api/products
POST /api/products
PUT /api/products/{id}
DELETE /api/products/{id}

POST /api/orders
GET /api/orders
GET /api/orders/{id}
PUT /api/orders/{id}/status

POST /api/track-order
Phase 3: React API Integration

Replace LocalStorage with Laravel API calls:

Store products from API
Checkout submits order to API
Admin orders read from API
Track order reads from API
Admin products upload to API
Phase 4: Image Upload

Product upload should allow non-technical admins to upload images.

Backend should store images under:

storage/app/public/products/

Frontend should display uploaded image URLs.

Phase 5: Notifications

When order is placed:

Email admin
Email customer
Include order ID
Include tracking link

Later:

WhatsApp admin alert
WhatsApp customer tracking message
Phase 6: Razorpay
Create Razorpay order
Verify payment
Save payment transaction
Update order payment status
Phase 7: Production Readiness

Before GoDaddy deployment:

Move from SQLite/local testing to MySQL
Configure environment variables
Configure email SMTP
Configure storage link
Build React production files
Deploy Laravel backend
Deploy React frontend
Test order flow end-to-end
Upcoming UI Improvements
Product image zoom on product detail page
Cart item alignment polish
Admin dashboard layout polish
Mobile menu polish
Reports page improvements
Order filters: All, Open, Packed, Shipped, Delivered
Low stock alerts
Top selling products
Revenue summary
Important Development Rule

Do not hardcode production data in React.

All business data should eventually come from Laravel APIs.

React should only handle UI.

Laravel should handle:

Products
Orders
Customers
Images
Payments
Emails
WhatsApp
Reports
Deployment Goal

Build in a way that supports lift-and-shift to GoDaddy Deluxe Linux with minimal rework.

Keep:

Environment values in .env
API URLs configurable
No secrets in React frontend
Payment keys only in backend
Email credentials only in backend


