import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['superadmin', 'produksi', 'kasir'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    type WhereClause = {
      createdAt?: {
        gte: Date
        lte: Date
      }
      type?: string
    }

    const where: WhereClause = {}

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59.999Z'),
      }
    }

    if (type) {
      where.type = type
    }
    const allOrders = await prisma.order.findMany({
      where,
      include: {
        orderItems: {
          include: {
            menu: true,
          },
        },
      },
    })

    type OrdersWhereClause = WhereClause & {
      AND?: Array<WhereClause & {
        OR?: Array<{ id: { contains: string } } | { orderNo: { contains: string } }>
      }>
      OR?: Array<{ id: { contains: string } } | { orderNo: { contains: string } }>
    }

    let ordersWhere: OrdersWhereClause
    if (search && Object.keys(where).length > 0) {
      ordersWhere = {
        AND: [
          where,
          {
            OR: [
              { id: { contains: search } },
              { orderNo: { contains: search } },
            ],
          },
        ],
      }
    } else if (search) {
      ordersWhere = {
        OR: [
          { id: { contains: search } },
          { orderNo: { contains: search } },
        ],
      }
    } else {
      ordersWhere = { ...where }
    }
    const [orders, ordersTotal] = await Promise.all([
      prisma.order.findMany({
        where: ordersWhere,
        include: {
          orderItems: {
            include: {
              menu: true,
            },
          },
          createdBy: {
            select: {
              name: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: ordersWhere }),
    ])
    const totalOrders = allOrders.length
    const totalRevenue = allOrders.reduce((sum, order) => sum + order.totalPrice, 0)
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    const ordersByStatus = {
      pending: allOrders.filter((o) => o.status === 'pending').length,
      completed: allOrders.filter((o) => o.status === 'completed').length,
      cancelled: allOrders.filter((o) => o.status === 'cancelled').length,
    }
    const ordersByType = {
      cashier: allOrders.filter((o) => o.type === 'cashier').length,
      selfOrder: allOrders.filter((o) => o.type === 'self-order').length,
    }
    const menuSales: Record<string, { name: string; quantity: number; revenue: number }> = {}

    allOrders.forEach((order) => {
      order.orderItems.forEach((item) => {
        if (!menuSales[item.menuId]) {
          menuSales[item.menuId] = {
            name: item.menu.name,
            quantity: 0,
            revenue: 0,
          }
        }
        menuSales[item.menuId].quantity += item.quantity
        menuSales[item.menuId].revenue += item.subtotal
      })
    })

    const topMenus = Object.entries(menuSales)
      .map(([id, data]) => ({ menuId: id, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
    const dailySales: Record<string, { date: string; revenue: number; orders: number }> = {}

    allOrders.forEach((order) => {
      const date = new Date(order.createdAt).toISOString().split('T')[0]
      if (!dailySales[date]) {
        dailySales[date] = { date, revenue: 0, orders: 0 }
      }
      dailySales[date].revenue += order.totalPrice
      dailySales[date].orders += 1
    })

    const dailySalesArray = Object.values(dailySales).sort((a, b) =>
      a.date.localeCompare(b.date)
    )

    return NextResponse.json({
      summary: {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        ordersByStatus,
        ordersByType,
      },
      topMenus,
      dailySales: dailySalesArray,
      orders,
      pagination: {
        total: ordersTotal,
        page,
        limit,
        totalPages: Math.ceil(ordersTotal / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}
