'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, ShoppingBag, ShoppingCart, AlertCircle, FileText } from 'lucide-react'

interface MenuWithAvailability {
  id: string
  name: string
  isActive: boolean
  isAvailable: boolean
}

interface User {
  id: string
  username: string
  name: string
  role: string
}

export default function DashboardPage() {
  const [totalMaterials, setTotalMaterials] = useState<number | null>(null)
  const [totalMenus, setTotalMenus] = useState<number | null>(null)
  const [unavailableMenus, setUnavailableMenus] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const sessionRes = await fetch('/api/auth/session')
        const sessionData = await sessionRes.json()
        setUser(sessionData.user)

        const materialsRes = await fetch('/api/materials')
        const materialsData = await materialsRes.json()
        setTotalMaterials(materialsData.materials.length)

        const menusRes = await fetch('/api/menus')
        const menusData = await menusRes.json()
        const menus: MenuWithAvailability[] = menusData.menus

        const availableCount = menus.filter(m => m.isAvailable).length
        setTotalMenus(availableCount)

        const unavailableCount = menus.filter(m => m.isActive && !m.isAvailable).length
        setUnavailableMenus(unavailableCount)
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const getNavigationItems = () => {
    const items = []

    if (user?.role === 'superadmin' || user?.role === 'produksi') {
      items.push({
        href: '/dashboard/materials',
        icon: Package,
        title: 'Master Material',
        description: 'Kelola bahan baku'
      })
    }

    if (user?.role === 'superadmin') {
      items.push({
        href: '/dashboard/menus',
        icon: ShoppingBag,
        title: 'Master Menu',
        description: 'Kelola menu penjualan'
      })
    }

    if (user?.role === 'superadmin' || user?.role === 'kasir') {
      items.push({
        href: '/dashboard/cashier',
        icon: ShoppingCart,
        title: 'Kasir',
        description: 'Proses penjualan'
      })
    }

    if (user?.role === 'superadmin') {
      items.push({
        href: '/dashboard/reports',
        icon: FileText,
        title: 'Laporan',
        description: 'Analisis penjualan'
      })
    }

    return items
  }

  const navigationItems = getNavigationItems()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Selamat datang di POS System
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Material</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '-' : totalMaterials}
            </div>
            <p className="text-xs text-muted-foreground">Bahan baku tersedia</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Menu</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '-' : totalMenus}
            </div>
            <p className="text-xs text-muted-foreground">Menu yang tersedia</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menu Tidak Tersedia</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '-' : unavailableMenus}
            </div>
            <p className="text-xs text-muted-foreground">Stock material habis</p>
          </CardContent>
        </Card>
      </div>

      {navigationItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Navigasi Cepat</CardTitle>
            <CardDescription>Akses fitur utama sistem</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Icon className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.description}
                    </p>
                  </div>
                </a>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
