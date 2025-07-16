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
  { id: 1, title: 'Первый пост', content: 'Содержимое первого поста', userId: 1, categoryId: 1, createdAt: '2024-01-01T10:00:00Z' },
  { id: 2, title: 'Второй пост', content: 'Содержимое второго поста', userId: 2, categoryId: 2, createdAt: '2024-01-02T11:00:00Z' }
]

const categories = [
  { id: 1, name: 'Технологии', description: 'Посты о технологиях' },
  { id: 2, name: 'Образование', description: 'Образовательные материалы' },
  { id: 3, name: 'Развлечения', description: 'Развлекательный контент' }
]

const comments = [
  { id: 1, postId: 1, userId: 2, content: 'Отличный пост!', createdAt: '2024-01-01T12:00:00Z' },
  { id: 2, postId: 1, userId: 3, content: 'Согласен с автором', createdAt: '2024-01-01T13:00:00Z' },
  { id: 3, postId: 2, userId: 1, content: 'Интересная тема', createdAt: '2024-01-02T14:00:00Z' }
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

app.get('/api/posts/:id', (c) => {
  const id = parseInt(c.req.param('id'))
  const post = posts.find(p => p.id === id)
  
  if (!post) {
    return c.json({ error: 'Пост не найден' }, 404)
  }
  
  return c.json({ post })
})

app.get('/api/categories', (c) => {
  return c.json({ categories, total: categories.length })
})

app.get('/api/categories/:id', (c) => {
  const id = parseInt(c.req.param('id'))
  const category = categories.find(cat => cat.id === id)
  
  if (!category) {
    return c.json({ error: 'Категория не найдена' }, 404)
  }
  
  return c.json({ category })
})

app.get('/api/posts/:id/comments', (c) => {
  const postId = parseInt(c.req.param('id'))
  const postComments = comments.filter(comment => comment.postId === postId)
  
  return c.json({ comments: postComments, total: postComments.length })
})

app.get('/api/comments', (c) => {
  return c.json({ comments, total: comments.length })
})

app.get('/api/categories/:id/posts', (c) => {
  const categoryId = parseInt(c.req.param('id'))
  const categoryPosts = posts.filter(post => post.categoryId === categoryId)
  
  return c.json({ posts: categoryPosts, total: categoryPosts.length })
})

app.get('/api/stats', (c) => {
  const stats = {
    totalUsers: users.length,
    totalPosts: posts.length,
    totalCategories: categories.length,
    totalComments: comments.length,
    postsPerCategory: categories.map(cat => ({
      categoryId: cat.id,
      categoryName: cat.name,
      postsCount: posts.filter(post => post.categoryId === cat.id).length
    })),
    commentsPerPost: posts.map(post => ({
      postId: post.id,
      postTitle: post.title,
      commentsCount: comments.filter(comment => comment.postId === post.id).length
    }))
  }
  
  return c.json({ stats })
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
    userId: body.userId || 1,
    categoryId: body.categoryId || 1,
    createdAt: new Date().toISOString()
  }
  
  posts.push(newPost)
  return c.json({ post: newPost, message: 'Пост создан' }, 201)
})

app.post('/api/categories', async (c) => {
  const body = await c.req.json()
  const newCategory = {
    id: categories.length + 1,
    name: body.name || 'Новая категория',
    description: body.description || 'Описание категории'
  }
  
  categories.push(newCategory)
  return c.json({ category: newCategory, message: 'Категория создана' }, 201)
})

app.post('/api/posts/:id/comments', async (c) => {
  const postId = parseInt(c.req.param('id'))
  const body = await c.req.json()
  
  // Проверяем существование поста
  const post = posts.find(p => p.id === postId)
  if (!post) {
    return c.json({ error: 'Пост не найден' }, 404)
  }
  
  const newComment = {
    id: comments.length + 1,
    postId: postId,
    userId: body.userId || 1,
    content: body.content || 'Комментарий',
    createdAt: new Date().toISOString()
  }
  
  comments.push(newComment)
  return c.json({ comment: newComment, message: 'Комментарий добавлен' }, 201)
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
  return c.json({ user: users[userIndex], message: 'Пользователь частично обновлен' })
})

