# Database utility functions for CleanEase

import sqlite3
from datetime import datetime
import hashlib

def get_db_connection():
    """Get database connection with row factory"""
    conn = sqlite3.connect('cleanease.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    """Initialize database with all required tables"""
    conn = sqlite3.connect('cleanease.db')
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
            price REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
    ''')

    # Migrate: add payment_method column if it doesn't exist (for existing DBs)
    try:
        cursor.execute("ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'Cash'")
        conn.commit()
    except Exception:
        pass  # column already exists

    # Migrate: add cancel_reason column if it doesn't exist
    try:
        cursor.execute("ALTER TABLE orders ADD COLUMN cancel_reason TEXT")
        conn.commit()
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
    
    # Admin Logs Table (for tracking admin actions)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS admin_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT NOT NULL,
            details TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    
    for cloth_type in default_cloth_types:
        cursor.execute('''
            INSERT OR IGNORE INTO cloth_types (name, price) VALUES (?, ?)
        ''', cloth_type)
    
    conn.commit()
    conn.close()
    print("Database initialized successfully!")

def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, hashed_password):
    """Verify password against hash"""
    return hash_password(password) == hashed_password

def generate_order_id():
    """Generate unique order ID"""
    conn = get_db_connection()
    count = conn.execute('SELECT COUNT(*) as count FROM orders').fetchone()['count']
    conn.close()
    return f'ORD{str(count + 1).zfill(3)}'

def generate_notification_id():
    """Generate unique notification ID"""
    conn = get_db_connection()
    count = conn.execute('SELECT COUNT(*) as count FROM notifications').fetchone()['count']
    conn.close()
    return f'NOT{str(count + 1).zfill(3)}'

def log_admin_action(action, details=None):
    """Log admin actions for audit trail"""
    conn = get_db_connection()
    conn.execute('''
        INSERT INTO admin_logs (action, details) VALUES (?, ?)
    ''', (action, details))
    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_database()