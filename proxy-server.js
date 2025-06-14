const { createProxyMiddleware } = require('http-proxy-middleware')
const express = require('express')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = express()

  // Add CORS headers for all responses
  server.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    res.header(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, Content-Length, X-Requested-With'
    )

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.sendStatus(200)
    } else {
      next()
    }
  })

  // Proxy /api/proxy/claude/* to https://rukh.w3hc.org/*
  server.use(
    '/api/proxy/claude',
    createProxyMiddleware({
      target: 'https://rukh.w3hc.org',
      changeOrigin: true,
      pathRewrite: {
        '^/api/proxy/claude': '', // Remove /api/proxy/claude from the path
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('🔄 Proxying request to:', proxyReq.path)
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('✅ Proxy response received:', proxyRes.statusCode)
      },
      onError: (err, req, res) => {
        console.error('❌ Proxy error:', err)
      },
    })
  )

  // Handle all other requests with Next.js - use a specific path instead of '*'
  server.get('*', (req, res) => {
    return handle(req, res)
  })

  server.post('*', (req, res) => {
    return handle(req, res)
  })

  server.listen(3000, err => {
    if (err) throw err
    console.log('🚀 Server ready on http://localhost:3000')
    console.log('🔄 Proxy enabled: /api/proxy/claude/* → https://rukh.w3hc.org/*')
  })
})
