'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ChevronRight,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Truck,
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

function getStatus(item) {
  const stock = Number(item.stock_actual || 0)
  const minimo = Number(item.stock_minimo || 0)

  if (stock <= 0) {
    return {
      label: 'Agotado',
      className: 'bg-red-50 text-red-600',
    }
  }

  if (stock <= minimo) {
    return {
      label: 'Stock bajo',
      className: 'bg-amber-50 text-amber-700',
    }
  }

  return {
    label: 'Disponible',
    className: 'bg-emerald-50 text-emerald-700',
  }
}

export default function InventarioPage() {
  const [inventario, setInventario] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const categories = [
    'Todos',
    'Materia prima',
    'Toppings y Siropes',
    'Empaques',
    'Utensilios',
    'Productos preparados',
    'Limpieza y operación',
  ]

  useEffect(() => {
    fetchInventario()
  }, [])

  async function fetchInventario() {
    setLoading(true)

    const { data, error } = await supabase
      .from('inventario')
      .select('*')
      .order('nombre', { ascending: true })

    if (error) {
      console.error('Error cargando inventario:', error)
      alert('No se pudo cargar el inventario.')
      setLoading(false)
      return
    }

    setInventario(data || [])
    setLoading(false)
  }

  async function eliminarProducto(id, nombre) {
    const confirmar = confirm(
      `¿Deseas eliminar "${nombre}"? Esta acción no se puede deshacer.`
    )

    if (!confirmar) return

    setDeletingId(id)

    const { error } = await supabase
      .from('inventario')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error eliminando producto:', error)
      alert('No se pudo eliminar el producto.')
      setDeletingId(null)
      return
    }

    await fetchInventario()
    setDeletingId(null)
  }

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return inventario.filter((item) => {
      const matchesCategory =
        selectedCategory === 'Todos' ||
        item.categoria === selectedCategory

      const text = `
        ${item.nombre || ''}
        ${item.sku || ''}
        ${item.categoria || ''}
        ${item.unidad || ''}
        ${item.proveedor || ''}
      `.toLowerCase()

      const matchesSearch =
        !normalizedSearch || text.includes(normalizedSearch)

      return matchesCategory && matchesSearch
    })
  }, [inventario, search, selectedCategory])

  const lowStockItems = useMemo(() => {
    return inventario.filter((item) => {
      const stock = Number(item.stock_actual || 0)
      const minimo = Number(item.stock_minimo || 0)

      return stock <= minimo
    })
  }, [inventario])

  const providersCount = useMemo(() => {
    const providers = inventario
      .map((item) => item.proveedor?.trim())
      .filter(Boolean)

    return new Set(providers).size
  }, [inventario])

  return (
    <main className="min-h-screen bg-[#fcf8f8]">
      <header className="bg-white border-b border-[#f1dede] px-5 md:px-8 py-3 md:h-[82px] md:py-0 md:flex md:items-center">
        <div className="w-full">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
                Inventario
              </p>

              <h1 className="mt-1 text-[21px] md:text-[23px] font-bold text-[#7a0000] leading-tight">
                Inventario
              </h1>

              <p className="mt-1 text-xs md:text-sm text-[#b07a7a]">
                Control de ingredientes, empaques y consumibles.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <Link
                href="/inventario/nuevo"
                className="w-full sm:w-auto bg-[#8c0303] text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                <Plus size={16} />
                Nuevo producto
              </Link>

              <button
                type="button"
                onClick={fetchInventario}
                disabled={loading}
                className="w-full sm:w-auto border border-[#efcaca] bg-white text-[#8c0303] px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#fff5f5] disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={loading ? 'animate-spin' : ''}
                />
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="max-w-[1500px] mx-auto px-4 md:px-8 py-5 md:py-7">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <article className="bg-white border border-[#f3dede] rounded-[24px] p-5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
              Total de items
            </p>

            <p className="mt-3 text-[32px] font-bold text-[#7a0000] leading-none">
              {inventario.length}
            </p>
          </article>

          <article className="bg-white border border-[#f3dede] rounded-[24px] p-5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
              Stock bajo
            </p>

            <p className="mt-3 text-[32px] font-bold text-[#7a0000] leading-none">
              {lowStockItems.length}
            </p>
          </article>

          <article className="bg-white border border-[#f3dede] rounded-[24px] p-5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
              Proveedores
            </p>

            <p className="mt-3 text-[32px] font-bold text-[#7a0000] leading-none">
              {providersCount}
            </p>
          </article>
        </div>

        {lowStockItems.length > 0 && (
          <section className="mt-4 bg-[#fffafa] border border-[#f3dede] rounded-[24px] p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#fff1f1] text-[#8c0303] flex items-center justify-center shrink-0">
                <AlertTriangle size={18} />
              </div>

              <div>
                <h2 className="text-[18px] font-bold text-[#7a0000]">
                  Alertas de inventario
                </h2>

                <p className="text-sm text-[#b07a7a] mt-1">
                  {lowStockItems.length} producto(s) requieren reposición.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {lowStockItems.slice(0, 5).map((item) => {
                const status = getStatus(item)

                return (
                  <Link
                    key={item.id}
                    href={`/inventario/${item.id}`}
                    className="bg-white border border-[#f3dede] rounded-2xl px-4 py-3 flex items-center justify-between gap-4 hover:bg-[#fff5f5]"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-[#2e2e2e] truncate">
                        {item.nombre}
                      </p>

                      <p className="text-xs text-[#b07a7a] mt-1">
                        Actual: {item.stock_actual || 0} {item.unidad || ''}
                        {' · '}
                        Mínimo: {item.stock_minimo || 0}
                      </p>
                    </div>

                    <span
                      className={`${status.className} px-3 py-1 rounded-full text-xs font-semibold shrink-0`}
                    >
                      {status.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        <section className="mt-4 bg-white border border-[#f3dede] rounded-[24px] overflow-hidden">
          <div className="p-5 md:p-6 border-b border-[#f3dede]">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-[18px] md:text-[20px] font-bold text-[#7a0000]">
                  Productos registrados
                </h2>

                <p className="text-sm text-[#b07a7a] mt-1">
                  Busca, filtra y administra los insumos disponibles.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-[#fffafa] border border-[#efcccc] rounded-xl px-4 py-3">
                <Search size={17} className="text-[#9b8a8a] shrink-0" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar producto, SKU, categoría o proveedor..."
                  className="w-full outline-none bg-transparent text-sm text-[#2e2e2e]"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm border transition ${
                      selectedCategory === category
                        ? 'bg-[#8c0303] text-white border-[#8c0303]'
                        : 'bg-white text-[#8c0303] border-[#efcccc] hover:bg-[#fff5f5]'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="md:hidden divide-y divide-[#f3dede]">
            {loading ? (
              <div className="px-5 py-10 text-center text-sm text-[#b07a7a]">
                Cargando inventario...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-[#b07a7a]">
                No se encontraron productos.
              </div>
            ) : (
              filteredItems.map((item) => {
                const status = getStatus(item)

                return (
                  <article key={item.id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[18px] font-bold text-[#7a0000] break-words">
                          {item.nombre}
                        </p>

                        <p className="text-sm text-[#b07a7a] mt-1">
                          {item.categoria || 'Sin categoría'}
                        </p>
                      </div>

                      <span
                        className={`${status.className} px-3 py-1 rounded-full text-xs font-semibold shrink-0`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-[#fffafa] border border-[#f3dede] rounded-2xl p-3">
                        <p className="text-[10px] uppercase tracking-[0.13em] text-[#b9a0a0]">
                          Stock
                        </p>

                        <p className="mt-2 text-lg font-bold text-[#7a0000]">
                          {item.stock_actual || 0} {item.unidad || ''}
                        </p>
                      </div>

                      <div className="bg-[#fffafa] border border-[#f3dede] rounded-2xl p-3">
                        <p className="text-[10px] uppercase tracking-[0.13em] text-[#b9a0a0]">
                          Mínimo
                        </p>

                        <p className="mt-2 text-lg font-bold text-[#7a0000]">
                          {item.stock_minimo || 0} {item.unidad || ''}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-3">
                      <Link
                        href={`/inventario/${item.id}`}
                        className="flex-1 border border-[#efcaca] text-[#8c0303] rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        Editar
                        <ChevronRight size={16} />
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          eliminarProducto(item.id, item.nombre)
                        }
                        disabled={deletingId === item.id}
                        className="w-12 rounded-xl border border-red-200 text-red-600 flex items-center justify-center disabled:opacity-50"
                        aria-label={`Eliminar ${item.nombre}`}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </article>
                )
              })
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-[#f8eeee] text-[#b07a7a] uppercase text-[11px] tracking-[0.15em]">
                <tr>
                  <th className="py-4 px-5 text-left">Producto</th>
                  <th className="py-4 px-5 text-left">Categoría</th>
                  <th className="py-4 px-5 text-left">Proveedor</th>
                  <th className="py-4 px-5 text-left">Stock</th>
                  <th className="py-4 px-5 text-left">Estado</th>
                  <th className="py-4 px-5 text-right">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="py-10 text-center text-[#b07a7a]"
                    >
                      Cargando inventario...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="py-10 text-center text-[#b07a7a]"
                    >
                      No se encontraron productos.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const status = getStatus(item)

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-[#f3dede] hover:bg-[#fffafa]"
                      >
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#fff1f1] text-[#8c0303] flex items-center justify-center">
                              <Package size={17} />
                            </div>

                            <div>
                              <p className="font-semibold text-[#2e2e2e]">
                                {item.nombre}
                              </p>

                              <p className="text-xs text-[#b07a7a] mt-1">
                                {item.sku || 'Sin SKU'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-5">
                          {item.categoria || '-'}
                        </td>

                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2">
                            <Truck
                              size={15}
                              className="text-[#b07a7a]"
                            />
                            {item.proveedor || '-'}
                          </div>
                        </td>

                        <td className="py-4 px-5">
                          {item.stock_actual || 0} {item.unidad || ''}
                        </td>

                        <td className="py-4 px-5">
                          <span
                            className={`${status.className} px-3 py-1 rounded-full text-xs font-semibold`}
                          >
                            {status.label}
                          </span>
                        </td>

                        <td className="py-4 px-5">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/inventario/${item.id}`}
                              className="px-3 py-2 rounded-xl border border-[#efcaca] text-[#8c0303] text-xs font-semibold hover:bg-[#fff5f5]"
                            >
                              Editar
                            </Link>

                            <button
                              type="button"
                              onClick={() =>
                                eliminarProducto(item.id, item.nombre)
                              }
                              disabled={deletingId === item.id}
                              className="w-9 h-9 rounded-xl border border-red-200 text-red-600 flex items-center justify-center hover:bg-red-50 disabled:opacity-50"
                              aria-label={`Eliminar ${item.nombre}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  )
}