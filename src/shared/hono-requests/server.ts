import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// Включаем CORS для фронтенда
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Тестовые данные
const users = [
  { id: 1, name: 'Иван Иванов', email: 'ivan@example.com' },
  { id: 2, name: 'Петр Петров', email: 'petr@example.com' },
  { id: 3, name: 'Мария Сидорова', email: 'maria@example.com' }
]

const posts = [
  { id: 1, title: 'Первый пост', content: 'Содержимое первого поста', userId: 1 },
  { id: 2, title: 'Второй пост', content: 'Содержимое второго поста', userId: 2 }
]

// GET запросы
app.get('/', (c) => {
  return c.json({ message: 'Добро пожаловать в Hono API!' })
})

app.get('/api/users', (c) => {
  return c.json({ users, total: users.length })
})

app.get('/api/users/:id', (c) => {
  const id = parseInt(c.req.param('id'))
  const user = users.find(u => u.id === id)
  
  if (!user) {
    return c.json({ error: 'Пользователь не найден' }, 404)
  }
  
  return c.json({ user })
})

app.get('/api/posts', (c) => {
  return c.json({ posts, total: posts.length })
})

// POST запросы
app.post('/api/users', async (c) => {
  const body = await c.req.json()
  const newUser = {
    id: users.length + 1,
    name: body.name || 'Новый пользователь',
    email: body.email || 'new@example.com'
  }
  
  users.push(newUser)
  return c.json({ user: newUser, message: 'Пользователь создан' }, 201)
})

app.post('/api/posts', async (c) => {
  const body = await c.req.json()
  const newPost = {
    id: posts.length + 1,
    title: body.title || 'Новый пост',
    content: body.content || 'Содержимое поста',
    userId: body.userId || 1
  }
  
  posts.push(newPost)
  return c.json({ post: newPost, message: 'Пост создан' }, 201)
})

// PUT запросы
app.put('/api/users/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const body = await c.req.json()
  const userIndex = users.findIndex(u => u.id === id)
  
  if (userIndex === -1) {
    return c.json({ error: 'Пользователь не найден' }, 404)
  }
  
  users[userIndex] = { ...users[userIndex], ...body }
  return c.json({ user: users[userIndex], message: 'Пользователь обновлен' })
})

// DELETE запросы
app.delete('/api/users/:id', (c) => {
  const id = parseInt(c.req.param('id'))
  const userIndex = users.findIndex(u => u.id === id)
  
  if (userIndex === -1) {
    return c.json({ error: 'Пользователь не найден' }, 404)
  }
  
  const deletedUser = users.splice(userIndex, 1)[0]
  return c.json({ user: deletedUser, message: 'Пользователь удален' })
})

// PATCH запросы
app.patch('/api/users/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const body = await c.req.json()
  const userIndex = users.findIndex(u => u.id === id)
  
  if (userIndex === -1) {
    return c.json({ error: 'Пользователь не найден' }, 404)
  }
  
  // Частичное обновление
  Object.keys(body).forEach(key => {
    if (body[key] !== undefined) {
      users[userIndex][key] = body[key]
    }
  })
  
  return c.json({ user: users[userIndex], message: 'Пользователь частично обновлен' })
})

app.onError((err, c) => {
  console.error('Ошибка сервера:', err)
  return c.json({ error: 'Внутренняя ошибка сервера' }, 500)
})

app.notFound((c) => {
  return c.json({ error: 'Маршрут не найден' }, 404)
})

export default app