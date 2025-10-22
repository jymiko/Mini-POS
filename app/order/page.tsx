'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface MenuMaterial {
  quantity: number
  material: {
    id: string
    name: string
    unit: string
    stock: number
  }
}

interface Menu {
  id: string
  name: string
  description?: string
  price: number
  isActive: boolean
  isAvailable: boolean
  menuMaterials: MenuMaterial[]
}

interface CartItem {
  menuId: string
  name: string
  price: number
  quantity: number
  isAvailable: boolean
}

interface OrderDetail {
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  totalPrice: number
  customerName: string
}

export default function SelfOrderPage() {
  const [menus, setMenus] = useState<Menu[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [orderNo, setOrderNo] = useState('')
  const [orderId, setOrderId] = useState('')
  const [orderStatus, setOrderStatus] = useState('pending')
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null)

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const fetchMenus = async () => {
    try {
      const response = await fetch('/api/menus')
      const data = await response.json()
      setMenus(data.menus?.filter((m: Menu) => m.isActive && m.isAvailable) || [])
    } catch (error) {
      console.error('Error fetching menus:', error)
      toast.error('Gagal mengambil data menu')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMenus()
  }, [])

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    if (isSuccessOpen && orderId) {
      intervalId = setInterval(async () => {
        try {
          const response = await fetch(`/api/orders/${orderId}`)
          if (response.ok) {
            const data = await response.json()
            const newStatus = data.order.status

            if (newStatus === 'completed' && orderStatus !== 'completed') {
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('🎉 Pesanan Anda Sudah Siap!', {
                  body: `Pesanan ${orderNo} siap diambil di kasir`,
                  icon: '/icon.png',
                  tag: 'order-ready',
                  requireInteraction: true,
                })
              }

              try {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
                const oscillator = audioContext.createOscillator()
                const gainNode = audioContext.createGain()

                oscillator.connect(gainNode)
                gainNode.connect(audioContext.destination)

                oscillator.frequency.value = 800
                oscillator.type = 'sine'

                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

                oscillator.start(audioContext.currentTime)
                oscillator.stop(audioContext.currentTime + 0.5)
              } catch (error) {
                console.log('Sound notification failed:', error)
              }

              toast.success('🎉 Pesanan Anda Sudah Siap!', {
                description: 'Silakan ambil pesanan Anda di kasir',
                duration: 10000,
              })

              document.title = '✅ Pesanan Siap - Self Order'

              if ('vibrate' in navigator) {
                navigator.vibrate([200, 100, 200, 100, 200])
              }
            }

            setOrderStatus(newStatus)
          }
        } catch (error) {
          console.error('Error fetching order status:', error)
        }
      }, 3000)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
      document.title = 'Self Order'
    }
  }, [isSuccessOpen, orderId, orderStatus])

  const addToCart = (menu: Menu) => {
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
    toast.success(`${menu.name} ditambahkan ke keranjang`)
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

  const openCheckout = () => {
    if (cart.length === 0) {
      toast.error('Keranjang masih kosong')
      return
    }
    setIsCheckoutOpen(true)
  }

  const processOrder = async () => {
    if (!customerName.trim()) {
      toast.error('Mohon masukkan nama Anda')
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((item) => ({
            menuId: item.menuId,
            quantity: item.quantity,
          })),
          customerName: customerName.trim(),
          type: 'self-order',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setOrderNo(data.order.orderNo)
        setOrderId(data.order.id)
        setOrderStatus(data.order.status)

        setOrderDetail({
          items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          totalPrice: getTotalPrice(),
          customerName: customerName.trim(),
        })

        setCart([])
        setCustomerName('')
        setIsCheckoutOpen(false)
        setIsSuccessOpen(true)
        fetchMenus()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal memproses pesanan')
      }
    } catch (error) {
      console.error('Error processing order:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setIsProcessing(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Self Order
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pesan menu favorit Anda
              </p>
            </div>
            <Button onClick={openCheckout} className="relative">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Keranjang
              {cart.length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center">
                  {cart.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Menu List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <p className="text-center py-12">Loading...</p>
        ) : menus.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-gray-500">
                Maaf, saat ini tidak ada menu yang tersedia
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {menus.map((menu) => (
              <Card
                key={menu.id}
                className="cursor-pointer hover:shadow-lg transition-all"
                onClick={() => addToCart(menu)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{menu.name}</CardTitle>
                      {menu.description && (
                        <CardDescription className="mt-2">
                          {menu.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="default" className="bg-green-600 ml-2">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Tersedia
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(menu.price)}
                    </span>
                    <Button
                      size="lg"
                      onClick={(e) => {
                        e.stopPropagation()
                        addToCart(menu)
                      }}
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Pesan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription>
              Review pesanan Anda dan masukkan nama
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="customerName">Nama *</Label>
              <Input
                id="customerName"
                placeholder="Masukkan nama Anda"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={isProcessing}
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Pesanan Anda:</h3>
              <div className="space-y-2">
                {cart.map((item) => (
                  <div
                    key={item.menuId}
                    className="flex justify-between items-center"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded px-2 py-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.menuId, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.menuId, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          {formatPrice(item.price)}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => removeFromCart(item.menuId)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Total:</span>
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(getTotalPrice())}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCheckoutOpen(false)}
              disabled={isProcessing}
            >
              Batal
            </Button>
            <Button onClick={processOrder} disabled={isProcessing}>
              {isProcessing ? 'Memproses...' : 'Konfirmasi Pesanan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className={`rounded-full p-3 ${
                orderStatus === 'completed'
                  ? 'bg-green-100 dark:bg-green-900'
                  : 'bg-yellow-100 dark:bg-yellow-900'
              }`}>
                <CheckCircle className={`h-12 w-12 ${
                  orderStatus === 'completed'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-yellow-600 dark:text-yellow-400'
                }`} />
              </div>
            </div>
            <DialogTitle className={`text-center text-xl ${
              orderStatus === 'completed' ? 'animate-pulse' : ''
            }`}>
              {orderStatus === 'completed' ? '🎉 Pesanan Siap!' : 'Pesanan Berhasil!'}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-center">
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Nomor Pesanan Anda:</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {orderNo}
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Badge
                      variant={orderStatus === 'completed' ? 'default' : 'secondary'}
                      className={`text-base px-4 py-1 ${
                        orderStatus === 'completed' ? 'bg-green-600 animate-bounce' : ''
                      }`}
                    >
                      {orderStatus === 'completed' ? '✅ Pesanan Siap Diambil' : '⏳ Sedang Diproses'}
                    </Badge>
                  </div>

                  {/* Order Details */}
                  {orderDetail && (
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="font-semibold text-gray-900 dark:text-white mb-3">
                        Detail Pesanan
                      </div>

                      {/* Customer Name */}
                      <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-500 mb-1">Nama Pemesan</div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {orderDetail.customerName}
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="space-y-2 mb-3">
                        {orderDetail.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {item.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {item.quantity} x {formatPrice(item.price)}
                              </div>
                            </div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {formatPrice(item.price * item.quantity)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Total */}
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                          <span className="text-xl font-bold text-primary">
                            {formatPrice(orderDetail.totalPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    {orderStatus === 'completed' ? (
                      <>
                        <div className="font-semibold text-green-600 dark:text-green-400 mb-2">
                          ✅ Pesanan Anda sudah siap!
                        </div>
                        <div>
                          Silakan tunjukkan nomor pesanan ini ke kasir untuk mengambil pesanan Anda.
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-semibold text-yellow-600 dark:text-yellow-400 mb-2">
                          ⏳ Pesanan Anda sedang diproses
                        </div>
                        <div className="mb-3">
                          Harap menunggu. Status akan berubah otomatis saat pesanan sudah siap.
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3 text-blue-800 dark:text-blue-200">
                          <div className="font-semibold mb-1">💡 Tips:</div>
                          <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>Biarkan halaman ini tetap terbuka</li>
                            <li>Anda akan mendapat notifikasi saat pesanan siap</li>
                            <li>Simpan nomor pesanan untuk ditunjukkan ke kasir</li>
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="w-full"
              onClick={() => {
                setIsSuccessOpen(false)
                setOrderStatus('pending')
                setOrderId('')
                setOrderNo('')
                window.location.reload()
              }}
            >
              Pesan Lagi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
