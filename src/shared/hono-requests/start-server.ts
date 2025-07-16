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
console.log('  GET    http://localhost:3001/api/posts')
console.log('  POST   http://localhost:3001/api/users')
console.log('  POST   http://localhost:3001/api/posts')
console.log('  PUT    http://localhost:3001/api/users/:id')
console.log('  DELETE http://localhost:3001/api/users/:id')
console.log('  PATCH  http://localhost:3001/api/users/:id')