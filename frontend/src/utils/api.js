export const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const apiCall = async (endpoint, options = {}) => {
  try {
    // Don't set Content-Type for FormData - let browser set it with boundary
    // Only set Content-Type for requests with a body
    const headers = {};
    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `API Error: ${response.statusText}`;
      throw new Error(errorMessage);
    }
    
    // Handle empty response body for DELETE requests
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    // Return empty object for successful requests with no body
    return {};
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};
