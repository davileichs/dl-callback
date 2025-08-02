from flask import Flask, request, jsonify, render_template, session, redirect, send_file
from flask_cors import CORS
import json
import uuid

from datetime import datetime
import os
from database import DatabaseManager
from user_session import UserSessionManager

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
CORS(app)

# Initialize database and user session managers
db = DatabaseManager()
user_manager = UserSessionManager()

@app.route('/')
def index():
    """Serve the React frontend"""
    return render_template('index.html')

@app.route('/favicon.ico')
def favicon():
    """Serve the favicon"""
    return send_file('static/favicon.svg', mimetype='image/svg+xml')



@app.route('/session/<session_id>')
def session_page(session_id):
    """Redirect to home page with session ID for direct session access"""
    return redirect(f'/?session={session_id}')



@app.route('/api/callback/<session_id>', methods=['POST', 'GET', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
def callback_endpoint(session_id):
    """Callback endpoint that captures all incoming data"""
    # Check if this is a browser request by looking at Accept header
    accept_header = request.headers.get('Accept', '')
    is_browser_request = (
        request.method == 'GET' and 
        ('text/html' in accept_header or 'application/xhtml+xml' in accept_header)
    )
    
    # If it's a browser request, redirect to the session page
    if is_browser_request:
        return redirect(f'/session/{session_id}')
    
    # Get user ID from session
    user_id = user_manager.get_user_id()
    
    # Check if session exists for any user (to get session name)
    existing_session = db.get_session_by_id(session_id)
    
    # Create session if it doesn't exist for this user
    if not db.session_exists(session_id, user_id):
        if existing_session:
            # Session exists for another user, copy it to this user
            db.copy_session_to_user(session_id, user_id)
        else:
            # Create new session
            db.create_session(user_id, session_id)
    
    # Capture request data
    request_data = {
        'method': request.method,
        'headers': dict(request.headers),
        'query_params': dict(request.args),
        'path': request.path,
        'url': request.url,
        'remote_addr': request.remote_addr,
        'user_agent': request.user_agent.string
    }
    
    # Capture payload based on content type
    try:
        if request.is_json:
            request_data['payload'] = request.get_json()
        elif request.content_type and 'form' in request.content_type:
            request_data['payload'] = dict(request.form)
        else:
            request_data['payload'] = request.get_data(as_text=True)
    except Exception as e:
        request_data['payload'] = f"Error parsing payload: {str(e)}"
    
    # Add request to database
    success = db.add_request(session_id, user_id, request_data)
    
    if not success:
        return jsonify({'error': 'Session not found or access denied'}), 404
    
    # Get current request count
    requests = db.get_session_requests(session_id, user_id)
    
    # Get current user's session data to get redirect URL
    current_user_session = db.get_session(session_id, user_id)
    redirect_url = current_user_session.get('redirect_url', '') if current_user_session else ''
    
    # Return success response with redirect URL for JavaScript handling
    response_data = {
        'status': 'success',
        'message': f'Callback data captured for session {session_id}',
        'session_id': session_id,
        'request_count': len(requests),
        'share_url': f'{request.host_url.rstrip("/")}/session/{session_id}',
        'redirect_url': redirect_url,
        'request_data': request_data
    }
    
    return jsonify(response_data), 200

@app.route('/api/sessions', methods=['GET'])
def get_sessions():
    """Get all sessions for the current user"""
    user_id = user_manager.get_user_id()
    sessions = db.get_user_sessions(user_id)
    
    return jsonify({
        'sessions': [
            {
                'id': session['session_id'],
                'name': session['name'],
                'created_at': session['created_at'],
                'last_updated': session['last_updated'],
                'request_count': session['request_count']
            }
            for session in sessions
        ]
    })

@app.route('/api/sessions/<session_id>', methods=['GET'])
def get_session(session_id):
    """Get specific session data for the current user"""
    user_id = user_manager.get_user_id()
    session_data = db.get_session(session_id, user_id)
    
    if not session_data:
        return jsonify({'error': 'Session not found'}), 404
    
    # Get requests for this session
    requests = db.get_session_requests(session_id, user_id)
    
    # Format session data
    session_response = {
        'id': session_data['session_id'],
        'name': session_data['name'],
        'redirect_url': session_data.get('redirect_url', ''),
        'created_at': session_data['created_at'],
        'last_updated': session_data['last_updated'],
        'requests': requests
    }
    
    return jsonify({
        'session': session_response,
        'share_url': f'{request.host_url.rstrip("/")}/session/{session_id}'
    })

@app.route('/api/sessions/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    """Delete a session for the current user"""
    user_id = user_manager.get_user_id()
    success = db.delete_session(session_id, user_id)
    
    if not success:
        return jsonify({'error': 'Session not found'}), 404
    
    return jsonify({'message': 'Session deleted successfully'})

@app.route('/api/sessions/<session_id>/name', methods=['PUT'])
def update_session_name(session_id):
    """Update session name for the current user"""
    user_id = user_manager.get_user_id()
    
    data = request.get_json()
    if not data or 'name' not in data:
        return jsonify({'error': 'Name is required'}), 400
    
    new_name = data['name'].strip()
    if not new_name:
        return jsonify({'error': 'Name cannot be empty'}), 400
    
    success = db.update_session_name(session_id, user_id, new_name)
    
    if not success:
        return jsonify({'error': 'Session not found'}), 404
    
    return jsonify({
        'message': 'Session name updated successfully',
        'name': new_name
    })

@app.route('/api/sessions/<session_id>/redirect-url', methods=['PUT'])
def update_redirect_url(session_id):
    """Update session redirect URL for the current user"""
    user_id = user_manager.get_user_id()
    
    data = request.get_json()
    if not data or 'redirect_url' not in data:
        return jsonify({'error': 'redirect_url is required'}), 400
    
    redirect_url = data['redirect_url'].strip()
    
    success = db.update_redirect_url(session_id, user_id, redirect_url)
    
    if not success:
        return jsonify({'error': 'Session not found'}), 404
    
    return jsonify({
        'message': 'Redirect URL updated successfully',
        'redirect_url': redirect_url
    })

@app.route('/api/sessions/<session_id>/requests', methods=['GET'])
def get_session_requests(session_id):
    """Get only the requests for a session (lightweight endpoint for polling)"""
    try:
        user_id = user_manager.get_user_id()
        requests = db.get_session_requests(session_id, user_id)
        
        return jsonify({
            'requests': requests,
            'count': len(requests)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-session', methods=['POST'])
def generate_session():
    """Generate a new session ID for the current user"""
    user_id = user_manager.get_user_id()
    session_id = db.create_session(user_id)
    
    return jsonify({
        'session_id': session_id,
        'webhook_url': f'/api/callback/{session_id}'
    })



@app.route('/api/access-session/<session_id>', methods=['GET'])
def access_session(session_id):
    """Access a session by URL - automatically adds it to user's session list"""
    user_id = user_manager.get_user_id()
    
    # Check if session exists for any user
    existing_session = db.get_session_by_id(session_id)
    if not existing_session:
        return jsonify({'error': 'Session not found'}), 404
    
    # Add session to user's list if they don't have it
    if not db.session_exists(session_id, user_id):
        db.copy_session_to_user(session_id, user_id)
    
    # Get session data for the user
    session_data = db.get_session(session_id, user_id)
    requests = db.get_session_requests(session_id, user_id)
    
    # Format session data
    session_response = {
        'id': session_data['session_id'],
        'name': session_data['name'],
        'redirect_url': session_data.get('redirect_url', ''),
        'created_at': session_data['created_at'],
        'last_updated': session_data['last_updated'],
        'requests': requests
    }
    
    return jsonify({
        'session': session_response,
        'share_url': f'{request.host_url.rstrip("/")}/session/{session_id}',
        'message': 'Session accessed successfully'
    })

@app.route('/api/redirect/<session_id>', methods=['POST'])
def handle_redirect(session_id):
    """Handle redirect forwarding using JavaScript"""
    user_id = user_manager.get_user_id()
    session_data = db.get_session(session_id, user_id)
    
    if not session_data:
        return jsonify({'error': 'Session not found'}), 404
    
    redirect_url = session_data.get('redirect_url')
    if not redirect_url:
        return jsonify({'error': 'No redirect URL configured'}), 400
    
    # Get request data from the request body
    data = request.get_json()
    if not data or 'request_data' not in data:
        return jsonify({'error': 'Request data is required'}), 400
    
    request_data = data['request_data']
    
    # Return the redirect information for JavaScript to handle
    return jsonify({
        'redirect_url': redirect_url,
        'request_data': request_data,
        'session_id': session_id
    })



if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=False, host='0.0.0.0', port=port) 