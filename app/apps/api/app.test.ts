import { describe, expect, it, beforeEach } from 'bun:test'
import { createApp } from './app'

describe('App Integration Tests', () => {
  let app: Awaited<ReturnType<typeof createApp>>

  beforeEach(async () => {
    // Create a fresh app instance with isolated test database for each test
    app = await createApp(true)
  })

  describe('Health Endpoints', () => {
    it('should return hello message', async () => {
      const response = await app.handle(new Request('http://localhost/'))
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toEqual({ message: 'Hello Elysia with DI!' })
    })

    it('should return health status', async () => {
      const response = await app.handle(new Request('http://localhost/health'))
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('status', 'ok')
      expect(data).toHaveProperty('version', '1.0.0')
      expect(data).toHaveProperty('timestamp')
    })
  })

  describe('User Endpoints', () => {
    it('should get all users', async () => {
      const response = await app.handle(new Request('http://localhost/users'))
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      expect(data[0]).toHaveProperty('id')
      expect(data[0]).toHaveProperty('email')
      expect(data[0]).toHaveProperty('name')
      expect(data[0]).not.toHaveProperty('passwordHash')
    })

    it('should get user by id', async () => {
      const response = await app.handle(new Request('http://localhost/users/1'))
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('id', '1')
      expect(data).toHaveProperty('email')
      expect(data).toHaveProperty('name')
    })

    it('should return 404 for non-existent user', async () => {
      const response = await app.handle(new Request('http://localhost/users/999'))
      
      expect(response.status).toBe(404) // Proper NotFound error
    })

    it('should create user with valid session', async () => {
      // First login to get a valid session
      const loginResponse = await app.handle(new Request('http://localhost/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'john@example.com',
          password: 'password123'
        })
      }))
      const loginData = await loginResponse.json()
      
      const response = await app.handle(new Request('http://localhost/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.sessionId}`
        },
        body: JSON.stringify({
          email: 'new@example.com',
          name: 'New User',
          password: 'newpass123'
        })
      }))
      
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('email', 'new@example.com')
      expect(data).toHaveProperty('name', 'New User')
      expect(data).toHaveProperty('id')
      expect(data).not.toHaveProperty('passwordHash')
    })

    it('should reject user creation without session', async () => {
      const response = await app.handle(new Request('http://localhost/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          name: 'New User',
          password: 'testpass123'
        })
      }))
      
      expect(response.status).toBe(401)
    })

    it('should validate email format', async () => {
      // First login to get a valid session
      const loginResponse = await app.handle(new Request('http://localhost/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'john@example.com',
          password: 'password123'
        })
      }))
      const loginData = await loginResponse.json()
      
      const response = await app.handle(new Request('http://localhost/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.sessionId}`
        },
        body: JSON.stringify({
          email: 'invalid-email',
          name: 'Test User',
          password: 'testpass123'
        })
      }))
      
      expect(response.status).toBe(422) // Elysia validation error
    })

    it('should update user with valid session', async () => {
      // First login to get a valid session
      const loginResponse = await app.handle(new Request('http://localhost/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'john@example.com',
          password: 'password123'
        })
      }))
      const loginData = await loginResponse.json()
      
      const response = await app.handle(new Request('http://localhost/users/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.sessionId}`
        },
        body: JSON.stringify({
          name: 'Updated Name'
        })
      }))
      
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('name', 'Updated Name')
      expect(data).toHaveProperty('id', '1')
    })

    it('should delete user with valid session', async () => {
      // First login to get a valid session
      const loginResponse = await app.handle(new Request('http://localhost/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'john@example.com',
          password: 'password123'
        })
      }))
      const loginData = await loginResponse.json()
      
      const response = await app.handle(new Request('http://localhost/users/2', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${loginData.sessionId}`
        }
      }))
      
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('message', 'User deleted successfully')
    })
  })

  describe('Auth Endpoints', () => {
    it('should login with valid credentials', async () => {
      const response = await app.handle(new Request('http://localhost/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'john@example.com',
          password: 'password123'
        })
      }))
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('sessionId')
      expect(data).toHaveProperty('user')
      expect(data.user).toHaveProperty('email', 'john@example.com')
      expect(data.user).not.toHaveProperty('passwordHash')
    })

    it('should reject invalid credentials', async () => {
      const response = await app.handle(new Request('http://localhost/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'john@example.com',
          password: 'wrong-password'
        })
      }))
      
      expect(response.status).toBe(401) // Proper Unauthorized error
    })

    it('should validate email format in login', async () => {
      const response = await app.handle(new Request('http://localhost/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'password'
        })
      }))
      
      expect(response.status).toBe(422) // Elysia validation error
    })

    it('should validate session', async () => {
      // First login to get a valid session
      const loginResponse = await app.handle(new Request('http://localhost/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'john@example.com',
          password: 'password123'
        })
      }))
      const loginData = await loginResponse.json()
      
      const response = await app.handle(new Request('http://localhost/auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: loginData.sessionId
        })
      }))
      
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('valid', true)
      expect(data.user).toHaveProperty('email', 'john@example.com')
    })

    it('should reject invalid session', async () => {
      const response = await app.handle(new Request('http://localhost/auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: 'invalid-session-id'
        })
      }))
      
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('valid', false)
    })
  })
})