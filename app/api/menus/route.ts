import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getMenusWithAvailability } from '@/lib/menu-availability'

export async function GET() {
  try {
    const menus = await getMenusWithAvailability()
    return NextResponse.json({ menus })
  } catch (error) {
    console.error('Error fetching menus:', error)
    return NextResponse.json(
      { error: 'Failed to fetch menus' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, price, materials, isActive } = body

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      )
    }

    const menu = await prisma.menu.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        isActive: isActive ?? true,
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

    return NextResponse.json({ menu }, { status: 201 })
  } catch (error) {
    console.error('Error creating menu:', error)
    return NextResponse.json(
      { error: 'Failed to create menu' },
      { status: 500 }
    )
  }
}
