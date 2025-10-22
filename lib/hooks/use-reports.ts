'use client'

import { useQuery } from '@tanstack/react-query'

export interface ReportFilters {
  startDate?: string
  endDate?: string
  type?: string
  search?: string
  page?: number
  limit?: number
}

export interface ReportSummary {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  ordersByStatus: {
    pending: number
    completed: number
    cancelled: number
  }
  ordersByType: {
    cashier: number
    selfOrder: number
  }
}

export interface TopMenu {
  menuId: string
  name: string
  quantity: number
  revenue: number
}

export interface DailySale {
  date: string
  revenue: number
  orders: number
}

export interface OrderItem {
  id: string
  menuId: string
  quantity: number
  price: number
  subtotal: number
  menu: {
    id: string
    name: string
    price: number
  }
}

export interface Order {
  id: string
  orderNo: string
  customerName: string | null
  totalPrice: number
  status: string
  type: string
  createdAt: string
  createdBy?: {
    name: string
  }
  orderItems?: OrderItem[]
}

export interface ReportsResponse {
  summary: ReportSummary
  topMenus: TopMenu[]
  dailySales: DailySale[]
  orders: Order[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export function useReports(filters: ReportFilters = {}) {
  const { startDate, endDate, type, search, page = 1, limit = 10 } = filters

  return useQuery<ReportsResponse>({
    queryKey: ['reports', { startDate, endDate, type, search, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      if (type) params.set('type', type)
      if (search) params.set('search', search)
      params.set('page', page.toString())
      params.set('limit', limit.toString())

      const res = await fetch(`/api/reports?${params.toString()}`)
      if (!res.ok) {
        throw new Error('Failed to fetch reports')
      }
      return res.json()
    },
    placeholderData: (previousData) => previousData,
  })
}
