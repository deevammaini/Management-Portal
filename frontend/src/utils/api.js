const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const apiCall = async (endpoint, options = {}) => {
  try {
    // Don't set Content-Type for FormData - let browser set it with boundary
    const headers = {};
    if (!(options.body instanceof FormData)) {
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
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};
