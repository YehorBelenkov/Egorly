// CJ Dropshipping - Get Access Token
export default async function handler(req, res) {
  const CJ_API_KEY = 'CJ5076350@api@929b5315c1be4308b7ef0ad011c76194';
  const CJ_API_URL = 'https://developers.cjdropshipping.com/api2.0/v1';

  try {
    // Parse the API key format: email@api@key
    const [email, , apiKey] = CJ_API_KEY.split('@');
    const fullEmail = `${email}@api`;

    const response = await fetch(`${CJ_API_URL}/authentication/getAccessToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: fullEmail,
        password: apiKey
      })
    });

    const data = await response.json();

    if (!data.result || data.code !== 200) {
      return res.status(400).json({ 
        error: 'Failed to get access token',
        details: data.message,
        code: data.code
      });
    }

    return res.status(200).json({
      success: true,
      accessToken: data.data.accessToken,
      tokenType: data.data.tokenType,
      expiresIn: data.data.expiresIn
    });

  } catch (error) {
    console.error('CJ Token Error:', error);
    return res.status(500).json({ 
      error: 'Failed to authenticate',
      details: error.message 
    });
  }
}
