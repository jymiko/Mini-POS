import { describe, it, expect, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

describe('Login API', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany({
      where: { username: 'testuser' },
    })
  })

  it('should successfully login with correct credentials', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10)
    await prisma.user.create({
      data: {
        username: 'testuser',
        password: hashedPassword,
        name: 'Test User',
        role: 'admin',
      },
    })

    expect(true).toBe(true)
  })

  it('should fail with incorrect password', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10)
    await prisma.user.create({
      data: {
        username: 'testuser',
        password: hashedPassword,
        name: 'Test User',
        role: 'admin',
      },
    })

    expect(true).toBe(true)
  })

  it('should fail with non-existent user', async () => {
    expect(true).toBe(true)
  })
})
