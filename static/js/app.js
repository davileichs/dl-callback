const { useState, useEffect } = React;

// Utility functions
const getMethodClass = (method) => {
    return `method-${method.toLowerCase()}`;
};

// API service
const api = {
    async getSessions() {
        const response = await fetch('/api/sessions');
        return response.json();
    },
    
    async getSession(sessionId) {
        const response = await fetch(`/api/sessions/${sessionId}`);
        return response.json();
    },
    
    async deleteSession(sessionId) {
        const response = await fetch(`/api/sessions/${sessionId}`, {
            method: 'DELETE'
        });
        return response.json();
    },
    
    async generateSession() {
        const response = await fetch('/api/generate-session', {
            method: 'POST'
        });
        return response.json();
    },
    
    async updateSessionName(sessionId, name) {
        const response = await fetch(`/api/sessions/${sessionId}/name`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });
        return response.json();
    },

    async updateRedirectUrl(sessionId, redirectUrl) {
        const response = await fetch(`/api/sessions/${sessionId}/redirect-url`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ redirect_url: redirectUrl })
        });
        return response.json();
    },



    async accessSession(sessionId) {
        const response = await fetch(`/api/access-session/${sessionId}`);
        return response.json();
    }
};

// Tab title notification utility
let originalTitle = document.title;
let isPageFocused = true;
let currentNotificationCount = 0;

// Handle page focus/blur events
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        isPageFocused = false;
    } else {
        isPageFocused = true;
        resetTabTitle();
    }
});

// Handle window focus/blur events
window.addEventListener('focus', () => {
    isPageFocused = true;
    resetTabTitle();
});

window.addEventListener('blur', () => {
    isPageFocused = false;
});

function updateTabTitle(newRequests) {
    if (!isPageFocused && newRequests > 0) {
        currentNotificationCount += newRequests;
        document.title = `(${currentNotificationCount}) ${originalTitle}`;
    }
}

function resetTabTitle() {
    document.title = originalTitle;
    currentNotificationCount = 0;
}

// Copy to clipboard utility
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showCopyFeedback();
    });
}



function showCopyFeedback() {
    const feedback = document.createElement('div');
    feedback.className = 'alert alert-success copy-feedback';
    feedback.textContent = 'Copied to clipboard!';
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        feedback.remove();
    }, 2000);
}

