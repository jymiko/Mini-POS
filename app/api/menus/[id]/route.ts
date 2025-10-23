import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkMenuAvailability } from '@/lib/menu-availability'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const menu = await prisma.menu.findUnique({
      where: { id },
      include: {
        menuMaterials: {
          include: {
            material: true,
          },
        },
      },
    })

    if (!menu) {
      return NextResponse.json(
        { error: 'Menu not found' },
        { status: 404 }
      )
    }

    const isAvailable = await checkMenuAvailability(id)

    return NextResponse.json({
      menu: {
        ...menu,
        isAvailable,
      },
    })
  } catch (error) {
    console.error('Error fetching menu:', error)
    return NextResponse.json(
      { error: 'Failed to fetch menu' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, price, materials, isActive } = body

    // Validasi: menu harus memiliki minimal 1 bahan
    if (!materials || !Array.isArray(materials) || materials.length === 0) {
      return NextResponse.json(
        { error: 'Menu harus memiliki minimal 1 bahan' },
        { status: 400 }
      )
    }

    await prisma.menuMaterial.deleteMany({
      where: { menuId: id },
    })

    const menu = await prisma.menu.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(isActive !== undefined && { isActive }),
        menuMaterials: {
          create: materials?.map((m: { materialId: string; quantity: number }) => ({
            materialId: m.materialId,
            quantity: parseFloat(m.quantity.toString()),
          })) || [],
        },
      },
      include: {
        menuMaterials: {
          include: {
            material: true,
          },
        },
      },
    })

    return NextResponse.json({ menu })
  } catch (error) {
    console.error('Error updating menu:', error)
    return NextResponse.json(
      { error: 'Failed to update menu' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    const orderItemCount = await prisma.orderItem.count({
      where: { menuId: id },
    })

    if (orderItemCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete menu that has order history' },
        { status: 400 }
      )
    }

    await prisma.menu.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting menu:', error)
    return NextResponse.json(
      { error: 'Failed to delete menu' },
      { status: 500 }
    )
  }
}
