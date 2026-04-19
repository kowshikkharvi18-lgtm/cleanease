#!/usr/bin/env python3
"""
CleanEase Backend Server Runner
Run this file to start the backend server
"""

import os
import sys
from app import app
from database import init_database

def main():
    print("=" * 50)
    print("🧺 CleanEase Backend Server")
    print("=" * 50)
    
    # Initialize database
    print("Initializing database...")
    init_database()
    
    # Check if running in development mode
    if len(sys.argv) > 1 and sys.argv[1] == '--prod':
        print("Starting server in PRODUCTION mode...")
        app.config['DEBUG'] = False
        app.run(host='0.0.0.0', port=5000)
    else:
        print("Starting server in DEVELOPMENT mode...")
        print("Server will be available at: http://localhost:5000")
        print("API endpoints available at: http://localhost:5000/api/")
        print("\nPress Ctrl+C to stop the server")
        print("-" * 50)
        app.run(debug=True, host='0.0.0.0', port=5000)

if __name__ == '__main__':
    main()