app.patch('/api/posts/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const body = await c.req.json()
  const postIndex = posts.findIndex(p => p.id === id)
  
  if (postIndex === -1) {
    return c.json({ error: 'Пост не найден' }, 404)
  }
  
  posts[postIndex] = { ...posts[postIndex], ...body }
  return c.json({ post: posts[postIndex], message: 'Пост частично обновлен' })
})

app.patch('/api/categories/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const body = await c.req.json()
  const categoryIndex = categories.findIndex(cat => cat.id === id)
  
  if (categoryIndex === -1) {
    return c.json({ error: 'Категория не найдена' }, 404)
  }
  
  categories[categoryIndex] = { ...categories[categoryIndex], ...body }
  return c.json({ category: categories[categoryIndex], message: 'Категория частично обновлена' })
})

app.patch('/api/comments/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const body = await c.req.json()
  const commentIndex = comments.findIndex(comment => comment.id === id)
  
  if (commentIndex === -1) {
    return c.json({ error: 'Комментарий не найден' }, 404)
  }
  
  comments[commentIndex] = { ...comments[commentIndex], ...body }
  return c.json({ comment: comments[commentIndex], message: 'Комментарий частично обновлен' })
})

app.put('/api/posts/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const body = await c.req.json()
  const postIndex = posts.findIndex(p => p.id === id)
  
  if (postIndex === -1) {
    return c.json({ error: 'Пост не найден' }, 404)
  }
  
  posts[postIndex] = { ...posts[postIndex], ...body }
  return c.json({ post: posts[postIndex], message: 'Пост обновлен' })
})

app.put('/api/categories/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const body = await c.req.json()
  const categoryIndex = categories.findIndex(cat => cat.id === id)
  
  if (categoryIndex === -1) {
    return c.json({ error: 'Категория не найдена' }, 404)
  }
  
  categories[categoryIndex] = { ...categories[categoryIndex], ...body }
  return c.json({ category: categories[categoryIndex], message: 'Категория обновлена' })
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

app.delete('/api/posts/:id', (c) => {
  const id = parseInt(c.req.param('id'))
  const postIndex = posts.findIndex(p => p.id === id)
  
  if (postIndex === -1) {
    return c.json({ error: 'Пост не найден' }, 404)
  }
  
  // Удаляем также все комментарии к этому посту
  const commentIndices = comments.map((comment, index) => comment.postId === id ? index : -1).filter(index => index !== -1)
  commentIndices.reverse().forEach(index => comments.splice(index, 1))
  
  posts.splice(postIndex, 1)
  return c.json({ message: 'Пост и связанные комментарии удалены' })
})

app.delete('/api/categories/:id', (c) => {
  const id = parseInt(c.req.param('id'))
  const categoryIndex = categories.findIndex(cat => cat.id === id)
  
  if (categoryIndex === -1) {
    return c.json({ error: 'Категория не найдена' }, 404)
  }
  
  // Проверяем, есть ли посты в этой категории
  const postsInCategory = posts.filter(post => post.categoryId === id)
  if (postsInCategory.length > 0) {
    return c.json({ error: 'Нельзя удалить категорию, в которой есть посты' }, 400)
  }
  
  categories.splice(categoryIndex, 1)
  return c.json({ message: 'Категория удалена' })
})

app.delete('/api/comments/:id', (c) => {
  const id = parseInt(c.req.param('id'))
  const commentIndex = comments.findIndex(comment => comment.id === id)
  
  if (commentIndex === -1) {
    return c.json({ error: 'Комментарий не найден' }, 404)
  }
  
  comments.splice(commentIndex, 1)
  return c.json({ message: 'Комментарий удален' })
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