#!/usr/bin/env python3
"""
Test script for the webhook callback viewer.
This script demonstrates how to send test requests to the webhook endpoints.
"""

import requests
import json
import time
import uuid

# Configuration
BASE_URL = "http://localhost:5001"

def test_webhook():
    """Test the webhook functionality"""
    
    print("🚀 Testing Webhook Callback Viewer")
    print("=" * 50)
    
    # Step 1: Generate a new session
    print("\n1. Generating new session...")
    try:
        response = requests.post(f"{BASE_URL}/api/generate-session")
        response.raise_for_status()
        session_data = response.json()
        session_id = session_data['session_id']
        webhook_url = f"{BASE_URL}{session_data['webhook_url']}"
        
        print(f"✅ Session created: {session_id}")
        print(f"📡 Webhook URL: {webhook_url}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to create session: {e}")
        return
    
    # Step 2: Send various test requests
    print("\n2. Sending test requests...")
    
    # Test 1: Simple POST with JSON
    print("\n   📤 Test 1: POST with JSON payload")
    try:
        payload = {
            "event": "user.created",
            "data": {
                "user_id": 123,
                "email": "test@example.com",
                "name": "John Doe"
            },
            "timestamp": "2024-01-01T12:00:00Z"
        }
        
        response = requests.post(
            webhook_url,
            json=payload,
            headers={
                "Content-Type": "application/json",
                "X-Event-Type": "user.created",
                "X-Source": "test-script"
            }
        )
        print(f"   ✅ Response: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 2: GET with query parameters
    print("\n   📤 Test 2: GET with query parameters")
    try:
        params = {
            "action": "verify",
            "token": "abc123",
            "timestamp": str(int(time.time()))
        }
        
        response = requests.get(webhook_url, params=params)
        print(f"   ✅ Response: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 3: PUT with form data
    print("\n   📤 Test 3: PUT with form data")
    try:
        form_data = {
            "action": "update",
            "user_id": "123",
            "status": "active"
        }
        
        response = requests.put(
            webhook_url,
            data=form_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        print(f"   ✅ Response: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 4: DELETE request
    print("\n   📤 Test 4: DELETE request")
    try:
        response = requests.delete(webhook_url)
        print(f"   ✅ Response: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Step 3: Check session data (Note: This will only work from a browser session)
    print("\n3. Checking session data...")
    print("   ℹ️  Session data can only be accessed from a browser session")
    print("   🌐 Open your browser and go to: http://localhost:5001")
    print("   🔍 Then navigate to the session to view the captured data")
    
    # Step 4: List all sessions (Note: This will only work from a browser session)
    print("\n4. Listing all sessions...")
    print("   ℹ️  Sessions are user-specific and can only be accessed from a browser")
    print("   📋 Each browser will see only its own sessions")
    
    print("\n" + "=" * 50)
    print("🎉 Test completed!")
    print(f"🌐 Open your browser and go to: {BASE_URL}")
    print(f"🔍 View session details at: {BASE_URL} (then click on the session)")

if __name__ == "__main__":
    # Check if the server is running
    try:
        response = requests.get(f"{BASE_URL}/api/sessions", timeout=5)
        test_webhook()
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to the server!")
        print("💡 Make sure the Flask application is running:")
        print("   python app.py")
    except Exception as e:
        print(f"❌ Unexpected error: {e}") 