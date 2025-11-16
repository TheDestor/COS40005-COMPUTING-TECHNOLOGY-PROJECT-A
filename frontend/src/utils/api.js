import ky from 'ky';

// Store the refresh promise to prevent multiple simultaneous refresh attempts
let refreshPromise = null;

// Create a configured ky instance with automatic token refresh
const api = ky.create({
  prefixUrl: import.meta.env.VITE_API_URL || 'http://localhost:5050',
  credentials: 'include',
  timeout: 30000,
  hooks: {
    beforeRequest: [
      async (request) => {
        // Get token from localStorage
        const token = localStorage.getItem('accessToken');
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      }
    ],
    afterResponse: [
      async (request, options, response) => {
        // If we get 401 or 403, try to refresh token
        if (response.status === 401 || response.status === 403) {
          console.log('🔄 Got 401/403, attempting token refresh...');
          
          // Prevent multiple simultaneous refresh attempts
          if (!refreshPromise) {
            refreshPromise = ky.post('api/auth/refresh', {
              credentials: 'include',
              timeout: 10000
            }).json()
              .then(data => {
                refreshPromise = null;
                return data;
              })
              .catch(err => {
                refreshPromise = null;
                throw err;
              });
          }

          try {
            const refreshData = await refreshPromise;
            
            if (refreshData.success && refreshData.accessToken) {
              console.log('✅ Token refreshed, retrying original request...');
              
              // Update token in localStorage
              localStorage.setItem('accessToken', refreshData.accessToken);
              
              // Retry the original request with new token
              request.headers.set('Authorization', `Bearer ${refreshData.accessToken}`);
              return ky(request);
            }
          } catch (error) {
            console.error('❌ Token refresh failed, logging out...');
            
            // Clear token and redirect to login
            localStorage.removeItem('accessToken');
            window.location.href = '/login';
            throw error;
          }
        }
        
        return response;
      }
    ]
  }
});

export default api;