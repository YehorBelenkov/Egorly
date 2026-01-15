export default function handler(req, res) {
  // This endpoint helps debug environment variable issues
  const envCheck = {
    nodeEnv: process.env.NODE_ENV,
    hasSquareAccessToken: !!process.env.SQUARE_ACCESS_TOKEN,
    hasSquareLocationId: !!process.env.SQUARE_LOCATION_ID,
    publicSquareAppId: process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || 'NOT_SET',
    publicSquareLocationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || 'NOT_SET',
    allPublicEnvKeys: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')),
    timestamp: new Date().toISOString()
  };

  console.log('Environment check:', envCheck);

  res.status(200).json(envCheck);
}