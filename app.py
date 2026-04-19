from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import hashlib
from datetime import datetime
import json
import os
from config import Config
from database import init_database

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=False)

# Auto-initialize DB on startup (needed for Render)
init_database()

# Serve HTML files directly
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    # Don't serve Python files
    if filename.endswith('.py'):
        return jsonify({'error': 'Not found'}), 404
    return send_from_directory('.', filename)

# Database initialization
def init_db():
    conn = sqlite3.connect(Config.DATABASE_PATH)
    cursor = conn.cursor()
    
    # Enable foreign key constraints
    cursor.execute('PRAGMA foreign_keys = ON')

    # Customer Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT UNIQUE NOT NULL,
            address TEXT NOT NULL,
            password TEXT NOT NULL,
            registered_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'Active'
        )
    ''')
    
    # Cloth Types Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cloth_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            price REAL NOT NULL
        )
    ''')
    
    # Orders Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            customer_id INTEGER,
            customer_name TEXT NOT NULL,
            customer_phone TEXT NOT NULL,
            customer_address TEXT NOT NULL,
            order_date DATE NOT NULL,
            delivery_date DATE NOT NULL,
            total REAL NOT NULL,
            status TEXT DEFAULT 'Order Placed',
            payment_status TEXT DEFAULT 'Unpaid',
            payment_method TEXT DEFAULT 'Cash',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
    ''')

    # Migrate: add payment_method column if it doesn't exist (for existing DBs)
    try:
        cursor.execute("ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'Cash'")
    except Exception:
        pass  # column already exists
    
    # Order Items Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT NOT NULL,
            cloth_type TEXT NOT NULL,
            service_type TEXT NOT NULL DEFAULT 'Wash',
            quantity INTEGER NOT NULL,
            base_price REAL NOT NULL,
            multiplier REAL NOT NULL DEFAULT 1.0,
            price REAL NOT NULL,
            subtotal REAL GENERATED ALWAYS AS (quantity * price) STORED,
            FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
        )
    ''')
    
    # Notifications Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            to_phone TEXT NOT NULL,
            to_name TEXT NOT NULL,
            from_user TEXT DEFAULT 'Admin',
            message TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            read_status BOOLEAN DEFAULT FALSE
        )
    ''')
    
    # Insert default cloth types
    default_cloth_types = [
        ('Shirt', 50.00),
        ('Pant', 60.00),
        ('Saree', 150.00),
        ('Bedsheet', 100.00),
        ('Towel', 30.00)
    ]
    
    cursor.executemany('''
        INSERT OR IGNORE INTO cloth_types (name, price) VALUES (?, ?)
    ''', default_cloth_types)
    
    conn.commit()
    conn.close()

# Helper function to hash passwords
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# Helper function to get database connection
def get_db_connection():
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON')
    return conn

# Admin login endpoint
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if username == Config.ADMIN_USERNAME and password == Config.ADMIN_PASSWORD:
        return jsonify({
            'success': True,
            'user': {
                'username': username,
                'role': 'admin',
                'name': 'Admin User'
            }
        })
    else:
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

# Customer registration endpoint
@app.route('/api/customer/register', methods=['POST'])
def customer_register():
    data = request.json
    name = data.get('name')
    phone = data.get('phone')
    address = data.get('address')
    password = data.get('password')
    
    if not all([name, phone, address, password]):
        return jsonify({'success': False, 'message': 'All fields are required'}), 400
    
    conn = get_db_connection()
    
    # Check if phone already exists
    existing = conn.execute('SELECT id FROM customers WHERE phone = ?', (phone,)).fetchone()
    if existing:
        conn.close()
        return jsonify({'success': False, 'message': 'Phone number already registered'}), 400
    
    # Insert new customer
    hashed_password = hash_password(password)
    conn.execute('''
        INSERT INTO customers (name, phone, address, password)
        VALUES (?, ?, ?, ?)
    ''', (name, phone, address, hashed_password))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Registration successful'})

# Customer login endpoint
@app.route('/api/customer/login', methods=['POST'])
def customer_login():
    data = request.json
    phone = data.get('phone')
    password = data.get('password')
    
    if not phone or not password:
        return jsonify({'success': False, 'message': 'Phone and password required'}), 400
    
    conn = get_db_connection()
    customer = conn.execute('''
        SELECT * FROM customers WHERE phone = ?
    ''', (phone,)).fetchone()
    conn.close()
    
    if customer and customer['password'] == hash_password(password):
        return jsonify({
            'success': True,
            'user': {
                'phone': customer['phone'],
                'role': 'customer',
                'name': customer['name'],
                'address': customer['address']
            }
        })
    else:
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

# Lookup customer by phone (for forgot password step 1)
@app.route('/api/customer/lookup', methods=['POST'])
def customer_lookup():
    data  = request.json
    phone = data.get('phone', '').strip()
    if not phone:
        return jsonify({'success': False, 'message': 'Phone number is required'}), 400
    conn     = get_db_connection()
    customer = conn.execute('SELECT id FROM customers WHERE phone = ?', (phone,)).fetchone()
    conn.close()
    if customer:
        return jsonify({'success': True})
    return jsonify({'success': False, 'message': 'No account found with that phone number'}), 404

# Reset password
@app.route('/api/customer/reset-password', methods=['POST'])
def reset_password():
    data         = request.json
    phone        = data.get('phone', '').strip()
    new_password = data.get('new_password', '')
    if not phone or not new_password:
        return jsonify({'success': False, 'message': 'Phone and new password are required'}), 400
    conn     = get_db_connection()
    customer = conn.execute('SELECT id FROM customers WHERE phone = ?', (phone,)).fetchone()
    if not customer:
        conn.close()
        return jsonify({'success': False, 'message': 'Account not found'}), 404
    conn.execute('UPDATE customers SET password = ? WHERE phone = ?',
                 (hash_password(new_password), phone))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Password reset successfully'})

# Find phone by name + address (for forgot phone)
@app.route('/api/customer/find-phone', methods=['POST'])
def find_phone():
    data    = request.json
    name    = data.get('name', '').strip().lower()
    address = data.get('address', '').strip().lower()
    if not name or not address:
        return jsonify({'success': False, 'message': 'Name and address are required'}), 400
    conn      = get_db_connection()
    customers = conn.execute('SELECT name, phone, address FROM customers').fetchall()
    conn.close()
    for c in customers:
        if c['name'].lower() == name and address in c['address'].lower():
            # Show partially masked phone: 83****9727
            phone = c['phone']
            masked = phone[:2] + '****' + phone[-4:] if len(phone) >= 6 else phone
            return jsonify({'success': True, 'phone': masked})
    return jsonify({'success': False, 'message': 'No account found with that name and address'}), 404

# Update customer profile
@app.route('/api/customer/profile', methods=['PUT'])
def update_customer_profile():
    data = request.json
    name = data.get('name')
    phone = data.get('phone')
    address = data.get('address', '')
    new_password = data.get('password')
    current_phone = data.get('current_phone', phone)

    if not name or not phone:
        return jsonify({'success': False, 'message': 'Name and phone are required'}), 400

    conn = get_db_connection()

    # Check if new phone conflicts with another account
    conflict = conn.execute(
        'SELECT id FROM customers WHERE phone = ? AND phone != ?', (phone, current_phone)
    ).fetchone()

    if conflict:
        conn.close()
        return jsonify({'success': False, 'message': 'Phone number already in use by another account'}), 400

    if new_password:
        hashed = hash_password(new_password)
        conn.execute(
            'UPDATE customers SET name = ?, phone = ?, address = ?, password = ? WHERE phone = ?',
            (name, phone, address, hashed, current_phone)
        )
    else:
        conn.execute(
            'UPDATE customers SET name = ?, phone = ?, address = ? WHERE phone = ?',
            (name, phone, address, current_phone)
        )

    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Profile updated successfully'})

# Get cloth types
@app.route('/api/cloth-types', methods=['GET'])
def get_cloth_types():
    conn = get_db_connection()
    cloth_types = conn.execute('SELECT * FROM cloth_types ORDER BY name').fetchall()
    conn.close()
    
    return jsonify([dict(row) for row in cloth_types])

# Get service types
@app.route('/api/service-types', methods=['GET'])
def get_service_types():
    service_types = [
        {'name': 'Wash', 'multiplier': 1.0, 'description': 'Standard wash service'},
        {'name': 'Dry Wash', 'multiplier': 1.5, 'description': 'Dry cleaning service'},
        {'name': 'All Services', 'multiplier': 2.0, 'description': 'Complete wash and dry service'}
    ]
    return jsonify(service_types)

# Add cloth type (Admin only)
@app.route('/api/cloth-types', methods=['POST'])
def add_cloth_type():
    data = request.json
    name = data.get('name')
    price = data.get('price')
    
    if not name or not price:
        return jsonify({'success': False, 'message': 'Name and price required'}), 400
    
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('INSERT INTO cloth_types (name, price) VALUES (?, ?)', (name, price))
        cloth_type_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'cloth_type': {'id': cloth_type_id, 'name': name, 'price': price}
        })
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'success': False, 'message': 'Cloth type already exists'}), 400

# Update cloth type price
@app.route('/api/cloth-types/<int:cloth_id>', methods=['PUT'])
def update_cloth_type(cloth_id):
    data = request.json
    price = data.get('price')
    
    if not price:
        return jsonify({'success': False, 'message': 'Price required'}), 400
    
    conn = get_db_connection()
    conn.execute('UPDATE cloth_types SET price = ? WHERE id = ?', (price, cloth_id))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Price updated successfully'})

# Delete cloth type
@app.route('/api/cloth-types/<int:cloth_id>', methods=['DELETE'])
def delete_cloth_type(cloth_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM cloth_types WHERE id = ?', (cloth_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Cloth type deleted successfully'})

# Create order
@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.json
    customer_name    = data.get('customer_name')
    customer_phone   = data.get('customer_phone')
    customer_address = data.get('customer_address')
    order_date       = data.get('order_date')
    delivery_date    = data.get('delivery_date')
    items            = data.get('items', [])
    payment_method   = data.get('payment_method', 'Cash')   # Cash or Scan

    if not all([customer_name, customer_phone, customer_address, order_date, delivery_date, items]):
        return jsonify({'success': False, 'message': 'All fields are required'}), 400

    conn = get_db_connection()

    # Get customer ID
    customer   = conn.execute('SELECT id FROM customers WHERE phone = ?', (customer_phone,)).fetchone()
    customer_id = customer['id'] if customer else None

    # Validate items and calculate total
    try:
        total = sum(float(item['quantity']) * float(item['price']) for item in items)
        if total != total:  # NaN check
            raise ValueError('Invalid price in items')
    except (KeyError, TypeError, ValueError) as e:
        conn.close()
        return jsonify({'success': False, 'message': f'Invalid item data: {str(e)}'}), 400

    # Generate order ID
    order_count = conn.execute('SELECT COUNT(*) as count FROM orders').fetchone()['count']
    order_id = f'ORD{str(order_count + 1).zfill(3)}'

    # Insert order — store chosen payment method
    conn.execute('''
        INSERT INTO orders (id, customer_id, customer_name, customer_phone, customer_address,
                           order_date, delivery_date, total, payment_method)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (order_id, customer_id, customer_name, customer_phone, customer_address,
          order_date, delivery_date, total, payment_method))
    
    # Insert order items
    for item in items:
        conn.execute('''
            INSERT INTO order_items (order_id, cloth_type, service_type, quantity, base_price, multiplier, price)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (order_id, item['cloth_type'], item.get('service_type', 'Wash'), 
              item['quantity'], item.get('base_price', item['price']), 
              item.get('multiplier', 1.0), item['price']))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'order_id': order_id, 'total': total})

# Get orders
@app.route('/api/orders', methods=['GET'])
def get_orders():
    phone = request.args.get('phone')  # For customer-specific orders
    
    conn = get_db_connection()
    
    if phone:
        # Get customer orders
        orders = conn.execute('''
            SELECT * FROM orders WHERE customer_phone = ? ORDER BY created_at DESC
        ''', (phone,)).fetchall()
    else:
        # Get all orders (admin)
        orders = conn.execute('SELECT * FROM orders ORDER BY created_at DESC').fetchall()
    
    # Get order items for each order
    orders_with_items = []
    for order in orders:
        items = conn.execute('''
            SELECT * FROM order_items WHERE order_id = ?
        ''', (order['id'],)).fetchall()
        
        order_dict = dict(order)
        order_dict['items'] = [dict(item) for item in items]
        orders_with_items.append(order_dict)
    
    conn.close()
    return jsonify(orders_with_items)

# Cancel order (customer only, Pending status only)
@app.route('/api/orders/<order_id>/cancel', methods=['PUT'])
def cancel_order(order_id):
    data   = request.json
    reason = data.get('reason', '').strip()

    if not reason:
        return jsonify({'success': False, 'message': 'Cancellation reason is required'}), 400

    conn  = get_db_connection()
    order = conn.execute('SELECT status FROM orders WHERE id = ?', (order_id,)).fetchone()

    if not order:
        conn.close()
        return jsonify({'success': False, 'message': 'Order not found'}), 404

    if order['status'] != 'Order Placed':
        conn.close()
        return jsonify({'success': False, 'message': 'Orders can only be cancelled before pickup'}), 400

    conn.execute(
        'UPDATE orders SET status = ?, cancel_reason = ? WHERE id = ?',
        ('Cancelled', reason, order_id)
    )
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Order cancelled successfully'})

# Update order status
@app.route('/api/orders/<order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    data = request.json
    status = data.get('status')
    
    if not status:
        return jsonify({'success': False, 'message': 'Status required'}), 400
    
    conn = get_db_connection()
    conn.execute('UPDATE orders SET status = ? WHERE id = ?', (status, order_id))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Status updated successfully'})

# Update payment status + method
@app.route('/api/orders/<order_id>/payment', methods=['PUT'])
def update_payment_status(order_id):
    data = request.json
    payment_status = data.get('payment_status')
    payment_method = data.get('payment_method', 'Cash')

    if not payment_status:
        return jsonify({'success': False, 'message': 'Payment status required'}), 400

    conn = get_db_connection()
    conn.execute(
        'UPDATE orders SET payment_status = ?, payment_method = ? WHERE id = ?',
        (payment_status, payment_method, order_id)
    )
    conn.commit()
    conn.close()

    return jsonify({'success': True, 'message': 'Payment updated successfully'})

# Get customers
@app.route('/api/customers', methods=['GET'])
def get_customers():
    conn = get_db_connection()
    customers = conn.execute('''
        SELECT c.*, COUNT(o.id) as total_orders
        FROM customers c
        LEFT JOIN orders o ON c.id = o.customer_id
        GROUP BY c.id
        ORDER BY c.name
    ''').fetchall()
    conn.close()
    
    return jsonify([dict(row) for row in customers])

# Send notification
@app.route('/api/notifications', methods=['POST'])
def send_notification():
    data = request.json
    to_phone = data.get('to_phone')
    message = data.get('message')
    
    if not to_phone or not message:
        return jsonify({'success': False, 'message': 'Phone and message required'}), 400
    
    conn = get_db_connection()
    
    # Get customer name
    customer = conn.execute('SELECT name FROM customers WHERE phone = ?', (to_phone,)).fetchone()
    if not customer:
        conn.close()
        return jsonify({'success': False, 'message': 'Customer not found'}), 404
    
    # Generate notification ID
    notif_count = conn.execute('SELECT COUNT(*) as count FROM notifications').fetchone()['count']
    notif_id = f'NOT{str(notif_count + 1).zfill(3)}'
    
    # Insert notification
    conn.execute('''
        INSERT INTO notifications (id, to_phone, to_name, message)
        VALUES (?, ?, ?, ?)
    ''', (notif_id, to_phone, customer['name'], message))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'notification_id': notif_id})

# Get notifications
@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    phone = request.args.get('phone')
    
    conn = get_db_connection()
    
    if phone:
        # Get customer notifications
        notifications = conn.execute('''
            SELECT * FROM notifications WHERE to_phone = ? ORDER BY timestamp DESC
        ''', (phone,)).fetchall()
    else:
        # Get all notifications (admin)
        notifications = conn.execute('''
            SELECT * FROM notifications ORDER BY timestamp DESC
        ''').fetchall()
    
    conn.close()
    return jsonify([dict(row) for row in notifications])

# Mark notification as read
@app.route('/api/notifications/<notif_id>/read', methods=['PUT'])
def mark_notification_read(notif_id):
    conn = get_db_connection()
    conn.execute('UPDATE notifications SET read_status = TRUE WHERE id = ?', (notif_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Notification marked as read'})

# Get daily income report
@app.route('/api/reports/daily-income', methods=['GET'])
def get_daily_income():
    date = request.args.get('date')
    
    if not date:
        return jsonify({'success': False, 'message': 'Date required'}), 400
    
    conn = get_db_connection()
    
    # Get all orders for the date
    orders = conn.execute('''
        SELECT * FROM orders WHERE order_date = ?
    ''', (date,)).fetchall()
    
    total_orders = len(orders)

    # Total Income = only PAID orders (actual money received)
    paid_income   = sum(order['total'] for order in orders if order['payment_status'] == 'Paid')

    # Unpaid = money not yet collected
    unpaid_income = sum(order['total'] for order in orders if order['payment_status'] != 'Paid')

    # Total income is only what has actually been received (paid)
    total_income  = paid_income
    
    conn.close()
    
    return jsonify({
        'date': date,
        'total_orders': total_orders,
        'total_income': total_income,
        'paid_income': paid_income,
        'unpaid_income': unpaid_income,
        'orders': [dict(order) for order in orders]
    })

if __name__ == '__main__':
    init_db()
    print("Database initialized successfully!")
    print("Starting CleanEase Backend Server...")
    app.run(debug=True, host='0.0.0.0', port=5000)