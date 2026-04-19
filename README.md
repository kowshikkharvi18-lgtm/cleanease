# CleanEase - Online Laundry Service

A comprehensive online laundry service application with customer and admin portals featuring cloth type management, order processing, billing system, and daily income tracking.

## Database Structure

The application uses the following data structure:

### A. Customer Table
- name
- phone
- address

### B. Order Table
- order_date
- delivery_date
- status

### C. Order_Items Table
- cloth_type
- quantity
- price

## Features

### Admin Module
- **Cloth Type Management**: Add, edit, and delete cloth types (Shirt, Pant, Saree, etc.) with custom pricing
- **Order Management**: View all orders, update status (Pending → Processing → Completed → Delivered)
- **Daily Income Report**: Track daily revenue, paid/unpaid amounts, and order statistics
- **Customer Management**: View customer list with order history and contact details
- **Billing System**: Generate and print bills with payment status tracking

### Customer Module
- **Create Orders**: Add customer details and select multiple cloth items with quantities
- **Auto Calculation**: Automatic total calculation based on cloth types and quantities
- **Order History**: View all orders with status and payment information
- **Bill Access**: View and print receipts for orders

### Order Management System
- Auto-generated Order IDs (ORD001, ORD002, etc.)
- Select cloth type and quantity for each item
- Automatic total calculation
- Status tracking (Pending, Processing, Completed, Delivered)
- Payment status (Paid/Unpaid)

### Billing System
- Auto bill generation with order details
- Itemized receipt with cloth types, quantities, and prices
- Print receipt functionality
- Payment status toggle (Paid/Unpaid)
- Professional bill format with company header

## Demo Credentials

**Customer:**
- Register a new account using the "Customer Register" tab
- Or use any previously registered phone number and password

**Admin Login:**
- Username: admin
- Password: admin123

## Usage

1. Open `index.html` in your browser
2. Click on Customer or Admin portal
3. Login with demo credentials
4. Access the dashboard features

### Customer Workflow
1. Register a new account with name, phone, address, and password
2. Login with your phone number and password
3. Click "New Order"
4. Customer details are pre-filled from registration
5. Add cloth items (select type and quantity)
6. Review order summary
7. Submit order
8. View order history and bills
9. Receive notifications from admin

### Admin Workflow
1. Login as admin
2. Manage cloth types and pricing
3. View and update order status
4. Generate and print bills
5. Track daily income
6. Manage customer database

## Files

- `index.html` - Landing page with portal selection
- `customer-login.html` - Customer login and registration page
- `admin-login.html` - Admin login page
- `customer-login.js` - Customer authentication logic
- `admin-login.js` - Admin authentication logic
- `dashboard.html` - Main dashboard (customer & admin)
- `dashboard.js` - Dashboard functionality
- `styles.css` - All styling

## Technologies

- HTML5
- CSS3
- JavaScript (Vanilla)
- No external dependencies

## Sample Data

The application starts with:
- 5 cloth types (Shirt: ₹50, Pant: ₹60, Saree: ₹150, Bedsheet: ₹100, Towel: ₹30)
- No demo customers or orders
- Customers are created automatically when they place their first order

&copy; 2026 CleanEase
