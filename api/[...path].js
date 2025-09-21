// This is a proxy to route all API calls to our Express server
export default async function handler(req, res) {
  try {
    console.log('🚀 API handler called:', req.method, req.url);
    console.log('🔍 Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'SET' : 'MISSING'
    });

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    console.log('📦 Attempting to import Express app...');
    // Import the initialized Express app from esbuild output
    const { app, initializeApp } = await import('../dist/index.js');
    console.log('✅ Express app imported successfully');
    
    console.log('🔄 Initializing app...');
    // Initialize the app if not already done
    await initializeApp();
    console.log('✅ App initialized successfully');
    
    console.log('🎯 Handling request with Express app...');
    // Handle the request with the Express app
    app(req, res);
  } catch (error) {
    console.error('💥 CRITICAL ERROR in API handler:', error);
    console.error('💥 Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      stack: error.stack
    });
  }
}
