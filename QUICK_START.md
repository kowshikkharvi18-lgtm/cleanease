# 🚀 CleanEase Quick Start Guide

## Prerequisites
- Python 3.x installed
- Modern web browser (Chrome, Firefox, Edge, Safari)

## Step-by-Step Setup

### 1. Start the Backend Server

Open a terminal/command prompt and run:

```bash
cd CLEANEASE
python app.py
```

**Expected Output:**
```
Database initialized successfully!
Starting CleanEase Backend Server...
 * Serving Flask app 'app'
 * Debug mode: on
 * Running on http://0.0.0.0:5000
```

**Keep this terminal window open!** The server must be running for the application to work.

---

### 2. Open the Application

**Option A: Using Live Server (Recommended)**
1. Install "Live Server" extension in VS Code
2. Right-click on `CLEANEASE/index.html`
3. Select "Open with Live Server"

**Option B: Direct File Open**
1. Navigate to the `CLEANEASE` folder
2. Double-click `index.html`
3. It will open in your default browser

---

### 3. Test Customer Portal

#### A. Register a New Customer
1. Click **"Customer Portal"** on the homepage
2. Click the **"Register"** tab
3. Fill in the form:
   ```
   Name: John Doe
   Phone: 9876543210
   Address: 123 Main Street, City
   Password: password123
   ```
4. Click **"Register"**
5. You'll see a success message

#### B. Login as Customer
1. Click the **"Login"** tab
2. Enter:
   ```
   Phone: 9876543210
   Password: password123
   ```
3. Click **"Login"**

---

### 4. Test Dashboard Features

#### ✅ Dashboard Overview
- You should see 4 stat cards (Orders, Pending, Completed, Total Spent)
- All should show "0" initially

#### ✅ Create New Order
1. Click **"New Order"** in the sidebar
2. Customer details are pre-filled
3. Select dates:
   - Order Date: Today
   - Delivery Date: Tomorrow or later
4. Click **"+ Add Item"**
5. Select:
   - Cloth Type: Shirt
   - Service: Wash
   - Quantity: 2
6. Click **"+ Add Item"** again
7. Select:
   - Cloth Type: Pant
   - Service: Dry Wash
   - Quantity: 1
8. Review the order summary (should show total)
9. Click **"Place Order"**
10. You'll see a success message with Order ID

#### ✅ View Order History
1. Click **"Order History"** in the sidebar
2. You should see your order card with:
   - Order ID
   - Status badge
   - Order details
   - "View Bill" button
3. Click **"View Bill"** to see the detailed bill

#### ✅ Check Notifications
1. Click **"Notifications"** in the sidebar
2. Initially, you'll see "No notifications"
3. (Admin needs to send you a notification first)

---

### 5. Test Admin Portal

#### A. Login as Admin
1. Go back to the homepage (click logo or navigate to `index.html`)
2. Click **"Admin Portal"**
3. Login with:
   ```
   Username: admin
   Password: admin123
   ```

#### B. Admin Dashboard
- You should see all orders from all customers
- Stats show total business metrics

#### C. Manage Orders
1. Click **"Orders"** in the sidebar
2. You'll see a table with all orders
3. Click **"Update"** on an order
4. Enter a number (1-4) to change status:
   ```
   1. Pending
   2. Processing
   3. Completed
   4. Delivered
   ```
5. Click **"Bill"** to view/print the bill
6. Click **"Mark as Paid"** to update payment status

#### D. Send Notification
1. Click **"Notifications"** in the sidebar
2. Select a customer from the dropdown
3. Type a message: "Your order is ready for pickup!"
4. Click **"Send Notification"**
5. You'll see it in the notification history

#### E. View Daily Income
1. Click **"Daily Income"** in the sidebar
2. Select today's date
3. You'll see:
   - Total orders for the day
   - Total income
   - Paid amount
   - Unpaid amount
   - List of orders

#### F. Manage Cloth Types
1. Click **"Cloth Types"** in the sidebar
2. Click **"+ Add Cloth Type"**
3. Enter:
   ```
   Name: Jacket
   Price: 120
   ```
4. Click **"Save"**
5. You can edit prices or delete items

---

### 6. Test Notification Flow

#### Step 1: Admin sends notification
1. Login as admin
2. Go to Notifications
3. Send a message to customer

#### Step 2: Customer receives notification
1. Logout from admin
2. Login as customer
3. You'll see:
   - Notification badge (🔔 with number) in topbar
   - Notification bar at top with the message
4. Click **"Notifications"** in sidebar
5. You'll see the notification card
6. After 5 seconds, it's marked as read

---

## 🎯 Testing Checklist

### Customer Features
- [ ] Register new account
- [ ] Login successfully
- [ ] View dashboard stats
- [ ] Create new order
- [ ] View order history
- [ ] View order bill
- [ ] Receive notifications
- [ ] View notification list

### Admin Features
- [ ] Login as admin
- [ ] View all orders
- [ ] Update order status
- [ ] Update payment status
- [ ] Send notifications
- [ ] View daily income report
- [ ] Add cloth types
- [ ] Edit cloth prices
- [ ] View customer list

---

## 🐛 Troubleshooting

### Backend Server Issues

**Problem**: `ModuleNotFoundError: No module named 'flask'`
**Solution**:
```bash
pip install flask flask-cors
```

**Problem**: `Address already in use`
**Solution**: Port 5000 is busy. Kill the process or change port in `app.py`

### Frontend Issues

**Problem**: "Failed to fetch" errors
**Solution**: 
1. Check if backend server is running
2. Verify URL is `http://localhost:5000`
3. Check browser console for CORS errors

**Problem**: Order History/Notifications not showing
**Solution**:
1. Hard refresh (Ctrl+F5)
2. Clear browser cache
3. Check console for errors
4. Verify you're logged in as customer

**Problem**: Empty sections
**Solution**: This is normal if no data exists. Create orders/notifications first.

---

## 📊 Sample Test Data

### Test Customer 1
```
Name: Alice Johnson
Phone: 1111111111
Address: 456 Oak Avenue
Password: alice123
```

### Test Customer 2
```
Name: Bob Smith
Phone: 2222222222
Address: 789 Pine Street
Password: bob123
```

### Test Orders
1. **Small Order**: 2 Shirts (Wash)
2. **Medium Order**: 1 Saree (Dry Wash), 2 Towels (Wash)
3. **Large Order**: 3 Pants (All Services), 1 Bedsheet (Wash), 2 Shirts (Dry Wash)

---

## 🎉 Success Indicators

When everything is working correctly:

✅ **Backend**: Server running without errors
✅ **Login**: Both customer and admin can login
✅ **Navigation**: All sidebar links work
✅ **Orders**: Can create and view orders
✅ **Notifications**: Can send and receive notifications
✅ **Bills**: Can view and print bills
✅ **Stats**: Dashboard shows correct numbers
✅ **No Errors**: Browser console is clean

---

## 📞 Need Help?

1. Check `DASHBOARD_FIX.md` for detailed fix information
2. Check browser console (F12) for errors
3. Check backend terminal for server errors
4. Verify database file exists: `CLEANEASE/cleanease.db`

---

## 🚀 Next Steps

Once everything is working:
1. Customize cloth types and prices
2. Add more customers
3. Process orders through different statuses
4. Test the complete order lifecycle
5. Explore the daily income reports
6. Test the print bill feature

**Enjoy using CleanEase! 🧺✨**
