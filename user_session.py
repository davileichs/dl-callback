import uuid
from flask import request, session
import hashlib

class UserSessionManager:
    def __init__(self):
        pass
    
    def get_user_id(self):
        """Get or create a user ID for the current browser session"""
        if 'user_id' not in session:
            # Generate a unique user ID based on browser fingerprint
            user_id = self._generate_user_id()
            session['user_id'] = user_id
        
        return session['user_id']
    
    def _generate_user_id(self):
        """Generate a unique user ID based on browser characteristics"""
        # Create a fingerprint from browser information
        fingerprint_data = [
            request.headers.get('User-Agent', ''),
            request.headers.get('Accept-Language', ''),
            request.headers.get('Accept-Encoding', ''),
            request.remote_addr,
            str(uuid.uuid4())  # Add some randomness
        ]
        
        # Create a hash of the fingerprint
        fingerprint = hashlib.sha256(''.join(fingerprint_data).encode()).hexdigest()
        return fingerprint[:16]  # Use first 16 characters as user ID
    
    def clear_user_session(self):
        """Clear the current user session"""
        session.pop('user_id', None) 