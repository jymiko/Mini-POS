import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { canServeMenu, deductMaterialsForMenu } from '@/lib/menu-availability'
import { getSession } from '@/lib/auth/session'

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    type WhereClause = {
      status?: string
      OR?: Array<{ id: { contains: string } } | { orderNo: { contains: string } }>
      AND?: Array<{
        status?: string
        OR?: Array<{ id: { contains: string } } | { orderNo: { contains: string } }>
      }>
    }

    let whereClause: WhereClause = {}

    if (search && status) {
      whereClause = {
        AND: [
          { status },
          {
            OR: [
              { id: { contains: search } },
              { orderNo: { contains: search } },
            ],
          },
        ],
      }
    } else if (search) {
      whereClause = {
        OR: [
          { id: { contains: search } },
          { orderNo: { contains: search } },
        ],
      }
    } else if (status) {
      whereClause = { status }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          orderItems: {
            include: {
              menu: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: whereClause }),
    ])

    return NextResponse.json({
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, customerName, type } = body

    const session = await getSession()
    if (type !== 'self-order' && !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (type === 'self-order' && !customerName?.trim()) {
      return NextResponse.json(
        { error: 'Customer name is required for self-order' },
        { status: 400 }
      )
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items are required' },
        { status: 400 }
      )
    }
    for (const item of items) {
      const { canServe, missingMaterials } = await canServeMenu(
        item.menuId,
        item.quantity
      )

      if (!canServe) {
        return NextResponse.json(
          {
            error: `Menu tidak dapat dipesan. Bahan yang kurang: ${missingMaterials?.join(', ')}`,
          },
          { status: 400 }
        )
      }
    }

    let totalPrice = 0
    const orderItemsData: Array<{
      menuId: string
      quantity: number
      price: number
      subtotal: number
    }> = []

    for (const item of items) {
      const menu = await prisma.menu.findUnique({
        where: { id: item.menuId },
      })

      if (!menu) {
        return NextResponse.json(
          { error: `Menu with id ${item.menuId} not found` },
          { status: 404 }
        )
      }

      const subtotal = menu.price * item.quantity
      totalPrice += subtotal

      orderItemsData.push({
        menuId: item.menuId,
        quantity: item.quantity,
        price: menu.price,
        subtotal,
      })
    }
    const orderCount = await prisma.order.count()
    const orderNo = `ORD-${Date.now()}-${orderCount + 1}`

    const order = await prisma.$transaction(async (tx: TransactionClient) => {
      const newOrder = await tx.order.create({
        data: {
          orderNo,
          customerName: customerName || null,
          totalPrice,
          type: type || 'cashier',
          status: 'pending',
          createdById: session?.id || null,
          orderItems: {
            create: orderItemsData,
          },
        },
        include: {
          orderItems: {
            include: {
              menu: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      })
      for (const item of items) {
        await deductMaterialsForMenu(item.menuId, item.quantity, tx)
      }

      return newOrder
    })

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
