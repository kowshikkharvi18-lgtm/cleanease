# CleanEase Backend - Python Flask API

A complete backend API for the CleanEase online laundry service application using Flask and SQLite.

## Features

### Database Tables
- **customers**: Customer registration and authentication
- **cloth_types**: Cloth types and pricing management
- **orders**: Order management with status tracking
- **order_items**: Individual items in each order with service types
- **notifications**: Admin-to-customer messaging system
- **admin_logs**: Audit trail for admin actions

### API Endpoints

#### Authentication
- `POST /api/admin/login` - Admin login
- `POST /api/customer/register` - Customer registration
- `POST /api/customer/login` - Customer login

#### Cloth Types Management
- `GET /api/cloth-types` - Get all cloth types
- `POST /api/cloth-types` - Add new cloth type (Admin)
- `PUT /api/cloth-types/<id>` - Update cloth type price (Admin)
- `DELETE /api/cloth-types/<id>` - Delete cloth type (Admin)

#### Service Types
- `GET /api/service-types` - Get all service types with multipliers

#### Order Management
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get orders (all for admin, customer-specific with ?phone=)
- `PUT /api/orders/<id>/status` - Update order status
- `PUT /api/orders/<id>/payment` - Update payment status

#### Customer Management
- `GET /api/customers` - Get all customers with order counts

#### Notifications
- `POST /api/notifications` - Send notification to customer
- `GET /api/notifications` - Get notifications (all for admin, customer-specific with ?phone=)
- `PUT /api/notifications/<id>/read` - Mark notification as read

#### Reports
- `GET /api/reports/daily-income?date=YYYY-MM-DD` - Get daily income report

## Installation & Setup

### Prerequisites
- Python 3.7+
- pip (Python package manager)

### Installation Steps

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Initialize Database**
   ```bash
   python database.py
   ```

3. **Start Server**
   ```bash
   python run_server.py
   ```

   Or for production:
   ```bash
   python run_server.py --prod
   ```

4. **Test API (Optional)**
   ```bash
   python api_test.py
   ```

## Server Information

- **Development Server**: http://localhost:5000
- **API Base URL**: http://localhost:5000/api
- **Database**: SQLite (cleanease.db)
- **CORS**: Enabled for frontend integration

## Default Data

### Admin Credentials
- Username: `admin`
- Password: `admin123`

### Default Cloth Types
- Shirt: ₹50.00
- Pant: ₹60.00
- Saree: ₹150.00
- Bedsheet: ₹100.00
- Towel: ₹30.00

### Service Types
- Wash: 1x multiplier (Standard service)
- Dry Wash: 1.5x multiplier (Dry cleaning)
- All Services: 2x multiplier (Complete service)

## Database Schema

### customers
```sql
id (INTEGER PRIMARY KEY)
name (TEXT)
phone (TEXT UNIQUE)
address (TEXT)
password (TEXT - SHA-256 hashed)
registered_date (TIMESTAMP)
status (TEXT)
```

### orders
```sql
id (TEXT PRIMARY KEY - ORD001, ORD002...)
customer_id (INTEGER FK)
customer_name (TEXT)
customer_phone (TEXT)
customer_address (TEXT)
order_date (DATE)
delivery_date (DATE)
total (REAL)
status (TEXT - Pending/Processing/Completed/Delivered)
payment_status (TEXT - Paid/Unpaid)
created_at (TIMESTAMP)
```

### order_items
```sql
id (INTEGER PRIMARY KEY)
order_id (TEXT FK)
cloth_type (TEXT)
service_type (TEXT - Wash/Dry Wash/All Services)
quantity (INTEGER)
base_price (REAL)
multiplier (REAL)
price (REAL - final price after service multiplier)
subtotal (REAL - calculated)
```

## API Usage Examples

### Customer Registration
```javascript
fetch('http://localhost:5000/api/customer/register', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        name: 'John Doe',
        phone: '555-0101',
        address: '123 Main St',
        password: 'mypassword'
    })
})
```

### Create Order with Service Types
```javascript
fetch('http://localhost:5000/api/orders', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        customer_name: 'John Doe',
        customer_phone: '555-0101',
        customer_address: '123 Main St',
        order_date: '2026-03-15',
        delivery_date: '2026-03-20',
        items: [
            {
                cloth_type: 'Shirt', 
                service_type: 'Wash',
                quantity: 3, 
                base_price: 50.00,
                multiplier: 1.0,
                price: 50.00
            },
            {
                cloth_type: 'Pant', 
                service_type: 'Dry Wash',
                quantity: 2, 
                base_price: 60.00,
                multiplier: 1.5,
                price: 90.00
            }
        ]
    })
})
```

## File Structure

```
backend/
├── app.py              # Main Flask application
├── config.py           # Configuration settings
├── database.py         # Database utilities
├── run_server.py       # Server runner script
├── api_test.py         # API testing script
├── requirements.txt    # Python dependencies
├── README_BACKEND.md   # This file
└── cleanease.db        # SQLite database (created automatically)
```

## Development Notes

- The server runs with CORS enabled for frontend integration
- All passwords are hashed using SHA-256
- Foreign key constraints are enabled
- Automatic ID generation for orders (ORD001, ORD002...) and notifications (NOT001, NOT002...)
- Admin actions are logged for audit trail
- Service types affect pricing with multipliers (Wash: 1x, Dry Wash: 1.5x, All Services: 2x)

## Production Deployment

For production deployment:
1. Set environment variables for sensitive data
2. Use a production WSGI server (gunicorn, uWSGI)
3. Consider using PostgreSQL instead of SQLite
4. Implement proper authentication tokens (JWT)
5. Add rate limiting and security headers

## Troubleshooting

### Common Issues
1. **Port 5000 already in use**: Change port in run_server.py
2. **CORS errors**: Check CORS_ORIGINS in config.py
3. **Database locked**: Close any open database connections
4. **Import errors**: Ensure all dependencies are installed

### Logs
- Server logs are printed to console
- Database operations are logged
- Admin actions are stored in admin_logs table