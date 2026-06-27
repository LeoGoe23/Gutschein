const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function setupProxy(app) {
  const target = process.env.REACT_APP_API_PROXY_TARGET || 'http://localhost:8080';

  // Only backend routes should be proxied in dev.
  app.use(
    '/api',
    createProxyMiddleware({
      target,
      changeOrigin: true,
    })
  );

  // Keep media assets working in local dev when served by backend.
  app.use(
    '/media',
    createProxyMiddleware({
      target,
      changeOrigin: true,
    })
  );
};
