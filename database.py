from tinydb import TinyDB, Query
from datetime import datetime
import uuid
import os

class DatabaseManager:
    def __init__(self, db_path='data/db.json'):
        # Ensure data directory exists
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        
        self.db = TinyDB(db_path)
        self.sessions_table = self.db.table('sessions')
        self.requests_table = self.db.table('requests')
        self.Query = Query()
    
    def create_session(self, user_id, session_id=None):
        """Create a new session for a user"""
        if session_id is None:
            session_id = str(uuid.uuid4())
        
        session_data = {
            'session_id': session_id,
            'user_id': user_id,
            'name': f'Session {session_id[:8]}',
            'redirect_url': '',
            'created_at': datetime.now().isoformat(),
            'last_updated': datetime.now().isoformat()
        }
        
        self.sessions_table.insert(session_data)
        return session_id
    
    def get_user_sessions(self, user_id):
        """Get all sessions for a specific user"""
        sessions = self.sessions_table.search(self.Query.user_id == user_id)
        
        # Add request count for each session
        for session in sessions:
            session['request_count'] = len(self.get_session_requests(session['session_id']))
        
        return sessions
    
    def get_session(self, session_id, user_id):
        """Get a specific session if it belongs to the user"""
        session = self.sessions_table.get(
            (self.Query.session_id == session_id) & (self.Query.user_id == user_id)
        )
        return session
    
    def update_session_name(self, session_id, user_id, name):
        """Update session name"""
        result = self.sessions_table.update(
            {'name': name, 'last_updated': datetime.now().isoformat()},
            (self.Query.session_id == session_id) & (self.Query.user_id == user_id)
        )
        return len(result) > 0
    
    def update_redirect_url(self, session_id, user_id, redirect_url):
        """Update session redirect URL"""
        result = self.sessions_table.update(
            {'redirect_url': redirect_url, 'last_updated': datetime.now().isoformat()},
            (self.Query.session_id == session_id) & (self.Query.user_id == user_id)
        )
        return len(result) > 0
    
    def delete_session(self, session_id, user_id):
        """Delete a session and all its requests"""
        # Delete all requests for this session
        self.requests_table.remove(self.Query.session_id == session_id)
        
        # Delete the session
        result = self.sessions_table.remove(
            (self.Query.session_id == session_id) & (self.Query.user_id == user_id)
        )
        return len(result) > 0
    
    def add_request(self, session_id, user_id, request_data):
        """Add a request to a session"""
        # Verify session belongs to user
        session = self.get_session(session_id, user_id)
        if not session:
            return False
        
        # Add request data (without user_id for shared visibility)
        request_data['session_id'] = session_id
        request_data['timestamp'] = datetime.now().isoformat()
        
        self.requests_table.insert(request_data)
        
        # Update session last_updated for all users who own this session
        self.sessions_table.update(
            {'last_updated': datetime.now().isoformat()},
            self.Query.session_id == session_id
        )
        
        # Keep only 20 most recent requests
        self._limit_session_requests(session_id, 20)
        
        return True
    
    def get_session_requests(self, session_id, user_id=None):
        """Get all requests for a session (shared across all users who own the session)"""
        requests = self.requests_table.search(self.Query.session_id == session_id)
        return requests
    
    def _limit_session_requests(self, session_id, limit):
        """Keep only the most recent requests for a session (shared across all users)"""
        requests = self.requests_table.search(self.Query.session_id == session_id)
        if len(requests) > limit:
            # Sort by timestamp and keep only the most recent
            sorted_requests = sorted(requests, key=lambda x: x['timestamp'])
            requests_to_delete = sorted_requests[:-limit]
            
            # Delete older requests
            for req in requests_to_delete:
                self.requests_table.remove(self.Query.doc_id == req.doc_id)
    
    def session_exists(self, session_id, user_id):
        """Check if a session exists for a user"""
        return self.get_session(session_id, user_id) is not None
    
    def get_session_by_id(self, session_id):
        """Get any session with the given session_id (regardless of user)"""
        sessions = self.sessions_table.search(self.Query.session_id == session_id)
        return sessions[0] if sessions else None
    
    def copy_session_to_user(self, session_id, user_id):
        """Copy an existing session to a new user"""
        # Get any existing session with this ID
        existing_session = self.get_session_by_id(session_id)
        if not existing_session:
            return False
        
        # Check if user already has this session
        if self.session_exists(session_id, user_id):
            return True  # Already exists
        
        # Create a copy of the session for the user
        copied_session = {
            'session_id': session_id,
            'user_id': user_id,
            'name': existing_session['name'],
            'created_at': existing_session['created_at'],
            'last_updated': datetime.now().isoformat()
        }
        
        self.sessions_table.insert(copied_session)
        return True
    
 