// Headers Viewer Component
function HeadersViewer({ headers, title }) {
    if (!headers || Object.keys(headers).length === 0) {
        return (
            <div className="card mb-3">
                <div className="card-header">
                    {title}
                </div>
                <div className="card-body">
                    <div className="text-muted">No headers available</div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="card mb-3">
            <div className="card-header d-flex justify-content-between align-items-center">
                {title}
                <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => copyToClipboard(JSON.stringify(headers, null, 2))}
                    title="Copy all headers"
                >
                    <i className="fas fa-copy"></i> All
                </button>
            </div>
            <div className="card-body">
                <div className="headers-list">
                    {Object.entries(headers).map(([key, value]) => (
                        <div key={key} className="header-item d-flex justify-content-between align-items-center mb-2 p-2 border-bottom">
                            <div className="flex-grow-1 me-3">
                                <strong className="text-primary">{key}:</strong>
                                <span className="ms-2">{value}</span>
                            </div>
                            <button 
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => copyToClipboard(`${key}: ${value}`)}
                                title="Copy this header"
                            >
                                <i className="fas fa-copy"></i>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Query Parameters Viewer Component
function QueryParamsViewer({ queryParams, fullUrl, title }) {
    if (!queryParams || Object.keys(queryParams).length === 0) {
        return (
            <div className="card mb-3">
                <div className="card-header">
                    {title}
                </div>
                <div className="card-body">
                    <div className="text-muted">No query parameters available</div>
                </div>
            </div>
        );
    }
    
    // Extract query string from full URL
    const queryString = fullUrl ? fullUrl.split('?')[1] || '' : '';
    
    return (
        <div className="card mb-3">
            <div className="card-header d-flex justify-content-between align-items-center">
                {title}
                <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => copyToClipboard(JSON.stringify(queryParams, null, 2))}
                    title="Copy all query parameters"
                >
                    <i className="fas fa-copy"></i> All
                </button>
            </div>
            <div className="card-body">
                <div className="query-params-list mb-3">
                    {Object.entries(queryParams).map(([key, value]) => (
                        <div key={key} className="query-param-item d-flex align-items-center mb-2 p-2 border-bottom">
                            <div className="flex-grow-1">
                                <strong className="text-success">{key}:</strong>
                                <span className="ms-2">{value}</span>
                            </div>
                        </div>
                    ))}
                </div>
                {queryString && (
                    <div className="full-query-string">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <strong>Full Query String:</strong>
                            <button 
                                className="btn btn-sm btn-outline-info"
                                onClick={() => copyToClipboard(`?${queryString}`)}
                                title="Copy full query string"
                            >
                                <i className="fas fa-copy"></i> Copy Query
                            </button>
                        </div>
                        <div className="query-string-display p-2 border rounded">
                            ?{queryString}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// JSON Viewer Component
function JsonViewer({ data, title }) {
    if (!data || Object.keys(data).length === 0) {
        return (
            <div className="card mb-3">
                <div className="card-header">
                    {title}
                </div>
                <div className="card-body">
                    <div className="text-muted">No data available</div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="card mb-3">
            <div className="card-header d-flex justify-content-between align-items-center">
                {title}
                <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => copyToClipboard(JSON.stringify(data))}
                    title="Copy to clipboard"
                >
                    <i className="fas fa-copy"></i>
                </button>
            </div>
            <div className="card-body">
                <div className="json-viewer">
                    {JSON.stringify(data, null, 2)}
                </div>
            </div>
        </div>
    );
}

// Request Item Component
function RequestItem({ request }) {
    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };
    
    return (
        <div className="request-item">
            <div className="d-flex align-items-center gap-2 mb-3">
                <span className={`method-badge ${getMethodClass(request.method)}`}>
                    {request.method}
                </span>
                <span className="timestamp">{formatTimestamp(request.timestamp)}</span>
            </div>
            
            <HeadersViewer headers={request.headers} title="Headers" />
            <QueryParamsViewer queryParams={request.query_params} fullUrl={request.url} title="Query Parameters" />
            <JsonViewer data={request.payload} title="Payload" />
            
            <div className="card mb-3">
                <div className="card-header">Request Info</div>
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-6">
                            <strong>URL:</strong> {request.url}
                        </div>
                        <div className="col-md-6">
                            <strong>Remote Address:</strong> {request.remote_addr}
                        </div>
                    </div>
                    <div className="mt-2">
                        <strong>User Agent:</strong> {request.user_agent}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Session Detail Component with Three-Panel Layout
function SessionDetail({ sessionId, onBack, onNameUpdate }) {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [previousRequestCount, setPreviousRequestCount] = useState(0);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [allSessions, setAllSessions] = useState([]);
    const [editingName, setEditingName] = useState(false);
    const [editingNameValue, setEditingNameValue] = useState('');
    useEffect(() => {
        if (sessionId) {
            loadSession();
            loadAllSessions();
            const interval = setInterval(loadSession, 5000); // Auto-refresh every 5 seconds
            return () => {
                clearInterval(interval);
                resetTabTitle();
            };
        }
    }, [sessionId]);
    
    const loadAllSessions = async () => {
        try {
            const data = await api.getSessions();
            if (data && data.sessions && Array.isArray(data.sessions)) {
                setAllSessions(data.sessions);
            } else {
                console.warn('Invalid sessions data received:', data);
                setAllSessions([]);
            }
        } catch (err) {
            console.error('Failed to load all sessions:', err);
            setAllSessions([]);
        }
    };
    
    const loadSession = async () => {
        try {
            console.log('Loading session:', sessionId);
            const data = await api.getSession(sessionId);
            const newSession = data.session;
            console.log('Session data received:', newSession);
            
            if (!newSession) {
                throw new Error('Session data is null or undefined');
            }
            
            setSession(newSession);
            setError(null);
            
            // Check for new requests and update tab title
            if (newSession && newSession.requests) {
                const currentRequestCount = newSession.requests.length;
                
                if (isInitialLoad) {
                    // On initial load, just set the baseline count without notifications
                    setPreviousRequestCount(currentRequestCount);
                    setIsInitialLoad(false);
                    // Set the first request as selected by default
                    if (newSession.requests.length > 0 && !selectedRequest) {
                        setSelectedRequest(newSession.requests[0]);
                    }
                } else if (currentRequestCount > previousRequestCount) {
                    // Only count truly new requests
                    const newRequests = currentRequestCount - previousRequestCount;
                    updateTabTitle(newRequests);
                    setPreviousRequestCount(currentRequestCount);
                }
                
                // Update selectedRequest if it's no longer in the current session data
                if (selectedRequest && newSession.requests && newSession.requests.length > 0) {
                    const requestStillExists = newSession.requests.some(req => 
                        req && req.timestamp === selectedRequest.timestamp && 
                        req.method === selectedRequest.method
                    );
                    
                    if (!requestStillExists) {
                        // Selected request no longer exists, select the first one
                        setSelectedRequest(newSession.requests[0]);
                    } else {
                        // Update the selectedRequest with the fresh data
                        const updatedSelectedRequest = newSession.requests.find(req => 
                            req && req.timestamp === selectedRequest.timestamp && 
                            req.method === selectedRequest.method
                        );
                        if (updatedSelectedRequest) {
                            setSelectedRequest(updatedSelectedRequest);
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Error loading session:', err);
            setError('Failed to load session');
            setSession(null);
        } finally {
            setLoading(false);
        }
    };
    
    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this session?')) {
            try {
                await api.deleteSession(sessionId);
                onBack();
            } catch (err) {
                alert('Failed to delete session');
            }
        }
    };

    const handleSaveName = async () => {
        if (editingNameValue.trim()) {
            try {
                await api.updateSessionName(sessionId, editingNameValue.trim());
                const updatedSession = { ...session, name: editingNameValue.trim() };
                setSession(updatedSession);
                if (onNameUpdate) {
                    onNameUpdate(editingNameValue.trim());
                }
                setEditingName(false);
                setEditingNameValue('');
            } catch (err) {
                alert('Failed to update session name');
            }
        } else {
            setEditingName(false);
            setEditingNameValue('');
        }
    };

    const handleCancelEdit = () => {
        setEditingName(false);
        setEditingNameValue('');
    };
    
    if (loading) {
        return (
            <div className="loading">
                <i className="fas fa-spinner fa-spin"></i> Loading session...
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="alert alert-danger">
                {error}
                <button className="btn btn-outline-danger ms-2" onClick={() => onBack(null)}>
                    Go Back
                </button>
            </div>
        );
    }
    
    if (!session) {
        return (
            <div className="alert alert-warning">
                Session not found
                <button className="btn btn-outline-warning ms-2" onClick={() => onBack(null)}>
                    Go Back
                </button>
            </div>
        );
    }
    
    const webhookUrl = `${window.location.origin}/api/callback/${sessionId}`;
    
    try {
        return (
            <div className="session-detail-layout">
            {/* Header */}
            <div className="session-header">
                <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                        <button className="btn btn-outline-secondary" onClick={() => onBack(null)}>
                            <i className="fas fa-arrow-left"></i> Back to Sessions
                        </button>
                        <div className="session-title">
                            {editingName ? (
                                <div className="d-flex align-items-center gap-2">
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        value={editingNameValue}
                                        onChange={(e) => setEditingNameValue(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSaveName();
                                            }
                                        }}
                                        onBlur={handleSaveName}
                                        autoFocus
                                        style={{ width: '200px' }}
                                    />
                                    <button className="btn btn-sm btn-outline-success" onClick={handleSaveName}>
                                        <i className="fas fa-check"></i>
                                    </button>
                                    <button className="btn btn-sm btn-outline-secondary" onClick={handleCancelEdit}>
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            ) : (
                                <h5 className="mb-0 session-name-editable" onClick={() => {
                                    setEditingNameValue(session.name || `Session ${sessionId}`);
                                    setEditingName(true);
                                }}>
                                    {session.name || `Session ${sessionId}`}
                                    <i className="fas fa-edit ms-2" style={{ fontSize: '0.8rem', opacity: 0.7 }}></i>
                                </h5>
                            )}
                            <small className="text-muted">
                                {(session.requests || []).length} requests • Created {new Date(session.created_at).toLocaleDateString()}
                            </small>
                        </div>
                    </div>
                    <button className="btn btn-danger" onClick={handleDelete}>
                        <i className="fas fa-trash"></i> Delete Session
                    </button>
                </div>
            </div>
            
            {/* Configuration Panel - Top Section */}
            <div className="config-panel-top">
                <div className="row">
                    <div className="col-md-6">
                        <div className="card">
                            <div className="card-header position-relative">
                                <h6 className="mb-0">Callback URL</h6>
                                <button 
                                    className="btn btn-sm btn-outline-primary btn-copy"
                                    onClick={() => copyToClipboard(webhookUrl)}
                                    title="Copy to clipboard"
                                >
                                    <i className="fas fa-copy"></i>
                                </button>
                            </div>
                            <div className="card-body">
                                <div className="webhook-url">{webhookUrl}</div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="card">
                            <div className="card-header">
                                <h6 className="mb-0">Redirect To</h6>
                            </div>
                            <div className="card-body">
                                <div className="input-group">
                                    <input 
                                        type="url" 
                                        className="form-control" 
                                        value={session.redirect_url || ''} 
                                        onChange={(e) => {
                                            const updatedSession = { ...session, redirect_url: e.target.value };
                                            setSession(updatedSession);
                                        }}
                                        onBlur={async () => {
                                            try {
                                                await api.updateRedirectUrl(sessionId, session.redirect_url);
                                            } catch (err) {
                                                console.error('Failed to update redirect URL:', err);
                                            }
                                        }}
                                        placeholder="https://example.com/webhook"
                                    />
                                    <button 
                                        className="btn btn-outline-secondary" 
                                        type="button"
                                        onClick={async () => {
                                            try {
                                                await api.updateRedirectUrl(sessionId, session.redirect_url);
                                            } catch (err) {
                                                console.error('Failed to update redirect URL:', err);
                                            }
                                        }}
                                    >
                                        <i className="fas fa-save"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Three-Panel Layout */}
            <div className="session-panels">
                {/* Left Panel - Requests List */}
                <div className="requests-panel">
                    <div className="panel-header">
                        <h6 className="mb-0">Requests ({(session.requests || []).length})</h6>
                    </div>
                    <div className="requests-list">
                        {(session.requests || []).length === 0 ? (
                            <div className="empty-state">
                                <i className="fas fa-inbox"></i>
                                <p>No requests captured yet</p>
                            </div>
                        ) : (
                            (session.requests || [])
                                .filter(request => request && request.timestamp && request.method)
                                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                                .map((request, index) => (
                                    <div 
                                        key={index} 
                                        className={`request-entry ${selectedRequest === request ? 'active' : ''}`}
                                        onClick={() => setSelectedRequest(request)}
                                    >
                                        <span className={`badge ${getMethodClass(request.method)}`}>
                                            {request.method}
                                        </span>
                                        <span className="request-time">
                                            {new Date(request.timestamp).toLocaleTimeString()}
                                        </span>
                                        <span className="request-date">
                                            {new Date(request.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))
                        )}
                    </div>
                </div>
                
                {/* Center Panel - Request Details */}
                <div className="request-details-panel">
                    <div className="panel-header">
                        <h6 className="mb-0">Request Details</h6>
                    </div>
                    <div className="request-details-content">
                        {selectedRequest && selectedRequest.method ? (
                            <RequestItem request={selectedRequest} />
                        ) : (
                            <div className="empty-state">
                                <i className="fas fa-mouse-pointer"></i>
                                <p>Select a request to view details</p>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Right Panel - Sessions List */}
                <div className="sessions-panel">
                    <div className="panel-header">
                        <h6 className="mb-0">Other Sessions</h6>
                    </div>
                    <div className="sessions-list">
                        {allSessions.filter(s => s.id !== sessionId).length === 0 ? (
                            <div className="empty-state">
                                <i className="fas fa-folder-open"></i>
                                <p>No other sessions</p>
                            </div>
                        ) : (
                            allSessions
                                .filter(s => s && s.id && s.id !== sessionId)
                                .map((session) => (
                                    <div 
                                        key={session.id} 
                                        className="session-item"
                                        onClick={() => {
                                            if (onBack && session.id) {
                                                setSelectedRequest(null); // Clear selected request
                                                onBack(session.id);
                                            }
                                        }}
                                    >
                                        <div className="session-name">{session.name}</div>
                                        <div className="session-info">
                                            <small>{session.request_count} requests</small>
                                            <small>{new Date(session.last_updated).toLocaleDateString()}</small>
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
    } catch (error) {
        console.error('Error rendering SessionDetail:', error);
        return (
            <div className="alert alert-danger">
                <h5>Something went wrong</h5>
                <p>An error occurred while rendering the session details.</p>
                <button 
                    className="btn btn-outline-danger" 
                    onClick={() => window.location.reload()}
                >
                    Refresh Page
                </button>
            </div>
        );
    }
}

// Session List Component
function SessionList({ onSessionSelect }) {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    
    useEffect(() => {
        loadSessions();
        const interval = setInterval(loadSessions, 10000); // Auto-refresh every 10 seconds
        return () => clearInterval(interval);
    }, []);
    
    const loadSessions = async () => {
        try {
            const data = await api.getSessions();
            setSessions(data.sessions);
        } catch (err) {
            console.error('Failed to load sessions:', err);
        } finally {
            setLoading(false);
        }
    };
    
    const handleGenerateSession = async () => {
        setGenerating(true);
        try {
            const data = await api.generateSession();
            await loadSessions();
            onSessionSelect(data.session_id);
        } catch (err) {
            alert('Failed to generate session');
        } finally {
            setGenerating(false);
        }
    };
    
    const handleDeleteSession = async (sessionId) => {
        if (confirm('Are you sure you want to delete this session?')) {
            try {
                await api.deleteSession(sessionId);
                await loadSessions();
            } catch (err) {
                alert('Failed to delete session');
            }
        }
    };
    
    if (loading) {
        return (
            <div className="loading">
                <i className="fas fa-spinner fa-spin"></i> Loading sessions...
            </div>
        );
    }
    
    return (
        <div style={{ height: '100%', padding: '2rem', overflow: 'auto' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4>Sessions</h4>
                <button 
                    className="btn btn-primary"
                    onClick={handleGenerateSession}
                    disabled={generating}
                >
                    {generating ? (
                        <>
                            <i className="fas fa-spinner fa-spin"></i> Generating...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-plus"></i> New Session
                        </>
                    )}
                </button>
            </div>
            
            {sessions.length === 0 ? (
                <div className="empty-state">
                    <i className="fas fa-folder-open"></i>
                    <p>No sessions yet. Create your first session to start capturing callback data.</p>
                    <button 
                        className="btn btn-primary"
                        onClick={handleGenerateSession}
                        disabled={generating}
                    >
                        Create First Session
                    </button>
                </div>
            ) : (
                <div className="row">
                    {sessions.map(session => (
                                                        <div key={session.id} className="col-md-6 col-lg-3 mb-3">
                            <div className="card session-card h-100">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <div className="flex-grow-1 me-2">
                                            <h6 className="card-title text-truncate" title={session.name || session.id}>
                                                {session.name || `${session.id.substring(0, 8)}...`}
                                            </h6>
                                            <small className="text-muted">
                                                ID: {session.id.substring(0, 8)}...
                                            </small>
                                        </div>
                                        <button 
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteSession(session.id);
                                            }}
                                            title="Delete session"
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                    <p className="card-text">
                                        <small className="text-muted">
                                            <i className="fas fa-clock"></i> Created: {new Date(session.created_at).toLocaleString()}
                                        </small>
                                    </p>
                                    <p className="card-text">
                                        <small className="text-muted">
                                            <i className="fas fa-exchange-alt"></i> {session.request_count} requests
                                        </small>
                                    </p>
                                    <p className="card-text">
                                        <small className="text-muted">
                                            <i className="fas fa-sync"></i> Updated: {new Date(session.last_updated).toLocaleString()}
                                        </small>
                                    </p>
                                </div>
                                <div className="card-footer bg-transparent">
                                    <button 
                                        className="btn btn-primary btn-sm w-100"
                                        onClick={() => onSessionSelect(session.id, session.name)}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Error Boundary Component
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('React Error Boundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="alert alert-danger m-4">
                    <h5>Something went wrong</h5>
                    <p>An error occurred while rendering the session details.</p>
                    {this.state.error && (
                        <details className="mt-2">
                            <summary>Error Details</summary>
                            <pre className="mt-2 small">{this.state.error.toString()}</pre>
                        </details>
                    )}
                    <button 
                        className="btn btn-outline-danger" 
                        onClick={() => window.location.reload()}
                    >
                        Refresh Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

// Main App Component
function App() {
    const [currentView, setCurrentView] = useState('sessions'); // 'sessions' or 'session-detail'
    const [selectedSessionId, setSelectedSessionId] = useState(null);
    const [selectedSessionName, setSelectedSessionName] = useState(null);
    
    // Check for session ID in URL on component mount
    useEffect(() => {
        // Only run this on initial mount
        const urlParams = new URLSearchParams(window.location.search);
        const sessionIdFromQuery = urlParams.get('session');
        
        if (sessionIdFromQuery) {
            handleDirectSessionAccess(sessionIdFromQuery);
            // Clean up the URL by removing the query parameter
            window.history.replaceState({}, '', '/');
            return;
        }
        
        // Check for session ID in path (direct access)
        const pathParts = window.location.pathname.split('/');
        const sessionIdFromUrl = pathParts[pathParts.length - 1];
        
        // Check if the URL looks like a session ID (UUID format)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if (sessionIdFromUrl && uuidRegex.test(sessionIdFromUrl)) {
            // Redirect to the proper session URL format
            window.location.href = `/session/${sessionIdFromUrl}`;
        }
    }, []); // Empty dependency array - only run once on mount
    
    const handleDirectSessionAccess = async (sessionId) => {
        try {
            const result = await api.accessSession(sessionId);
            if (result.session) {
                setSelectedSessionId(sessionId);
                setSelectedSessionName(result.session.name);
                setCurrentView('session-detail');
                
                // Update URL without page reload
                window.history.pushState({}, '', `/${sessionId}`);
            }
        } catch (error) {
            console.error('Failed to access session:', error);
            // If session doesn't exist, stay on sessions page
        }
    };
    
    const handleSessionSelect = (sessionId, sessionName) => {
        setSelectedSessionId(sessionId);
        setSelectedSessionName(sessionName);
        setCurrentView('session-detail');
    };
    
    const handleBackToSessions = (newSessionId = null) => {
        if (newSessionId) {
            // Switch to a different session
            setSelectedSessionId(newSessionId);
            setCurrentView('session-detail');
            // Update URL for the new session
            window.history.pushState({}, '', `/${newSessionId}`);
        } else {
            // Go back to sessions list
            setCurrentView('sessions');
            setSelectedSessionId(null);
            setSelectedSessionName(null);
            resetTabTitle();
            // Update URL to home page
            window.history.pushState({}, '', '/');
        }
    };
    
    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflow: 'hidden' }}>
                {currentView === 'sessions' ? (
                    <SessionList onSessionSelect={handleSessionSelect} />
                ) : (
                    <SessionDetail 
                        sessionId={selectedSessionId} 
                        onBack={handleBackToSessions}
                        onNameUpdate={(name) => setSelectedSessionName(name)}
                    />
                )}
            </div>
        </div>
    );
}

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
); 