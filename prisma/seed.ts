import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const hashedPassword = await bcrypt.hash('admin123', 10)

  const superadmin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {
      role: 'superadmin',
      isActive: true,
    },
    create: {
      username: 'superadmin',
      password: hashedPassword,
      name: 'Super Administrator',
      role: 'superadmin',
      isActive: true,
    },
  })

  const produksi = await prisma.user.upsert({
    where: { username: 'produksi' },
    update: {},
    create: {
      username: 'produksi',
      password: hashedPassword,
      name: 'Staff Produksi',
      role: 'produksi',
      isActive: true,
    },
  })

  const kasir = await prisma.user.upsert({
    where: { username: 'kasir' },
    update: {},
    create: {
      username: 'kasir',
      password: hashedPassword,
      name: 'Kasir 1',
      role: 'kasir',
      isActive: true,
    },
  })

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      role: 'superadmin',
      isActive: true,
    },
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'Administrator',
      role: 'superadmin',
      isActive: true,
    },
  })

  console.log('Created users:', {
    superadmin: superadmin.username,
    produksi: produksi.username,
    kasir: kasir.username,
    admin: admin.username,
  })

  const materials = await Promise.all([
    prisma.material.upsert({
      where: { id: 'material-teh' },
      update: {},
      create: {
        id: 'material-teh',
        name: 'Teh',
        unit: 'gram',
        stock: 1000,
        minStock: 100,
      },
    }),
    prisma.material.upsert({
      where: { id: 'material-gula' },
      update: {},
      create: {
        id: 'material-gula',
        name: 'Gula',
        unit: 'gram',
        stock: 2000,
        minStock: 200,
      },
    }),
    prisma.material.upsert({
      where: { id: 'material-air' },
      update: {},
      create: {
        id: 'material-air',
        name: 'Air',
        unit: 'ml',
        stock: 10000,
        minStock: 1000,
      },
    }),
    prisma.material.upsert({
      where: { id: 'material-kopi' },
      update: {},
      create: {
        id: 'material-kopi',
        name: 'Kopi',
        unit: 'gram',
        stock: 500,
        minStock: 50,
      },
    }),
    prisma.material.upsert({
      where: { id: 'material-susu' },
      update: {},
      create: {
        id: 'material-susu',
        name: 'Susu',
        unit: 'ml',
        stock: 3000,
        minStock: 300,
      },
    }),
  ])

  console.log('Created materials:', materials.length)

  const esTeh = await prisma.menu.upsert({
    where: { id: 'menu-es-teh' },
    update: {},
    create: {
      id: 'menu-es-teh',
      name: 'Es Teh Manis',
      description: 'Teh manis dingin segar',
      price: 5000,
      isActive: true,
    },
  })

  const esKopi = await prisma.menu.upsert({
    where: { id: 'menu-es-kopi' },
    update: {},
    create: {
      id: 'menu-es-kopi',
      name: 'Es Kopi Susu',
      description: 'Kopi susu dingin nikmat',
      price: 8000,
      isActive: true,
    },
  })

  console.log('Created menus:', 2)

  await prisma.menuMaterial.upsert({
    where: { menuId_materialId: { menuId: 'menu-es-teh', materialId: 'material-teh' } },
    update: {},
    create: {
      menuId: 'menu-es-teh',
      materialId: 'material-teh',
      quantity: 10,
    },
  })

  await prisma.menuMaterial.upsert({
    where: { menuId_materialId: { menuId: 'menu-es-teh', materialId: 'material-gula' } },
    update: {},
    create: {
      menuId: 'menu-es-teh',
      materialId: 'material-gula',
      quantity: 20,
    },
  })

  await prisma.menuMaterial.upsert({
    where: { menuId_materialId: { menuId: 'menu-es-teh', materialId: 'material-air' } },
    update: {},
    create: {
      menuId: 'menu-es-teh',
      materialId: 'material-air',
      quantity: 250,
    },
  })

  await prisma.menuMaterial.upsert({
    where: { menuId_materialId: { menuId: 'menu-es-kopi', materialId: 'material-kopi' } },
    update: {},
    create: {
      menuId: 'menu-es-kopi',
      materialId: 'material-kopi',
      quantity: 15,
    },
  })

  await prisma.menuMaterial.upsert({
    where: { menuId_materialId: { menuId: 'menu-es-kopi', materialId: 'material-susu' } },
    update: {},
    create: {
      menuId: 'menu-es-kopi',
      materialId: 'material-susu',
      quantity: 100,
    },
  })

  await prisma.menuMaterial.upsert({
    where: { menuId_materialId: { menuId: 'menu-es-kopi', materialId: 'material-gula' } },
    update: {},
    create: {
      menuId: 'menu-es-kopi',
      materialId: 'material-gula',
      quantity: 15,
    },
  })

  console.log('Created menu-material relationships')
  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
