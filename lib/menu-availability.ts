import { prisma } from './prisma'

interface MenuWithMaterials {
  id: string
  menuMaterials: {
    quantity: number
    material: {
      stock: number
    }
  }[]
}

export async function checkMenuAvailability(menuId: string): Promise<boolean> {
  const menu = await prisma.menu.findUnique({
    where: { id: menuId },
    include: {
      menuMaterials: {
        include: {
          material: true,
        },
      },
    },
  })

  if (!menu) return false
  if (!menu.isActive) return false

  for (const menuMaterial of menu.menuMaterials) {
    if (menuMaterial.material.stock < menuMaterial.quantity) {
      return false
    }
  }

  return true
}

export async function getMenusWithAvailability() {
  const menus = await prisma.menu.findMany({
    include: {
      menuMaterials: {
        include: {
          material: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return menus.map((menu) => {
    const isAvailable = menu.isActive && menu.menuMaterials.every(
      (mm: { material: { stock: number }; quantity: number }) => mm.material.stock >= mm.quantity
    )

    return {
      ...menu,
      isAvailable,
    }
  })
}

export async function canServeMenu(menuId: string, quantity: number = 1): Promise<{
  canServe: boolean
  missingMaterials?: string[]
}> {
  const menu = await prisma.menu.findUnique({
    where: { id: menuId },
    include: {
      menuMaterials: {
        include: {
          material: true,
        },
      },
    },
  })

  if (!menu || !menu.isActive) {
    return { canServe: false }
  }

  const missingMaterials: string[] = []

  for (const menuMaterial of menu.menuMaterials) {
    const requiredStock = menuMaterial.quantity * quantity
    if (menuMaterial.material.stock < requiredStock) {
      missingMaterials.push(menuMaterial.material.name)
    }
  }

  return {
    canServe: missingMaterials.length === 0,
    missingMaterials: missingMaterials.length > 0 ? missingMaterials : undefined,
  }
}

export async function deductMaterialsForMenu(
  menuId: string,
  quantity: number = 1,
  tx?: Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>
): Promise<void> {
  const db = tx || prisma

  const menu = await db.menu.findUnique({
    where: { id: menuId },
    include: {
      menuMaterials: {
        include: {
          material: true,
        },
      },
    },
  })

  if (!menu) {
    throw new Error('Menu not found')
  }

  if (tx) {
    for (const menuMaterial of menu.menuMaterials) {
      await tx.material.update({
        where: { id: menuMaterial.materialId },
        data: {
          stock: {
            decrement: menuMaterial.quantity * quantity,
          },
        },
      })
    }
  } else {
    await prisma.$transaction(
      menu.menuMaterials.map((menuMaterial: { materialId: string; quantity: number }) =>
        prisma.material.update({
          where: { id: menuMaterial.materialId },
          data: {
            stock: {
              decrement: menuMaterial.quantity * quantity,
            },
          },
        })
      )
    )
  }
}
