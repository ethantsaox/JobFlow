#!/usr/bin/env python3
import requests
import json

# Test API connection
API_BASE = 'http://localhost:8000'

print('🧪 Testing Backend API Connection...')

# Test 1: Health check
try:
    response = requests.get(f'{API_BASE}/health')
    print(f'Health check: {response.status_code} - {response.text}')
except Exception as e:
    print(f'Health check failed: {e}')

# Test 2: Login
try:
    login_data = {
        'email': 'testuser@example.com',
        'password': 'testpass123'
    }
    response = requests.post(f'{API_BASE}/api/auth/login', json=login_data)
    print(f'Login: {response.status_code}')
    if response.status_code == 200:
        token = response.json()['access_token']
        print(f'Token obtained: {token[:50]}...')
        
        # Test 3: Create job application
        headers = {'Authorization': f'Bearer {token}'}
        job_data = {
            'title': 'Test Software Engineer',
            'company_name': 'Test Company Inc',
            'location': 'Remote',
            'description': 'Test job description from API test',
            'requirements': 'Python, FastAPI',
            'job_type': 'full-time',
            'source_url': 'https://example.com/test-job',
            'source_platform': 'test',
            'status': 'applied'
        }
        
        response = requests.post(f'{API_BASE}/api/job-applications/', json=job_data, headers=headers)
        print(f'Job creation: {response.status_code}')
        if response.status_code == 200:
            job = response.json()
            job_id = job.get('id', 'unknown')
            job_title = job.get('title', 'unknown')
            print(f'Job created: {job_id} - {job_title}')
        else:
            print(f'Job creation failed: {response.text}')
    else:
        print(f'Login failed: {response.text}')
        
except Exception as e:
    print(f'API test error: {e}')

print('✅ Backend API test complete!')