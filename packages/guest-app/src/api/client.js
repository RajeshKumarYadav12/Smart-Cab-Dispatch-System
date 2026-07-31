const API_BASE = '/api';

export const fetchWithAuth = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  const fetchOptions = {
    ...options,
    headers,
    credentials: 'include' 
  };
  
  const response = await fetch(`${API_BASE}${endpoint}`, fetchOptions);
  
  if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (refreshRes.ok) {
        
        const retryResponse = await fetch(`${API_BASE}${endpoint}`, fetchOptions);
        const retryData = await retryResponse.json();
        if (!retryResponse.ok) throw new Error(retryData.message || 'API Error after retry');
        return retryData;
      }
    } catch (err) {
      console.error("Refresh failed", err);
    }

    console.error("Unauthorized. Redirecting to login.");
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'API Error');
  
  return data;
};
