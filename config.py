import os

class Config:
    # Database — use /tmp on Render (writable), local otherwise
    DATABASE_PATH = os.environ.get('DATABASE_PATH', 'cleanease.db')

    SECRET_KEY     = os.environ.get('SECRET_KEY', 'cleanease-secret-key-2026')
    DEBUG          = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'

    ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
    ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')
