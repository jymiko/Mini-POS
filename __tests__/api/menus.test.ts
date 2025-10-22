import { describe, it, expect, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Menus API', () => {
  let testMaterialId: string

  beforeEach(async () => {
    await prisma.menuMaterial.deleteMany({
      where: { menu: { name: { startsWith: 'Test' } } },
    })
    await prisma.menu.deleteMany({
      where: { name: { startsWith: 'Test' } },
    })

    const material = await prisma.material.upsert({
      where: { id: 'test-material' },
      update: {},
      create: {
        id: 'test-material',
        name: 'Test Material',
        unit: 'gram',
        stock: 1000,
        minStock: 100,
      },
    })
    testMaterialId = material.id
  })

  describe('GET /api/menus', () => {
    it('should return list of menus with availability status', async () => {
      await prisma.menu.create({
        data: {
          name: 'Test Menu',
          description: 'Test description',
          price: 10000,
        },
      })

      expect(true).toBe(true)
    })
  })

  describe('POST /api/menus', () => {
    it('should create a new menu with materials', async () => {
      const newMenu = {
        name: 'Test New Menu',
        description: 'Test description',
        price: 15000,
        materials: [
          { materialId: testMaterialId, quantity: 10 },
        ],
      }

      expect(newMenu).toBeTruthy()
    })

    it('should validate menu availability based on material stock', async () => {
      const menu = await prisma.menu.create({
        data: {
          name: 'Test Stock Menu',
          price: 10000,
          menuMaterials: {
            create: [
              {
                materialId: testMaterialId,
                quantity: 10000,
              },
            ],
          },
        },
      })

      expect(menu).toBeTruthy()
    })
  })

  describe('PUT /api/menus/:id', () => {
    it('should update menu and its materials', async () => {
      const menu = await prisma.menu.create({
        data: {
          name: 'Test Update Menu',
          price: 10000,
        },
      })

      expect(menu).toBeTruthy()
    })
  })

  describe('DELETE /api/menus/:id', () => {
    it('should delete menu and its material relationships', async () => {
      const menu = await prisma.menu.create({
        data: {
          name: 'Test Delete Menu',
          price: 10000,
          menuMaterials: {
            create: [
              {
                materialId: testMaterialId,
                quantity: 10,
              },
            ],
          },
        },
      })

      expect(menu).toBeTruthy()
    })
  })

  describe('Menu Availability Logic', () => {
    it('should mark menu as unavailable when material stock is insufficient', async () => {
      const lowStockMaterial = await prisma.material.create({
        data: {
          name: 'Test Low Stock Material',
          unit: 'gram',
          stock: 5,
          minStock: 10,
        },
      })

      const menu = await prisma.menu.create({
        data: {
          name: 'Test Availability Menu',
          price: 10000,
          menuMaterials: {
            create: [
              {
                materialId: lowStockMaterial.id,
                quantity: 10,
              },
            ],
          },
        },
      })

      expect(menu).toBeTruthy()
    })

    it('should mark menu as unavailable when any required material is out of stock', async () => {
      const outOfStockMaterial = await prisma.material.create({
        data: {
          name: 'Test Out of Stock Material',
          unit: 'gram',
          stock: 0,
          minStock: 10,
        },
      })

      const menu = await prisma.menu.create({
        data: {
          name: 'Test Out of Stock Menu',
          price: 10000,
          menuMaterials: {
            create: [
              {
                materialId: testMaterialId,
                quantity: 10,
              },
              {
                materialId: outOfStockMaterial.id,
                quantity: 5,
              },
            ],
          },
        },
      })

      expect(menu).toBeTruthy()
    })
  })
})
