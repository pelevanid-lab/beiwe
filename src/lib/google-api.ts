export async function fetchWithGoogleAuth(url: string, options: RequestInit = {}): Promise<Response> {
  let accessToken = localStorage.getItem('google_access_token');
  
  if (!accessToken) {
    throw new Error('No Google access token found');
  }

  // First attempt
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`
    }
  });

  // If 401 Unauthorized, try to refresh the token
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('google_refresh_token');
    
    if (!refreshToken) {
      throw new Error('Google token expired and no refresh token available');
    }

    try {
      const refreshRes = await fetch('/api/auth/google/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      const refreshData = await refreshRes.json();

      if (refreshRes.ok && refreshData.access_token) {
        // Save new access token
        localStorage.setItem('google_access_token', refreshData.access_token);
        accessToken = refreshData.access_token;

        // Retry original request
        response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${accessToken}`
          }
        });
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      console.error('Auto-refresh failed:', error);
      throw error;
    }
  }

  return response;
}
