# Webhook Callback Viewer

A Flask-based webhook callback viewer with React frontend that captures and displays webhook data in real-time. Features user session isolation and persistent storage using TinyDB.

## Features

- **User Session Isolation**: Each browser session sees only its own sessions
- **Shared Callback Data**: Callback requests are visible to all users who have the session

- **Persistent Storage**: Data is stored in TinyDB and persists between server restarts
- **Session Management**: Create unique sessions for different webhook endpoints
- **Real-time Data Capture**: Captures headers, query parameters, and payload from any HTTP request
- **Beautiful UI**: Modern React frontend with Bootstrap styling
- **Auto-refresh**: Automatically updates data without manual refresh
- **Copy to Clipboard**: Easy webhook URL copying
- **JSON Viewer**: Expandable JSON data viewing
- **Session Cleanup**: Delete sessions when no longer needed
- **Request Limiting**: Automatically keeps only the 20 most recent requests per session

## Project Structure

```
dlwebhook/
├── app.py                 # Flask backend application
├── database.py            # TinyDB database manager
├── user_session.py        # User session management
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── data/                 # Database storage directory
│   └── db.json          # TinyDB database file
├── templates/
│   └── index.html        # Main HTML template
└── static/
    ├── css/
    │   └── style.css     # Custom CSS styles
    └── js/
        └── app.js        # React frontend application
```

## Setup Instructions

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run the Application

```bash
python app.py
```

The application will start on `http://localhost:5001`

## Usage

### 1. User Session Isolation & Sharing

- **Browser-based**: Each browser session is automatically assigned a unique user ID
- **Session Privacy**: Users can only see their own sessions in their session list
- **Shared Callbacks**: When a callback is sent to a session, all users who have that session can see the callback data

- **Cross-browser**: Different browsers will see different session lists but shared callback data
- **Persistent**: User sessions persist between server restarts

### 2. Create a New Session

1. Open the application in your browser
2. Click "New Session" to generate a unique session ID
3. The system will automatically navigate to the session detail page

### 3. Use the Callback URL

1. Copy the callback URL from the session detail page
2. Use this URL as your webhook endpoint in external services
3. Send any HTTP request (GET, POST, PUT, DELETE, etc.) to this URL

### 4. Direct Session Access

Anyone with a callback URL can access the session directly:

1. **Share the callback URL**: Send the callback URL to anyone you want to share the session with
2. **Direct access**: When someone visits the callback URL in their browser, they automatically get access to the session
3. **Automatic sharing**: The session is automatically added to their session list
4. **Real-time updates**: They can immediately see all callback data and future updates

**Example**: If your callback URL is `http://localhost:5001/api/callback/abc123-def4-5678-ghij-klmnopqrstuv`, anyone can visit `http://localhost:5001/session/abc123-def4-5678-ghij-klmnopqrstuv` to access the session.

### 5. View Captured Data

- **Headers**: All request headers are captured and displayed
- **Query Parameters**: URL query parameters are shown
- **Payload**: Request body data (JSON, form data, or raw text)
- **Request Info**: URL, remote address, user agent, and timestamp
- **Request Limiting**: Only the 20 most recent requests are kept per session
- **Shared Visibility**: All users who have the session can see the same callback data



### 7. API Endpoints

#### Callback Endpoint
```
POST/GET/PUT/DELETE/PATCH /api/callback/<session_id>
```
Captures all incoming callback data for the specified session. Data is shared across all users who have this session.

**Response Format:**
```json
{
  "status": "success",
  "message": "Callback data captured for session <session_id>",
  "session_id": "<session_id>",
  "request_count": 1,
  "share_url": "http://localhost:5001/session/<session_id>"
}
```

The `share_url` contains the full URL that can be used to share the session with others by visiting the URL in a browser.

#### Session Management
```
GET    /api/sessions              # List all sessions for current user
GET    /api/sessions/<session_id> # Get specific session data (shared callbacks)
DELETE /api/sessions/<session_id> # Delete a session for current user
POST   /api/generate-session      # Generate new session
PUT    /api/sessions/<session_id>/name # Update session name
GET    /api/access-session/<session_id> # Access session by URL (auto-add to user's list)
```

## Example Usage

### Testing with curl

```bash
# Create a session first, then use the generated callback URL
curl -X POST http://localhost:5001/api/callback/your-session-id \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello World", "timestamp": "2024-01-01T00:00:00Z"}'
```

### Testing with JavaScript

```javascript
fetch('http://localhost:5001/api/callback/your-session-id', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Custom-Header': 'test-value'
  },
  body: JSON.stringify({
    event: 'user.created',
    data: { userId: 123, email: 'user@example.com' }
  })
});
```

## Features in Detail

### Session Management
- Each session has a unique UUID
- Sessions persist until manually deleted
- Real-time updates when new requests arrive

### Data Capture
- **Headers**: All HTTP headers including custom ones
- **Query Parameters**: URL query string parameters
- **Payload**: Supports JSON, form data, and raw text
- **Metadata**: Timestamp, method, URL, remote address, user agent

### User Interface
- **Responsive Design**: Works on desktop and mobile
- **Auto-refresh**: Data updates automatically every 5-10 seconds
- **Expandable Views**: Click to expand/collapse detailed data
- **Copy Functionality**: One-click webhook URL copying
- **Method Badges**: Color-coded HTTP method indicators

## Development

### Backend (Flask)
- Uses in-memory storage (sessions dictionary)
- CORS enabled for cross-origin requests
- Supports all HTTP methods
- JSON API responses

### Frontend (React)
- Built with React 18 and Babel
- Bootstrap 5 for styling
- Font Awesome icons
- Real-time data updates

## Production Considerations

For production deployment, consider:

1. **Database Storage**: Replace in-memory storage with a database (PostgreSQL, MongoDB, etc.)
2. **Authentication**: Add user authentication and session management
3. **Rate Limiting**: Implement rate limiting for webhook endpoints
4. **HTTPS**: Use HTTPS in production
5. **Logging**: Add proper logging and monitoring
6. **Environment Variables**: Use environment variables for configuration

## Troubleshooting

### Common Issues

1. **Port Already in Use**: Change the port in `app.py` or kill the existing process
2. **CORS Issues**: The backend has CORS enabled, but check browser console for errors
3. **Data Not Updating**: Check browser console for JavaScript errors

### Debug Mode

The application runs in debug mode by default. For production, set `debug=False` in `app.py`.

## License

This project is open source and available under the MIT License. 