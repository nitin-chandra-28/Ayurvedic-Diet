import http from 'http';
import dotenv from 'dotenv';
import { connectDB } from './lib/db.js';
import { route } from './router.js';
import { applyCORS } from './lib/cors.js';
dotenv.config();

const server = http.createServer(async (req, res) => {
  if (applyCORS(req, res)) return;
  return route(req, res);
});

const PORT = process.env.PORT || 8080;

// Connect to MongoDB once at startup
connectDB()
  .then(() => {
    console.log(`✅ MongoDB connected`);
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`✅ Ready to accept connections`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('⚠️  Server starting without database...');
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`⚠️  Server running on http://localhost:${PORT} (DB unavailable)`);
    });
  });

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is already in use. Please kill the process and try again.`);
  }
  process.exit(1);
});

server.on('listening', () => {
  const addr = server.address();
  console.log(`🎧 Actually listening on ${addr.address}:${addr.port}`);
});
