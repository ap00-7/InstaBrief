// OAuth utility functions for Google and Microsoft authentication

export const initiateGoogleAuth = () => {
  const clientId = 'your_google_client_id_here'; // This should be set in environment variables
  const redirectUri = `${window.location.origin}/auth/callback`;
  const scope = 'openid email profile';
  const responseType = 'code';
  const state = Math.random().toString(36).substring(2, 15);
  
  // Store state for verification
  localStorage.setItem('oauth_state', state);
  localStorage.setItem('oauth_provider', 'google');
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `response_type=${responseType}&` +
    `state=${state}`;
  
  window.location.href = authUrl;
};

export const initiateMicrosoftAuth = () => {
  const clientId = 'your_microsoft_client_id_here'; // This should be set in environment variables
  const redirectUri = `${window.location.origin}/auth/callback`;
  const scope = 'openid email profile';
  const responseType = 'code';
  const state = Math.random().toString(36).substring(2, 15);
  
  // Store state for verification
  localStorage.setItem('oauth_state', state);
  localStorage.setItem('oauth_provider', 'microsoft');
  
  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `response_type=${responseType}&` +
    `state=${state}`;
  
  window.location.href = authUrl;
};

export const handleOAuthCallback = async (code, state) => {
  const storedState = localStorage.getItem('oauth_state');
  const provider = localStorage.getItem('oauth_provider');
  
  if (state !== storedState) {
    throw new Error('Invalid state parameter');
  }
  
  // Clean up stored values
  localStorage.removeItem('oauth_state');
  localStorage.removeItem('oauth_provider');
  
  // Exchange code for token via backend
  const response = await fetch('/api/auth/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
      state,
      provider
    })
  });
  
  if (!response.ok) {
    throw new Error('OAuth authentication failed');
  }
  
  const data = await response.json();
  return data.access_token;
};
