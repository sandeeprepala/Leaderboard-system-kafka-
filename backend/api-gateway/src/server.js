const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const { verifyJWT } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 8000;

const WRITE_SERVICE_URL = process.env.WRITE_SERVICE_URL || 'http://localhost:8001';
const READ_SERVICE_URL = process.env.READ_SERVICE_URL || 'http://localhost:8002';
const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8003';

// Basic logging
app.use(morgan('dev'));
app.use(cors());
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'api-gateway' });
});

console.log(`Configuring proxies:
  - Write Service: ${WRITE_SERVICE_URL}
  - Read Service: ${READ_SERVICE_URL}
  - Analytics Service: ${ANALYTICS_SERVICE_URL}`);

// Configure downstream proxies with prefix-preserving path rewrites
const authProxy = createProxyMiddleware({
  target: WRITE_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: (path, req) => '/api/auth' + path,
  on: {
    proxyReq: (proxyReq, req, res) => {
      console.log(`[Proxy] Forwarding request to Write Service: ${req.method} ${proxyReq.path}`);
    }
  }
});

const scoresProxy = createProxyMiddleware({
  target: WRITE_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: (path, req) => '/api/scores' + path,
  on: {
    proxyReq: (proxyReq, req, res) => {
      console.log(`[Proxy] Forwarding request to Write Service: ${req.method} ${proxyReq.path}`);
    }
  }
});

const readServiceProxy = createProxyMiddleware({
  target: READ_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: (path, req) => '/api/leaderboard' + path,
  on: {
    proxyReq: (proxyReq, req, res) => {
      console.log(`[Proxy] Forwarding request to Read Service: ${req.method} ${proxyReq.path}`);
    }
  }
});

const analyticsServiceProxy = createProxyMiddleware({
  target: ANALYTICS_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: (path, req) => '/api/analytics' + path,
  on: {
    proxyReq: (proxyReq, req, res) => {
      console.log(`[Proxy] Forwarding request to Analytics Service: ${req.method} ${proxyReq.path}`);
    }
  }
});

// Route proxy configurations
// 1. Auth routes - public, go directly to Write Service
app.use('/api/auth', authProxy);

// 2. Score posting - verified downstream in Write Service
app.use('/api/scores', scoresProxy);

// 3. Leaderboard query routes - public, go to Read Service
app.use('/api/leaderboard', readServiceProxy);

// 4. Analytics query routes - public, go to Analytics Service
app.use('/api/analytics', analyticsServiceProxy);

// Centralized error handling
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`API Gateway is running on port ${PORT}`);
});

const shutdown = () => {
  console.log('Shutting down API Gateway...');
  server.close(() => {
    console.log('API Gateway shutdown complete.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
