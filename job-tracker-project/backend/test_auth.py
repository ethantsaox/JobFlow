#!/usr/bin/env python3
"""
Test Authentication System
Tests user registration, login, and protected routes
"""

import asyncio
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_server_health():
    """Test if server is running"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Server is running")
            return True
        else:
            print(f"❌ Server health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Server is not running: {e}")
        return False

def test_auth_flow():
    """Test complete authentication flow"""
    print("\n🔐 Testing Authentication Flow")
    print("-" * 40)
    
    # Test data
    test_user = {
        "email": f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com",
        "first_name": "Test",
        "last_name": "User", 
        "password": "testpassword123"
    }
    
    # Step 1: Register user
    print("1. Testing user registration...")
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=test_user,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 201:
            print("   ✅ User registration successful")
            user_data = response.json()
            print(f"   📧 Registered: {user_data['email']}")
            print(f"   👤 Name: {user_data['full_name']}")
        else:
            print(f"   ❌ Registration failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Registration error: {e}")
        return False
    
    # Step 2: Login user
    print("\n2. Testing user login...")
    try:
        login_data = {
            "email": test_user["email"],
            "password": test_user["password"]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            print("   ✅ Login successful")
            token_data = response.json()
            access_token = token_data["access_token"]
            print(f"   🔑 Access token received (length: {len(access_token)})")
            print(f"   ⏰ Expires in: {token_data['expires_in']} seconds")
        else:
            print(f"   ❌ Login failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Login error: {e}")
        return False
    
    # Step 3: Test protected route
    print("\n3. Testing protected route access...")
    try:
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        
        if response.status_code == 200:
            print("   ✅ Protected route access successful")
            user_info = response.json()
            print(f"   👤 User: {user_info['full_name']}")
            print(f"   📧 Email: {user_info['email']}")
            print(f"   ✅ Active: {user_info['is_active']}")
        else:
            print(f"   ❌ Protected route access failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Protected route error: {e}")
        return False
    
    # Step 4: Test logout
    print("\n4. Testing logout...")
    try:
        response = requests.post(f"{BASE_URL}/api/auth/logout", headers=headers)
        
        if response.status_code == 200:
            print("   ✅ Logout successful")
        else:
            print(f"   ❌ Logout failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Logout error: {e}")
    
    return True

def main():
    print("🧪 Personal Spending Assistant - Authentication Test")
    print("=" * 55)
    
    # Test server health
    if not test_server_health():
        print("\n❌ Cannot proceed without running server")
        print("Start server with: cd backend && source venv/bin/activate && python main.py")
        return 1
    
    # Test authentication flow
    success = test_auth_flow()
    
    print("\n📊 Test Results")
    print("-" * 15)
    
    if success:
        print("🎉 All authentication tests PASSED!")
        print("✅ Authentication system is working correctly")
        return 0
    else:
        print("❌ Some authentication tests FAILED!")
        print("⚠️  Please check the server logs for details")
        return 1

if __name__ == "__main__":
    exit(main())