// This is a proxy to route all API calls to our built server
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the built server
const serverPath = path.join(__dirname, '..', 'dist', 'index.js');

export default async function handler(req, res) {
  try {
    // Dynamically import the server
    const { default: app } = await import(serverPath);
    
    // Forward the request to the Express app
    return app(req, res);
  } catch (error) {
    console.error('Error loading server:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
