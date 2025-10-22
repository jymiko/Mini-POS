'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Order {
  id: string
  orderNo: string
  customerName: string | null
  totalPrice: number
  status: string
  type: string
  createdAt: string
  updatedAt: string
  createdBy?: {
    name: string
  }
  orderItems: Array<{
    id: string
    quantity: number
    price: number
    subtotal: number
    menu: {
      id: string
      name: string
    }
  }>
}

export interface OrdersResponse {
  orders: Order[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface OrderFilters {
  status?: string
  search?: string
  page?: number
  limit?: number
}

export function useOrders(filters: OrderFilters = {}) {
  const { status, search, page = 1, limit = 10 } = filters

  return useQuery<OrdersResponse>({
    queryKey: ['orders', { status, search, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (search) params.set('search', search)
      params.set('page', page.toString())
      params.set('limit', limit.toString())

      const res = await fetch(`/api/orders?${params.toString()}`)
      if (!res.ok) {
        throw new Error('Failed to fetch orders')
      }
      return res.json()
    },
    placeholderData: (previousData) => previousData,
  })
}

export interface CreateOrderData {
  items: Array<{ menuId: string; quantity: number }>
  customerName?: string
  type: 'cashier' | 'self-order'
}

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateOrderData) => {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create order')
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

export interface UpdateOrderStatusData {
  orderId: string
  status: 'pending' | 'completed' | 'cancelled'
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ orderId, status }: UpdateOrderStatusData) => {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update order status')
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

export function useOrder(orderId: string) {
  return useQuery<Order>({
    queryKey: ['orders', orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}`)
      if (!res.ok) {
        throw new Error('Failed to fetch order')
      }
      return res.json()
    },
    enabled: !!orderId,
  })
}
