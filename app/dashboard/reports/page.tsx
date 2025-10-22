'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { TrendingUp, DollarSign, ShoppingCart, Users, CalendarIcon, ChevronLeft, ChevronRight, X, Search, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useReports, type Order } from '@/lib/hooks/use-reports'
import { useDebounce } from '@/lib/hooks/use-debounce'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function ReportsPage() {
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [type, setType] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const [appliedStartDate, setAppliedStartDate] = useState<string>()
  const [appliedEndDate, setAppliedEndDate] = useState<string>()
  const [appliedType, setAppliedType] = useState<string>()

  const debouncedSearch = useDebounce(searchQuery, 300)

  const { data: reportsData, isLoading, error } = useReports({
    startDate: appliedStartDate,
    endDate: appliedEndDate,
    type: appliedType,
    search: debouncedSearch,
    page: currentPage,
    limit: 10,
  })

  const data = useMemo(() => reportsData, [reportsData])

  const applyFilters = () => {
    setAppliedStartDate(startDate ? format(startDate, 'yyyy-MM-dd') : undefined)
    setAppliedEndDate(endDate ? format(endDate, 'yyyy-MM-dd') : undefined)
    setAppliedType(type || undefined)
    setCurrentPage(1)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setCurrentPage(1)
  }

  const handlePageChange = (newPage: number) => {
    if (data?.pagination && newPage >= 1 && newPage <= data.pagination.totalPages) {
      setCurrentPage(newPage)
    }
  }

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order)
    setIsDetailOpen(true)
  }

  if (error) {
    if (error.message.includes('akses')) {
      toast.error('Anda tidak memiliki akses ke halaman ini')
    } else {
      toast.error('Gagal mengambil data laporan')
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Laporan Penjualan
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Analisis dan statistik penjualan
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Laporan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Tanggal Mulai</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP', { locale: localeId }) : 'Pilih tanggal'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 flex justify-center items-center" align="center">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    locale={localeId}
                    className="px-3 py-2"
                    classNames={{
                      months: "",
                      month: "space-y-2",
                      table: "border-collapse",
                      head_row: "flex justify-between",
                      head_cell: "flex-1 text-center font-normal text-sm",
                      row: "flex justify-between",
                      cell: "flex-1 text-center p-0",
                      day: "w-full h-full p-2"
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Tanggal Akhir</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP', { locale: localeId }) : 'Pilih tanggal'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 flex justify-center items-center" align="center">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    locale={localeId}
                    disabled={(date) => startDate ? date < startDate : false}
                    className="px-3 py-2"
                    classNames={{
                      months: "",
                      month: "space-y-2",
                      table: "border-collapse",
                      head_row: "flex justify-between",
                      head_cell: "flex-1 text-center font-normal text-sm",
                      row: "flex justify-between",
                      cell: "flex-1 text-center p-0",
                      day: "w-full h-full p-2"
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Tipe</Label>
              <select
                id="type"
                className="w-full h-10 rounded-md border border-input bg-background px-3"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="">Semua</option>
                <option value="cashier">Kasir</option>
                <option value="self-order">Self Order</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={applyFilters} className="w-full" disabled={isLoading}>
                {isLoading ? 'Memuat...' : 'Terapkan Filter'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-gray-600">Memuat laporan...</p>
        </div>
      ) : data && data.summary ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPrice(data.summary?.totalRevenue || 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Order</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary?.totalOrders || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rata-rata/Order</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPrice(data.summary?.averageOrderValue || 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Kasir / Self Order</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.summary?.ordersByType?.cashier || 0} / {data.summary?.ordersByType?.selfOrder || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Menus */}
          <Card>
            <CardHeader>
              <CardTitle>Menu Terlaris</CardTitle>
              <CardDescription>Top 10 menu berdasarkan jumlah penjualan</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Menu</TableHead>
                    <TableHead className="text-right">Terjual</TableHead>
                    <TableHead className="text-right">Total Pendapatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!data.topMenus || data.topMenus.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500">
                        Belum ada data
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.topMenus.map((menu, idx) => (
                      <TableRow key={menu.menuId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">#{idx + 1}</Badge>
                            <span className="font-medium">{menu.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{menu.quantity}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPrice(menu.revenue)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Daily Sales */}
          <Card>
            <CardHeader>
              <CardTitle>Penjualan Harian</CardTitle>
              <CardDescription>Ringkasan penjualan per hari</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Jumlah Order</TableHead>
                    <TableHead className="text-right">Total Pendapatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!data.dailySales || data.dailySales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500">
                        Belum ada data
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.dailySales.map((day) => (
                      <TableRow key={day.date}>
                        <TableCell>
                          {new Date(day.date).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="text-right">{day.orders}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPrice(day.revenue)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Orders List */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Daftar Pesanan</CardTitle>
                  <CardDescription>Detail semua pesanan dalam periode yang dipilih</CardDescription>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Pesanan</TableHead>
                    <TableHead>Tanggal & Waktu</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dibuat Oleh</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!data.orders || data.orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500">
                        {searchQuery ? 'Tidak ada pesanan yang sesuai dengan pencarian' : 'Belum ada data pesanan'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.orders.map((order: Order) => (
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
                          <Badge
                            variant={
                              order.status === 'completed'
                                ? 'default'
                                : order.status === 'pending'
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {order.status === 'completed'
                              ? 'Selesai'
                              : order.status === 'pending'
                              ? 'Pending'
                              : 'Dibatalkan'}
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetail(order)}
                          >
                            Lihat Detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data.pagination && data.orders.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Menampilkan {((data.pagination.page - 1) * data.pagination.limit) + 1} - {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} dari {data.pagination.total} pesanan
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(data.pagination!.page - 1)}
                      disabled={data.pagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm">
                      Halaman {data.pagination.page} dari {data.pagination.totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(data.pagination!.page + 1)}
                      disabled={data.pagination.page === data.pagination.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500">
              Tidak ada data untuk ditampilkan. Silakan pilih filter atau lakukan transaksi terlebih dahulu.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog Detail Pesanan */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Pesanan</DialogTitle>
            <DialogDescription asChild>
              <div>Detail lengkap pesanan</div>
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">No. Pesanan</p>
                  <p className="font-mono font-semibold">{selectedOrder.orderNo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tanggal & Waktu</p>
                  <p className="font-medium">
                    {new Date(selectedOrder.createdAt).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}{' '}
                    {new Date(selectedOrder.createdAt).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tipe</p>
                  <Badge variant="outline">
                    {selectedOrder.type === 'cashier' ? 'Kasir' : 'Self Order'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <Badge
                    variant={
                      selectedOrder.status === 'completed'
                        ? 'default'
                        : selectedOrder.status === 'pending'
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {selectedOrder.status === 'completed'
                      ? 'Selesai'
                      : selectedOrder.status === 'pending'
                      ? 'Pending'
                      : 'Dibatalkan'}
                  </Badge>
                </div>
                {selectedOrder.customerName && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nama Pelanggan</p>
                    <p className="font-medium">{selectedOrder.customerName}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Dibuat Oleh</p>
                  <p className="font-medium">
                    {selectedOrder.type === 'self-order'
                      ? (selectedOrder.customerName || 'Pelanggan (Self Order)')
                      : (selectedOrder.createdBy?.name || '-')}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3">Item Pesanan</h3>
                <div className="space-y-2">
                  {selectedOrder.orderItems?.map((item, index: number) => (
                    <div
                      key={index}
                      className="flex justify-between items-start p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.menu?.name || 'Menu tidak ditemukan'}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.quantity} x {formatPrice(item.price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatPrice(item.subtotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-semibold">Total</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(selectedOrder.totalPrice)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
