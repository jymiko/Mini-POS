'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface MenuMaterial {
  material: {
    id: string
    name: string
    stock: number
    unit: string
    minStock: number
  }
  quantity: number
}

export interface Menu {
  id: string
  name: string
  description?: string
  price: number
  category?: string
  isActive: boolean
  isAvailable: boolean
  menuMaterials: MenuMaterial[]
}

export interface MenusResponse {
  menus: Menu[]
}

export function useMenus() {
  return useQuery<MenusResponse>({
    queryKey: ['menus'],
    queryFn: async () => {
      const res = await fetch('/api/menus')
      if (!res.ok) {
        throw new Error('Failed to fetch menus')
      }
      return res.json()
    },
    staleTime: 30 * 1000,
  })
}

export interface CreateMenuData {
  name: string
  description?: string
  price: string
  isActive: boolean
  materials: Array<{
    materialId: string
    quantity: number
  }>
}

export function useCreateMenu() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateMenuData) => {
      const res = await fetch('/api/menus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create menu')
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] })
    },
  })
}

export interface UpdateMenuData {
  menuId: string
  name: string
  description?: string
  price: string
  isActive: boolean
  materials: Array<{
    materialId: string
    quantity: number
  }>
}

export function useUpdateMenu() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ menuId, ...data }: UpdateMenuData) => {
      const res = await fetch(`/api/menus/${menuId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update menu')
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] })
    },
  })
}

export interface DeleteMenuData {
  menuId: string
}

export function useDeleteMenu() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ menuId }: DeleteMenuData) => {
      const res = await fetch(`/api/menus/${menuId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete menu')
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] })
    },
  })
}
