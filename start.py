#!/usr/bin/env python3
"""
CleanEase - One-click launcher
Run: python start.py
"""
import threading
import webbrowser
import time
import sys
import os

# Make sure we can import app from this directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app
from database import init_database

URL = 'http://127.0.0.1:5000/index.html'

def open_browser():
    time.sleep(2)
    print(f"\n>>> Opening browser at {URL}")
    print(">>> If browser doesn't open, manually go to:")
    print(f">>>   {URL}\n")
    webbrowser.open(URL)

if __name__ == '__main__':
    print("=" * 50)
    print("🧺  CleanEase")
    print("=" * 50)
    init_database()
    print("✅  Database ready")
    print(f"🌐  Server: {URL}")
    print("⚠️   Use the URL above — do NOT open HTML files directly!")
    print("    Press Ctrl+C to stop")
    print("-" * 50)

    t = threading.Thread(target=open_browser, daemon=True)
    t.start()

    app.run(debug=False, host='127.0.0.1', port=5000, use_reloader=False)
