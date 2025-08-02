// Redirect functionality using JavaScript
class RedirectManager {
    constructor() {
        this.timeout = 10000; // 10 seconds timeout
    }

    /**
     * Forward request data to a redirect URL using JavaScript fetch API
     * @param {string} redirectUrl - The URL to forward the request to
     * @param {Object} requestData - The captured request data
     * @returns {Promise<Object>} - Response with status and data
     */
    async forwardRequestToRedirectUrl(redirectUrl, requestData) {
        try {
            // Get the original method from request data
            const originalMethod = (requestData.method || 'POST').toUpperCase();
            
            // Get original headers (excluding some that shouldn't be forwarded)
            const originalHeaders = requestData.headers || {};
            const headers = {};
            
            for (const [key, value] of Object.entries(originalHeaders)) {
                // Skip headers that shouldn't be forwarded
                if (!['host', 'content-length', 'connection', 'accept-encoding'].includes(key.toLowerCase())) {
                    headers[key] = value;
                }
            }

            // Handle query parameters for ALL methods (not just GET)
            const originalQueryParams = requestData.query_params || {};
            let finalUrl = redirectUrl;
            
            if (Object.keys(originalQueryParams).length > 0) {
                const url = new URL(redirectUrl);
                
                // Add query parameters to URL
                for (const [key, value] of Object.entries(originalQueryParams)) {
                    url.searchParams.append(key, value);
                }
                
                finalUrl = url.toString();
            }

            // Prepare fetch options
            const fetchOptions = {
                method: originalMethod,
                headers: headers
            };

            // Handle different HTTP methods
            if (originalMethod === 'GET') {
                // GET requests don't have a body
                const response = await fetch(finalUrl, fetchOptions);
                return this.processResponse(response, originalMethod);
                
            } else if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(originalMethod)) {
                // For other methods, forward original payload
                const originalPayload = requestData.payload;
                
                if (originalPayload !== undefined && originalPayload !== null) {
                    if (typeof originalPayload === 'object') {
                        fetchOptions.body = JSON.stringify(originalPayload);
                        // Set content-type if not already set
                        if (!headers['Content-Type'] && !headers['content-type']) {
                            headers['Content-Type'] = 'application/json';
                        }
                    } else {
                        fetchOptions.body = originalPayload;
                        // For string payloads, set content-type if not already set
                        if (!headers['Content-Type'] && !headers['content-type']) {
                            headers['Content-Type'] = 'text/plain';
                        }
                    }
                }
                
                const response = await fetch(finalUrl, fetchOptions);
                return this.processResponse(response, originalMethod);
                
            } else if (originalMethod === 'OPTIONS') {
                const response = await fetch(finalUrl, fetchOptions);
                return this.processResponse(response, originalMethod);
                
            } else {
                // Default to POST
                const originalPayload = requestData.payload;
                if (originalPayload !== undefined && originalPayload !== null) {
                    if (typeof originalPayload === 'object') {
                        fetchOptions.body = JSON.stringify(originalPayload);
                        if (!headers['Content-Type'] && !headers['content-type']) {
                            headers['Content-Type'] = 'application/json';
                        }
                    } else {
                        fetchOptions.body = originalPayload;
                        if (!headers['Content-Type'] && !headers['content-type']) {
                            headers['Content-Type'] = 'text/plain';
                        }
                    }
                }
                
                const response = await fetch(finalUrl, fetchOptions);
                return this.processResponse(response, 'POST');
            }
            
        } catch (error) {
            return {
                error: error.message,
                success: false,
                method_used: requestData.method || 'POST'
            };
        }
    }

    /**
     * Process the fetch response and return standardized format
     * @param {Response} response - The fetch response object
     * @param {string} methodUsed - The HTTP method that was used
     * @returns {Object} - Standardized response object
     */
    async processResponse(response, methodUsed) {
        try {
            const responseText = await response.text();
            return {
                status_code: response.status,
                response_text: responseText.substring(0, 500), // Limit response text
                success: response.status < 400,
                method_used: methodUsed,
                headers: Object.fromEntries(response.headers.entries())
            };
        } catch (error) {
            return {
                error: error.message,
                success: false,
                method_used: methodUsed
            };
        }
    }

    /**
     * Test a redirect URL to see if it's accessible
     * @param {string} redirectUrl - The URL to test
     * @returns {Promise<Object>} - Test result
     */
    async testRedirectUrl(redirectUrl) {
        try {
            const response = await fetch(redirectUrl, {
                method: 'OPTIONS',
                timeout: 5000
            });
            
            return {
                success: true,
                status_code: response.status,
                accessible: response.status < 400
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                accessible: false
            };
        }
    }
}

// Create global instance
window.redirectManager = new RedirectManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RedirectManager;
} 