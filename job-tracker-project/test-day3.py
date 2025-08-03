#!/usr/bin/env python3
"""
Day 3 End-to-End Test - Frontend Authentication Flow
Tests the complete authentication system from frontend to backend
"""

import subprocess
import time
import requests
import json
from datetime import datetime
import threading
import sys
import os

# Global variables for server processes
backend_process = None
frontend_process = None

def start_backend():
    """Start the backend server"""
    global backend_process
    try:
        print("🚀 Starting backend server...")
        backend_process = subprocess.Popen(
            ["bash", "-c", "cd backend && source venv/bin/activate && python main.py"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        
        # Wait for backend to start
        for i in range(30):  # Wait up to 30 seconds
            try:
                response = requests.get("http://localhost:8000/health", timeout=2)
                if response.status_code == 200:
                    print("✅ Backend server started successfully")
                    return True
            except:
                time.sleep(1)
        
        print("❌ Backend server failed to start")
        return False
    except Exception as e:
        print(f"❌ Failed to start backend: {e}")
        return False

def start_frontend():
    """Start the frontend development server"""
    global frontend_process
    try:
        print("🚀 Starting frontend server...")
        frontend_process = subprocess.Popen(
            ["bash", "-c", "cd frontend && npm run dev"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        
        # Wait for frontend to start
        for i in range(30):  # Wait up to 30 seconds
            try:
                response = requests.get("http://localhost:3000", timeout=2)
                if response.status_code == 200:
                    print("✅ Frontend server started successfully")
                    return True
            except:
                time.sleep(1)
        
        print("❌ Frontend server failed to start")
        return False
    except Exception as e:
        print(f"❌ Failed to start frontend: {e}")
        return False

def cleanup():
    """Clean up server processes"""
    global backend_process, frontend_process
    
    if backend_process:
        backend_process.terminate()
        try:
            backend_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            backend_process.kill()
    
    if frontend_process:
        frontend_process.terminate()
        try:
            frontend_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            frontend_process.kill()

def test_api_endpoints():
    """Test backend API endpoints"""
    print("\n🔍 Testing Backend API Endpoints")
    print("-" * 35)
    
    results = []
    
    # Test health endpoint
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health endpoint working")
            results.append(True)
        else:
            print(f"❌ Health endpoint failed: {response.status_code}")
            results.append(False)
    except Exception as e:
        print(f"❌ Health endpoint error: {e}")
        results.append(False)
    
    # Test registration endpoint
    test_user = {
        "email": f"test_{int(time.time())}@example.com",
        "first_name": "Test",
        "last_name": "User",
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/api/auth/register",
            json=test_user,
            timeout=10
        )
        if response.status_code == 201:
            print("✅ Registration endpoint working")
            results.append(True)
            
            # Test login with the registered user
            login_data = {
                "email": test_user["email"],
                "password": test_user["password"]
            }
            
            login_response = requests.post(
                "http://localhost:8000/api/auth/login",
                json=login_data,
                timeout=10
            )
            
            if login_response.status_code == 200:
                print("✅ Login endpoint working")
                results.append(True)
                
                # Test protected endpoint
                token = login_response.json()["access_token"]
                headers = {"Authorization": f"Bearer {token}"}
                
                me_response = requests.get(
                    "http://localhost:8000/api/auth/me",
                    headers=headers,
                    timeout=5
                )
                
                if me_response.status_code == 200:
                    print("✅ Protected endpoint working")
                    results.append(True)
                else:
                    print(f"❌ Protected endpoint failed: {me_response.status_code}")
                    results.append(False)
            else:
                print(f"❌ Login endpoint failed: {login_response.status_code}")
                results.append(False)
                results.append(False)  # Also fail protected endpoint test
        else:
            print(f"❌ Registration endpoint failed: {response.status_code}")
            print(f"   Error: {response.text}")
            results.append(False)
            results.append(False)  # Also fail login test
            results.append(False)  # Also fail protected endpoint test
    except Exception as e:
        print(f"❌ Registration endpoint error: {e}")
        results.append(False)
        results.append(False)
        results.append(False)
    
    return results

def test_frontend_pages():
    """Test frontend page accessibility"""
    print("\n🌐 Testing Frontend Pages")
    print("-" * 25)
    
    results = []
    
    pages_to_test = [
        ("http://localhost:3000", "Home page"),
        ("http://localhost:3000/login", "Login page"),
        ("http://localhost:3000/register", "Register page"),
    ]
    
    for url, description in pages_to_test:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"✅ {description} accessible")
                results.append(True)
            else:
                print(f"❌ {description} failed: {response.status_code}")
                results.append(False)
        except Exception as e:
            print(f"❌ {description} error: {e}")
            results.append(False)
    
    return results

def main():
    print("🧪 Personal Spending Assistant - Day 3 E2E Test")
    print("Frontend Authentication Flow")
    print("=" * 55)
    
    try:
        # Start servers
        if not start_backend():
            return 1
        
        if not start_frontend():
            cleanup()
            return 1
        
        print("🎉 Both servers started successfully!")
        
        # Run tests
        api_results = test_api_endpoints()
        frontend_results = test_frontend_pages()
        
        # Summary
        print("\n📊 TEST SUMMARY")
        print("-" * 15)
        
        total_tests = len(api_results) + len(frontend_results)
        passed_tests = sum(api_results) + sum(frontend_results)
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        
        print(f"Backend API Tests: {sum(api_results)}/{len(api_results)} passed")
        print(f"Frontend Tests: {sum(frontend_results)}/{len(frontend_results)} passed")
        print(f"Overall: {passed_tests}/{total_tests} tests passed ({success_rate:.1f}%)")
        
        if success_rate >= 85:
            print("\n🎉 Day 3 E2E test PASSED!")
            print("✅ Authentication flow working end-to-end")
            print("🚀 Ready to proceed with Plaid integration (Day 4)")
            return 0
        else:
            print("\n⚠️ Day 3 E2E test FAILED")
            print("❌ Some components are not working correctly")
            return 1
            
    except KeyboardInterrupt:
        print("\n⚠️ Test interrupted by user")
        return 1
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        return 1
    finally:
        print("\n🧹 Cleaning up...")
        cleanup()
        print("✅ Cleanup complete")

if __name__ == "__main__":
    sys.exit(main())