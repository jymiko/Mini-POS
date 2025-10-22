'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Material {
  id: string
  name: string
  unit: string
  stock: number
  minStock: number
}

export interface MaterialsResponse {
  materials: Material[]
}

export function useMaterials() {
  return useQuery<MaterialsResponse>({
    queryKey: ['materials'],
    queryFn: async () => {
      const res = await fetch('/api/materials')
      if (!res.ok) {
        throw new Error('Failed to fetch materials')
      }
      return res.json()
    },
    staleTime: 30 * 1000,
  })
}

export interface CreateMaterialData {
  name: string
  unit: string
  stock: string
  minStock: string
}

export function useCreateMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateMaterialData) => {
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create material')
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      queryClient.invalidateQueries({ queryKey: ['menus'] })
    },
  })
}

export interface UpdateMaterialData {
  materialId: string
  name: string
  unit: string
  stock: string
  minStock: string
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ materialId, ...data }: UpdateMaterialData) => {
      const res = await fetch(`/api/materials/${materialId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update material')
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      queryClient.invalidateQueries({ queryKey: ['menus'] })
    },
  })
}

export interface DeleteMaterialData {
  materialId: string
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ materialId }: DeleteMaterialData) => {
      const res = await fetch(`/api/materials/${materialId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete material')
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      queryClient.invalidateQueries({ queryKey: ['menus'] })
    },
  })
}
