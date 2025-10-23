'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Edit, Trash2, CheckCircle2, XCircle, Search, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { useMenus, useCreateMenu, useUpdateMenu, useDeleteMenu, type Menu } from '@/lib/hooks/use-menus'
import { useMaterials, type Material } from '@/lib/hooks/use-materials'
import { useDebounce } from '@/lib/hooks/use-debounce'

const ITEMS_PER_PAGE = 10

interface MaterialInput {
  materialId: string
  quantity: string
}

export default function MenusPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    isActive: true,
  })
  const [selectedMaterials, setSelectedMaterials] = useState<MaterialInput[]>([])
  const [errors, setErrors] = useState({
    name: '',
    price: '',
    materials: '',
  })

  const debouncedSearch = useDebounce(searchQuery, 300)

  const { data: menusData, isLoading: isLoadingMenus } = useMenus()
  const { data: materialsData, isLoading: isLoadingMaterials } = useMaterials()

  const menus = useMemo(() => menusData?.menus || [], [menusData])
  const materials = useMemo(() => materialsData?.materials || [], [materialsData])
  const isLoading = isLoadingMenus || isLoadingMaterials

  const filteredMenus = useMemo(() => {
    if (!debouncedSearch) return menus

    const query = debouncedSearch.toLowerCase()
    return menus.filter((menu) =>
      menu.name.toLowerCase().includes(query) ||
      menu.description?.toLowerCase().includes(query) ||
      menu.menuMaterials.some((mm) =>
        mm.material.name.toLowerCase().includes(query)
      )
    )
  }, [menus, debouncedSearch])

  const totalPages = Math.ceil(filteredMenus.length / ITEMS_PER_PAGE)
  const paginatedMenus = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredMenus.slice(startIndex, endIndex)
  }, [filteredMenus, currentPage])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  const createMenu = useCreateMenu()
  const updateMenu = useUpdateMenu()
  const deleteMenu = useDeleteMenu()

  const handleOpenDialog = (menu?: Menu) => {
    if (menu) {
      setSelectedMenu(menu)
      setFormData({
        name: menu.name,
        description: menu.description || '',
        price: menu.price.toString(),
        isActive: menu.isActive,
      })
      setSelectedMaterials(
        menu.menuMaterials.map((mm) => ({
          materialId: mm.material.id,
          quantity: mm.quantity.toString(),
        }))
      )
    } else {
      setSelectedMenu(null)
      setFormData({ name: '', description: '', price: '', isActive: true })
      setSelectedMaterials([])
    }
    setErrors({ name: '', price: '', materials: '' })
    setIsDialogOpen(true)
  }

  const validateForm = () => {
    const newErrors = {
      name: '',
      price: '',
      materials: '',
    }
    let isValid = true

    if (!formData.name.trim()) {
      newErrors.name = 'Nama menu harus diisi'
      isValid = false
    }

    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'Harga harus berupa angka valid (lebih dari 0)'
      isValid = false
    }

    const validMaterials = selectedMaterials.filter((m) => m.materialId && m.quantity)
    if (validMaterials.length === 0) {
      newErrors.materials = 'Menu harus memiliki minimal 1 bahan'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const addMaterial = () => {
    setSelectedMaterials([...selectedMaterials, { materialId: '', quantity: '' }])
    if (errors.materials) setErrors({ ...errors, materials: '' })
  }

  const removeMaterial = (index: number) => {
    setSelectedMaterials(selectedMaterials.filter((_, i) => i !== index))
  }

  const updateMaterial = (index: number, field: 'materialId' | 'quantity', value: string) => {
    const updated = [...selectedMaterials]
    updated[index][field] = value
    setSelectedMaterials(updated)
    if (errors.materials) setErrors({ ...errors, materials: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const materialsData = selectedMaterials
      .filter((m) => m.materialId && m.quantity)
      .map((m) => ({
        materialId: m.materialId,
        quantity: parseFloat(m.quantity),
      }))

    const menuData = {
      ...formData,
      materials: materialsData,
    }

    if (selectedMenu) {
      updateMenu.mutate(
        {
          menuId: selectedMenu.id,
          ...menuData,
        },
        {
          onSuccess: () => {
            toast.success('Menu berhasil diupdate')
            setIsDialogOpen(false)
          },
          onError: (error) => {
            toast.error(error.message || 'Gagal menyimpan menu')
          },
        }
      )
    } else {
      createMenu.mutate(menuData, {
        onSuccess: () => {
          toast.success('Menu berhasil ditambahkan')
          setIsDialogOpen(false)
        },
        onError: (error) => {
          toast.error(error.message || 'Gagal menyimpan menu')
        },
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedMenu) return

    deleteMenu.mutate(
      { menuId: selectedMenu.id },
      {
        onSuccess: () => {
          toast.success('Menu berhasil dihapus')
          setIsDeleteDialogOpen(false)
        },
        onError: (error) => {
          toast.error(error.message || 'Gagal menghapus menu')
        },
      }
    )
  }

  const handleClearSearch = () => {
    setSearchQuery('')
  }

  const openDeleteDialog = (menu: Menu) => {
    setSelectedMenu(menu)
    setIsDeleteDialogOpen(true)
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Master Menu
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Kelola menu penjualan dan bahan yang dibutuhkan
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Menu
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Daftar Menu</CardTitle>
              <CardDescription>
                Total {filteredMenus.length} menu{searchQuery ? ' ditemukan' : ' terdaftar'}
              </CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari menu atau bahan..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
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
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-2 text-sm text-gray-600">Memuat menu...</p>
            </div>
          ) : filteredMenus.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              {searchQuery
                ? 'Tidak ada menu yang sesuai dengan pencarian'
                : 'Belum ada menu. Klik "Tambah Menu" untuk menambahkan.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Menu</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Bahan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ketersediaan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMenus.map((menu) => (
                    <TableRow key={menu.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{menu.name}</p>
                          {menu.description && (
                            <p className="text-sm text-gray-500">
                              {menu.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatPrice(menu.price)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {menu.menuMaterials.length === 0 ? (
                            <span className="text-gray-500">Tidak ada bahan</span>
                          ) : (
                            <ul className="list-disc list-inside">
                              {menu.menuMaterials.map((mm, idx) => (
                                <li key={idx}>
                                  {mm.material.name} ({mm.quantity} {mm.material.unit})
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={menu.isActive ? 'default' : 'secondary'}>
                          {menu.isActive ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {menu.isAvailable ? (
                          <Badge variant="default" className="bg-green-600 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="h-3 w-3" />
                            Tersedia
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                            <XCircle className="h-3 w-3" />
                            Tidak Tersedia
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(menu)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(menu)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && filteredMenus.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredMenus.length)} dari {filteredMenus.length} menu
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm">
                  Halaman {currentPage} dari {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedMenu ? 'Edit Menu' : 'Tambah Menu'}
            </DialogTitle>
            <DialogDescription>
              {selectedMenu
                ? 'Update data menu yang sudah ada'
                : 'Tambahkan menu baru ke sistem'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Menu *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    if (errors.name) setErrors({ ...errors, name: '' })
                  }}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="price">Harga *</Label>
                <Input
                  id="price"
                  type="number"
                  step="100"
                  value={formData.price}
                  onChange={(e) => {
                    setFormData({ ...formData, price: e.target.value })
                    if (errors.price) setErrors({ ...errors, price: '' })
                  }}
                  className={errors.price ? 'border-red-500' : ''}
                />
                {errors.price && (
                  <p className="text-sm text-red-600 mt-1">{errors.price}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked as boolean })
                  }
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Menu Aktif
                </Label>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <Label>Bahan yang Dibutuhkan *</Label>
                  <Button type="button" size="sm" onClick={addMaterial}>
                    <Plus className="h-4 w-4 mr-1" />
                    Tambah Bahan
                  </Button>
                </div>
                <div className="space-y-3">
                  {selectedMaterials.map((material, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label>Material</Label>
                        <Select
                          value={material.materialId}
                          onValueChange={(value) =>
                            updateMaterial(index, 'materialId', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih material" />
                          </SelectTrigger>
                          <SelectContent>
                            {materials.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.name} (Stock: {m.stock} {m.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-32">
                        <Label>Jumlah</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={material.quantity}
                          onChange={(e) =>
                            updateMaterial(index, 'quantity', e.target.value)
                          }
                          placeholder="0"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeMaterial(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                  {selectedMaterials.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Belum ada bahan ditambahkan
                    </p>
                  )}
                </div>
                {errors.materials && (
                  <p className="text-sm text-red-600 mt-2">{errors.materials}</p>
                )}
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={createMenu.isPending || updateMenu.isPending}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createMenu.isPending || updateMenu.isPending}
              >
                {(createMenu.isPending || updateMenu.isPending) ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Menu</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus menu{' '}
              <strong>{selectedMenu?.name}</strong>? Menu akan dinonaktifkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteMenu.isPending}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMenu.isPending}
            >
              {deleteMenu.isPending ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
