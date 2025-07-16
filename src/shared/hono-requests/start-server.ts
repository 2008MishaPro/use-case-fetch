import { serve } from '@hono/node-server'
import app from './server'

const port = 3001

console.log(`🚀 Hono API сервер запускается на http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})

console.log(`✅ API сервер запущен на http://localhost:${port}`)
console.log('📋 Доступные endpoints:')
console.log('  GET    http://localhost:3001/')
console.log('  GET    http://localhost:3001/api/users')
console.log('  GET    http://localhost:3001/api/users/:id')
console.log('  GET    http://localhost:3001/api/users/:id/posts')
console.log('  GET    http://localhost:3001/api/posts')
console.log('  GET    http://localhost:3001/api/posts/:id')
console.log('  GET    http://localhost:3001/api/categories')
console.log('  GET    http://localhost:3001/api/categories/:id')
console.log('  GET    http://localhost:3001/api/categories/:id/posts')
console.log('  GET    http://localhost:3001/api/posts/:id/comments')
console.log('  GET    http://localhost:3001/api/comments')
console.log('  GET    http://localhost:3001/api/stats')
console.log('  POST   http://localhost:3001/api/users')
console.log('  POST   http://localhost:3001/api/posts')
console.log('  POST   http://localhost:3001/api/categories')
console.log('  POST   http://localhost:3001/api/posts/:id/comments')
console.log('  PUT    http://localhost:3001/api/users/:id')
console.log('  PUT    http://localhost:3001/api/posts/:id')
console.log('  PUT    http://localhost:3001/api/categories/:id')
console.log('  PATCH  http://localhost:3001/api/users/:id')
console.log('  PATCH  http://localhost:3001/api/posts/:id')
console.log('  PATCH  http://localhost:3001/api/categories/:id')
console.log('  PATCH  http://localhost:3001/api/comments/:id')
console.log('  DELETE http://localhost:3001/api/users/:id')
console.log('  DELETE http://localhost:3001/api/posts/:id')
console.log('  DELETE http://localhost:3001/api/categories/:id')
console.log('  DELETE http://localhost:3001/api/comments/:id')