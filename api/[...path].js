// This is a proxy to route all API calls to our Express server
export default async function handler(req, res) {
  try {
    console.log('API handler called:', req.method, req.url);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    // Import the initialized Express app - try both possible paths
    let app, initializeApp;
    try {
      ({ app, initializeApp } = await import('../dist/server/index.js'));
    } catch (error) {
      console.log('Failed to import from dist/server/index.js, trying dist/index.js:', error.message);
      ({ app, initializeApp } = await import('../dist/index.js'));
    }
    
    // Initialize the app if not already done
    await initializeApp();
    
    // Handle the request with the Express app
    app(req, res);
  } catch (error) {
    console.error('Error in API handler:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: error.stack 
    });
  }
}
