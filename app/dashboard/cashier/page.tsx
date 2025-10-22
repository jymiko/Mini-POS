'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle2, XCircle, ChevronLeft, ChevronRight, X, Search, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { useMenus } from '@/lib/hooks/use-menus'
import { useOrders, useCreateOrder, useUpdateOrderStatus, type Order } from '@/lib/hooks/use-orders'
import { useDebounce } from '@/lib/hooks/use-debounce'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CartItem {
  menuId: string
  name: string
  price: number
  quantity: number
  isAvailable: boolean
}

export default function CashierPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const debouncedSearch = useDebounce(searchQuery, 300)

  const { data: menusData, isLoading: isLoadingMenus } = useMenus()
  const menus = useMemo(() => menusData?.menus || [], [menusData])

  const { data: ordersData, isLoading: isLoadingOrders } = useOrders({
    status: 'pending',
    search: debouncedSearch,
    page: currentPage,
    limit: 10,
  })
  const orders = useMemo(() => ordersData?.orders || [], [ordersData])
  const pagination = useMemo(() => ordersData?.pagination || {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  }, [ordersData])

  const createOrder = useCreateOrder()
  const updateOrderStatus = useUpdateOrderStatus()

  const handleClearSearch = () => {
    setSearchQuery('')
    setCurrentPage(1)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage)
    }
  }

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order)
    setIsDetailOpen(true)
  }

  const addToCart = (menu: typeof menus[0]) => {
    if (!menu.isAvailable) {
      toast.error('Menu tidak tersedia karena bahan habis')
      return
    }

    const existingItem = cart.find((item) => item.menuId === menu.id)

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.menuId === menu.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      )
    } else {
      setCart([
        ...cart,
        {
          menuId: menu.id,
          name: menu.name,
          price: menu.price,
          quantity: 1,
          isAvailable: menu.isAvailable,
        },
      ])
    }
  }

  const updateQuantity = (menuId: string, change: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.menuId === menuId) {
            const newQuantity = item.quantity + change
            return { ...item, quantity: newQuantity }
          }
          return item
        })
        .filter((item) => item.quantity > 0)
    )
  }

  const removeFromCart = (menuId: string) => {
    setCart(cart.filter((item) => item.menuId !== menuId))
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const processOrder = async () => {
    if (cart.length === 0) {
      toast.error('Keranjang masih kosong')
      return
    }

    createOrder.mutate(
      {
        items: cart.map((item) => ({
          menuId: item.menuId,
          quantity: item.quantity,
        })),
        type: 'cashier',
      },
      {
        onSuccess: (data) => {
          toast.success(`Pesanan berhasil! No: ${data.order.orderNo}`)
          setCart([])
        },
        onError: (error) => {
          toast.error(error.message || 'Gagal memproses pesanan')
        },
      }
    )
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: 'completed' | 'cancelled') => {
    updateOrderStatus.mutate(
      { orderId, status: newStatus },
      {
        onSuccess: () => {
          toast.success('Status pesanan berhasil diubah')
        },
        onError: (error) => {
          if (error.message.includes('akses')) {
            toast.error('Anda tidak memiliki akses untuk mengubah status pesanan')
          } else {
            toast.error('Gagal mengubah status pesanan')
          }
        },
      }
    )
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Kasir</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Proses penjualan menu dan kelola status pesanan
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Menu List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Menu</CardTitle>
              <CardDescription>
                Pilih menu untuk ditambahkan ke keranjang
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMenus ? (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                  <p className="mt-2 text-sm text-gray-600">Memuat menu...</p>
                </div>
              ) : menus.length === 0 ? (
                <p className="text-center py-8 text-gray-500">
                  Belum ada menu tersedia
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {menus
                    .filter((menu) => menu.isActive)
                    .map((menu) => (
                      <Card
                        key={menu.id}
                        className={`cursor-pointer transition-all ${
                          menu.isAvailable
                            ? 'hover:shadow-md'
                            : 'opacity-60 cursor-not-allowed'
                        }`}
                        onClick={() => menu.isAvailable && addToCart(menu)}
                      >
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <CardTitle className="text-lg">
                                {menu.name}
                              </CardTitle>
                              {menu.description && (
                                <CardDescription className="text-sm mt-1">
                                  {menu.description}
                                </CardDescription>
                              )}
                            </div>
                            {menu.isAvailable ? (
                              <Badge
                                variant="default"
                                className="bg-green-600 ml-2"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Tersedia
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="ml-2">
                                <XCircle className="h-3 w-3 mr-1" />
                                Habis
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center">
                            <span className="text-2xl font-bold text-primary">
                              {formatPrice(menu.price)}
                            </span>
                            <Button
                              size="sm"
                              disabled={!menu.isAvailable}
                              onClick={(e) => {
                                e.stopPropagation()
                                addToCart(menu)
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Tambah
                            </Button>
                          </div>
                          {menu.menuMaterials.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Bahan:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {menu.menuMaterials.map((mm, idx) => {
                                  const isLowStock =
                                    mm.material.stock < mm.quantity
                                  return (
                                    <Badge
                                      key={idx}
                                      variant={
                                        isLowStock ? 'destructive' : 'outline'
                                      }
                                      className="text-xs"
                                    >
                                      {mm.material.name} ({mm.quantity}{' '}
                                      {mm.material.unit})
                                    </Badge>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cart */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Keranjang ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-center py-8 text-gray-500">
                  Keranjang masih kosong
                </p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.menuId}
                      className="flex items-center justify-between border-b pb-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          {formatPrice(item.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.menuId, -1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.menuId, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => removeFromCart(item.menuId)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-bold">Total:</span>
                      <span className="text-2xl font-bold text-primary">
                        {formatPrice(getTotalPrice())}
                      </span>
                    </div>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={processOrder}
                      disabled={createOrder.isPending}
                    >
                      {createOrder.isPending ? 'Memproses...' : 'Proses Pesanan'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Orders Status Management */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Daftar Pesanan Pending</CardTitle>
              <CardDescription>
                Kelola dan ubah status pesanan yang perlu diselesaikan
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari nomor pesanan..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-10 pr-8"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
                    onClick={handleClearSearch}
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingOrders ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-2 text-sm text-gray-600">Memuat pesanan...</p>
            </div>
          ) : orders.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              {searchQuery ? 'Tidak ada pesanan yang sesuai dengan pencarian' : 'Tidak ada pesanan pending'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Pesanan</TableHead>
                  <TableHead>Tanggal & Waktu</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Dibuat Oleh</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm font-medium">
                      {order.orderNo}
                    </TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      {new Date(order.createdAt).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {order.type === 'cashier' ? 'Kasir' : 'Self Order'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {order.type === 'self-order'
                        ? (order.customerName || 'Pelanggan (Self Order)')
                        : (order.createdBy?.name || '-')}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrice(order.totalPrice)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetail(order)}
                        >
                          Lihat Detail
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                          disabled={updateOrderStatus.isPending}
                        >
                          {updateOrderStatus.isPending ? 'Memproses...' : 'Selesaikan'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {!isLoadingOrders && orders.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} pesanan
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm">
                  Halaman {pagination.page} dari {pagination.totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Pesanan</DialogTitle>
            <DialogDescription>
              Informasi lengkap pesanan
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Nomor Pesanan</div>
                  <div className="font-mono font-semibold">{selectedOrder.orderNo}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Tanggal & Waktu</div>
                  <div className="text-sm">
                    {new Date(selectedOrder.createdAt).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    {new Date(selectedOrder.createdAt).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Tipe Pesanan</div>
                  <Badge variant="outline">
                    {selectedOrder.type === 'cashier' ? 'Kasir' : 'Self Order'}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Status</div>
                  <Badge variant={selectedOrder.status === 'completed' ? 'default' : 'secondary'}>
                    {selectedOrder.status === 'completed' ? 'Selesai' :
                     selectedOrder.status === 'pending' ? 'Pending' : 'Dibatalkan'}
                  </Badge>
                </div>
                {selectedOrder.customerName && (
                  <div className="col-span-2">
                    <div className="text-xs text-gray-500 mb-1">Nama Customer</div>
                    <div className="font-medium">{selectedOrder.customerName}</div>
                  </div>
                )}
                <div className="col-span-2">
                  <div className="text-xs text-gray-500 mb-1">Dibuat Oleh</div>
                  <div className="font-medium">
                    {selectedOrder.type === 'self-order'
                      ? (selectedOrder.customerName || 'Pelanggan (Self Order)')
                      : (selectedOrder.createdBy?.name || '-')}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <div className="font-semibold mb-3">Item Pesanan</div>
                <div className="border rounded-lg divide-y dark:divide-gray-700">
                  {selectedOrder.orderItems.map((item) => (
                    <div key={item.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {item.menu.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.quantity} x {formatPrice(item.price)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {formatPrice(item.subtotal)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Pembayaran</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(selectedOrder.totalPrice)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
