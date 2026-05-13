// CJ Dropshipping API Authentication
import admin from './firebaseAdmin';

const CJ_API_URL = 'https://developers.cjdropshipping.com/api2.0/v1';

const db = admin.firestore();
const authTokenRef = db.collection('cj_config').doc('auth');
const apiKeyRef = db.collection('cj_config').doc('cj_token');

/**
 * Get permanent CJ API key from Firestore
 */
async function getCJApiKey() {
  const doc = await apiKeyRef.get();
  
  if (!doc.exists || !doc.data().token) {
    throw new Error('CJ API key not found in Firestore. Please set it in cj_config/cj_token document.');
  }
  
  return doc.data().token;
}

/**
 * Get CJ access token from Firestore or fetch new one using permanent API key
 * Flow: Check Firestore → if missing/expired, get permanent key → generate new access token
 */
export async function getCJToken() {
  try {
    const doc = await authTokenRef.get();

    // Check if token exists and is not expired
    if (doc.exists) {
      const { accessToken, expireTime } = doc.data();
      
      if (expireTime && Date.now() < expireTime) {
        console.log('✅ Using valid access token from Firestore');
        return accessToken;
      }
      
      console.log('⚠️ Access token expired, refreshing...');
    } else {
      console.log('⚠️ No access token in Firestore, generating new one...');
    }

    // Token missing or expired - get permanent API key and generate new access token
    const apiKey = await getCJApiKey();
    
    const response = await fetch(`${CJ_API_URL}/authentication/getAccessToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    });

    const data = await response.json();

    if (!data.result || !data.data || !data.data.accessToken) {
      console.error('❌ Failed to fetch CJ access token:', data);
      throw new Error(data.message || 'Failed to fetch CJ access token');
    }

    const { accessToken, accessTokenExpiryDate } = data.data;
    const expireTime = new Date(accessTokenExpiryDate).getTime();

    // Save access token to Firestore
    await authTokenRef.set({ 
      accessToken, 
      expireTime,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ New access token saved to Firestore: cj_config/auth`);
    console.log(`⏰ Access token expires at: ${new Date(expireTime).toISOString()}`);

    return accessToken;
  } catch (error) {
    console.error('❌ Error in getCJToken:', error);
    throw error;
  }
}

/**
 * Refresh access token by deleting old one and fetching new with permanent API key
 */
export async function refreshCJToken() {
  try {
    console.log('🔄 Refreshing CJ access token...');
    
    // Delete old access token
    await authTokenRef.delete();
    console.log('🗑️ Old access token deleted from Firestore');
    
    // Fetch new one using permanent API key
    return await getCJToken();
  } catch (error) {
    console.error('❌ Error refreshing access token:', error);
    throw error;
  }
}

/**
 * Wrapper for CJ API requests with automatic access token refresh on auth errors
 * Retries once if token is invalid/expired
 */
export async function cjRequest(apiCall) {
  try {
    return await apiCall();
  } catch (error) {
    // Check if it's a token error (expired, invalid, unauthorized)
    const errorCode = error.code || error.data?.code;
    const isTokenError = 
      errorCode === 1600102 || // Token expired
      errorCode === 1600103 || // Token invalid
      errorCode === 401 ||     // Unauthorized
      errorCode === 403;       // Forbidden
    
    if (isTokenError) {
      console.log(`⚠️ Access token error detected (code ${errorCode}), refreshing and retrying...`);
      await refreshCJToken();
      return await apiCall(); // Retry with new access token
    }
    
    // Not a token error, throw it
    throw error;
  }
}
