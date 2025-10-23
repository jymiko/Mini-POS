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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, AlertCircle, Search, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { useMaterials, useCreateMaterial, useUpdateMaterial, useDeleteMaterial, type Material } from '@/lib/hooks/use-materials'
import { useDebounce } from '@/lib/hooks/use-debounce'

const ITEMS_PER_PAGE = 10

export default function MaterialsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    stock: '',
    minStock: '',
  })
  const [errors, setErrors] = useState({
    name: '',
    unit: '',
    stock: '',
    minStock: '',
  })

  const debouncedSearch = useDebounce(searchQuery, 300)

  const { data: materialsData, isLoading } = useMaterials()
  const materials = useMemo(() => materialsData?.materials || [], [materialsData])

  const filteredMaterials = useMemo(() => {
    if (!debouncedSearch) return materials

    const query = debouncedSearch.toLowerCase()
    return materials.filter((material) =>
      material.name.toLowerCase().includes(query) ||
      material.unit.toLowerCase().includes(query)
    )
  }, [materials, debouncedSearch])

  const totalPages = Math.ceil(filteredMaterials.length / ITEMS_PER_PAGE)
  const paginatedMaterials = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredMaterials.slice(startIndex, endIndex)
  }, [filteredMaterials, currentPage])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  const createMaterial = useCreateMaterial()
  const updateMaterial = useUpdateMaterial()
  const deleteMaterial = useDeleteMaterial()

  const handleOpenDialog = (material?: Material) => {
    if (material) {
      setSelectedMaterial(material)
      setFormData({
        name: material.name,
        unit: material.unit,
        stock: material.stock.toString(),
        minStock: material.minStock.toString(),
      })
    } else {
      setSelectedMaterial(null)
      setFormData({ name: '', unit: '', stock: '', minStock: '' })
    }
    setErrors({ name: '', unit: '', stock: '', minStock: '' })
    setIsDialogOpen(true)
  }

  const validateForm = () => {
    const newErrors = {
      name: '',
      unit: '',
      stock: '',
      minStock: '',
    }
    let isValid = true

    if (!formData.name.trim()) {
      newErrors.name = 'Nama material harus diisi'
      isValid = false
    }

    if (!formData.unit.trim()) {
      newErrors.unit = 'Satuan harus diisi'
      isValid = false
    }

    if (!formData.stock || isNaN(Number(formData.stock)) || Number(formData.stock) < 0) {
      newErrors.stock = 'Stock harus berupa angka valid (minimal 0)'
      isValid = false
    }

    if (!formData.minStock || isNaN(Number(formData.minStock)) || Number(formData.minStock) < 0) {
      newErrors.minStock = 'Minimal stock harus berupa angka valid (minimal 0)'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (selectedMaterial) {
      updateMaterial.mutate(
        {
          materialId: selectedMaterial.id,
          ...formData,
        },
        {
          onSuccess: () => {
            toast.success('Material berhasil diupdate')
            setIsDialogOpen(false)
          },
          onError: (error) => {
            toast.error(error.message || 'Gagal menyimpan material')
          },
        }
      )
    } else {
      createMaterial.mutate(formData, {
        onSuccess: () => {
          toast.success('Material berhasil ditambahkan')
          setIsDialogOpen(false)
        },
        onError: (error) => {
          toast.error(error.message || 'Gagal menyimpan material')
        },
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedMaterial) return

    deleteMaterial.mutate(
      { materialId: selectedMaterial.id },
      {
        onSuccess: () => {
          toast.success('Material berhasil dihapus')
          setIsDeleteDialogOpen(false)
        },
        onError: (error) => {
          toast.error(error.message || 'Gagal menghapus material')
        },
      }
    )
  }

  const handleClearSearch = () => {
    setSearchQuery('')
  }

  const openDeleteDialog = (material: Material) => {
    setSelectedMaterial(material)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Master Material
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Kelola bahan baku untuk menu
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Material
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Daftar Material</CardTitle>
              <CardDescription>
                Total {filteredMaterials.length} material{searchQuery ? ' ditemukan' : ' terdaftar'}
              </CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari material atau satuan..."
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
              <p className="mt-2 text-sm text-gray-600">Memuat material...</p>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              {searchQuery
                ? 'Tidak ada material yang sesuai dengan pencarian'
                : 'Belum ada material. Klik "Tambah Material" untuk menambahkan.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Material</TableHead>
                    <TableHead>Satuan</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Min. Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMaterials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{material.name}</TableCell>
                      <TableCell>{material.unit}</TableCell>
                      <TableCell>{material.stock}</TableCell>
                      <TableCell>{material.minStock}</TableCell>
                      <TableCell>
                        {material.stock <= material.minStock ? (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                            <AlertCircle className="h-3 w-3" />
                            Stock Rendah
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-600">
                            Stock Aman
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(material)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(material)}
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
          {!isLoading && filteredMaterials.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredMaterials.length)} dari {filteredMaterials.length} material
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedMaterial ? 'Edit Material' : 'Tambah Material'}
            </DialogTitle>
            <DialogDescription>
              {selectedMaterial
                ? 'Update data material yang sudah ada'
                : 'Tambahkan material baru ke sistem'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Material *</Label>
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
                <Label htmlFor="unit">Satuan *</Label>
                <Input
                  id="unit"
                  placeholder="gram, ml, pcs, etc"
                  value={formData.unit}
                  onChange={(e) => {
                    setFormData({ ...formData, unit: e.target.value })
                    if (errors.unit) setErrors({ ...errors, unit: '' })
                  }}
                  className={errors.unit ? 'border-red-500' : ''}
                />
                {errors.unit && (
                  <p className="text-sm text-red-600 mt-1">{errors.unit}</p>
                )}
              </div>
              <div>
                <Label htmlFor="stock">Stock *</Label>
                <Input
                  id="stock"
                  type="number"
                  step="0.01"
                  value={formData.stock}
                  onChange={(e) => {
                    setFormData({ ...formData, stock: e.target.value })
                    if (errors.stock) setErrors({ ...errors, stock: '' })
                  }}
                  className={errors.stock ? 'border-red-500' : ''}
                />
                {errors.stock && (
                  <p className="text-sm text-red-600 mt-1">{errors.stock}</p>
                )}
              </div>
              <div>
                <Label htmlFor="minStock">Minimal Stock *</Label>
                <Input
                  id="minStock"
                  type="number"
                  step="0.01"
                  value={formData.minStock}
                  onChange={(e) => {
                    setFormData({ ...formData, minStock: e.target.value })
                    if (errors.minStock) setErrors({ ...errors, minStock: '' })
                  }}
                  className={errors.minStock ? 'border-red-500' : ''}
                />
                {errors.minStock && (
                  <p className="text-sm text-red-600 mt-1">{errors.minStock}</p>
                )}
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={createMaterial.isPending || updateMaterial.isPending}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createMaterial.isPending || updateMaterial.isPending}
              >
                {(createMaterial.isPending || updateMaterial.isPending) ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Material</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus material{' '}
              <strong>{selectedMaterial?.name}</strong>? Aksi ini tidak dapat
              dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteMaterial.isPending}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMaterial.isPending}
            >
              {deleteMaterial.isPending ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
