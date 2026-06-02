'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Search,
  Package,
  Plus,
  Trash2
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function InventarioPage() {
const [inventario, setInventario] = useState([])
const [loading, setLoading] = useState(true)
const [selectedCategory, setSelectedCategory] = useState('Todos')
const [search, setSearch] = useState('')
const [showModal, setShowModal] = useState(false)

const categories = [
  'Todos',
  'Materia prima',
  'Toppings y Siropes',
  'Empaques',
  'Utensilios',
  'Productos preparados',
  'Limpieza y operación',
]

const [form, setForm] = useState({
  sku: '',
  nombre: '',
  categoria: '',
  unidad: '',
  stock_actual: 0,
  stock_minimo: 0,
  costo_unitario: 0,
  proveedor: '',
  proveedor_url: '',
  notas: '',
  activo: true,
})

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
    } else {
setInventario(data || [])
    }

    setLoading(false)
  }

  async function guardarProducto() {
    const { error } = await supabase
      .from('inventario')
      .insert([form])

    if (error) {
      alert('Error al guardar producto')
      console.error(error)
      return
    }

setForm({
  sku: '',
  nombre: '',
  categoria: '',
  unidad: '',
  stock_actual: 0,
  stock_minimo: 0,
  costo_unitario: 0,
  proveedor: '',
  proveedor_url: '',
  notas: '',
  activo: true,
})

    setShowModal(false)
    fetchInventario()
  }

  async function eliminarProducto(id) {
    const confirmar = confirm('¿Deseas eliminar este producto?')

    if (!confirmar) return

    const { error } = await supabase
      .from('inventario')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Error al eliminar')
      console.error(error)


      
      return
    }

    fetchInventario()
  }
  
const filteredItems = inventario.filter((item) => {
    const matchesCategory =
    selectedCategory === 'Todos' || item.categoria === selectedCategory

  const text = `
    ${item.nombre || ''}
    ${item.sku || ''}
    ${item.categoria || ''}
    ${item.unidad || ''}
    ${item.proveedor || ''}
  `.toLowerCase()

  const matchesSearch = text.includes(search.toLowerCase())

  return matchesCategory && matchesSearch
})

const lowStockItems = inventario.filter(
    (item) =>
      Number(item.stock_actual || 0) <= Number(item.stock_minimo || 0)
  )

function getStatus(item) {
  const stock = Number(item.stock_actual || 0)
  const minimo = Number(item.stock_minimo || 0)

  if (stock <= 0) {
    return {
      label: 'Agotado',
      className: 'bg-[#fee2e2] text-[#b91c1c]',
    }
  }

  if (stock <= minimo) {
    return {
      label: 'Bajo stock',
      className: 'bg-[#fff3c4] text-[#9a6a00]',
    }
  }

  return {
    label: 'OK',
    className: 'bg-[#dcfce7] text-[#15803d]',
  }
}

return (
  <main className="min-h-screen bg-[#fcf8f8]">
    {/* HEADER */}
    <div className="bg-white border-b border-[#f1dede] px-10 h-[86px] flex items-center">
      <div>
        <h1 className="text-[30px] text-[#7a0000] ivy leading-none">
          Inventario
        </h1>

        <p className="text-sm text-[#b07a7a] mt-2">
          Control de ingredientes, empaques y consumibles.
        </p>
      </div>
    </div>

    <section className="p-8 space-y-6">

<div className="flex justify-end gap-3">
  <button
    type="button"
    onClick={() => setShowModal(true)}
    className="bg-[#8c0303] text-white px-5 py-3 rounded-2xl font-semibold flex items-center gap-2 hover:bg-[#6f0202]"
  >
    <Plus size={18} />
    Nuevo Producto
  </button>

  <button
    type="button"
    onClick={fetchInventario}
    className="bg-[#8c0303] text-white px-5 py-3 rounded-2xl font-semibold hover:bg-[#6f0202]"
  >
    Actualizar
  </button>
</div>
<section className="p-8 space-y-6">
</section>

<div className="flex flex-wrap items-center gap-3 mb-6">
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

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
['Total de Items', inventario.length],
            ['Stock Bajo', lowStockItems.length],
            [
              'Proveedores',
              new Set(
               inventario.map((item) => item.proveedor)
              ).size,
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              className="bg-white border border-[#f3dede] rounded-[30px] p-7"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-[#b9a0a0]">
                {label}
              </p>
              <h2 className="text-[52px] leading-none text-[#7a0000] ivy mt-4">
                {value}
              </h2>
            </div>
          ))}
        </div>

        {/* ALERTAS */}
        {lowStockItems.length > 0 && (
          <div className="bg-[#fff7f7] border border-[#f3dede] rounded-[30px] p-8">
<div className="flex items-start gap-3 mb-5">
  <AlertTriangle className="text-[#8c0303] mt-2" />

  <div>
    <h3 className="text-[32px] ivy text-[#7a0000] leading-none">
      Alertas de Inventario
    </h3>

    <p className="text-sm text-[#b07a7a] mt-2">
      {lowStockItems.length} productos requieren reposición.
    </p>
  </div>
</div>
            <div className="space-y-2">
              {lowStockItems.slice(0, 5).map((item) => (
<div
  key={item.id}
  className="bg-white rounded-xl px-4 py-3 flex items-center justify-between border border-[#f3dede]"
>
  <div>
    <p className="font-semibold text-sm text-[#2e2e2e]">
      {item.nombre}
    </p>

    <p className="text-xs text-[#b07a7a] mt-1">
      Actual: {item.stock_actual || 0} {item.unidad || ''} · Mínimo: {item.stock_minimo || 0}
    </p>
  </div>

  <span className="bg-[#fff3c4] text-[#9a6a00] px-3 py-1 rounded-full text-xs">
    Bajo stock
  </span>
</div>
              ))}
            </div>
          </div>
        )}

        {/* SEARCH */}
<div className="flex items-center gap-2 bg-white border border-[#efcccc] rounded-xl px-4 py-3 mb-6">
  <Search size={17} className="text-[#9b8a8a]" />
  <input
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Buscar insumo, SKU o categoría..."
    className="w-full outline-none bg-transparent text-sm"
  />
</div>

        {/* TABLE */}
        <div className="bg-white border border-[#f3dede] rounded-[30px] p-6 overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-gray-500">
              Cargando inventario...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No se encontraron registros.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-[#f3dede] text-[#b9a0a0] uppercase tracking-[0.15em] text-xs">
                  <th className="py-4">Nombre</th>
                  <th className="py-4">Categoría</th>
                  <th className="py-4">Stock</th>
                  <th className="py-4">Estado</th>
                  <th className="py-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const status = getStatus(item)

                  return (
                    <tr key={item.id} className="border-b border-[#f9eded]">
                      <td className="py-4 font-semibold">
                        <div className="flex items-center gap-3">
                          <Package
                            size={16}
                            className="text-[#8c0303]"
                          />
                          {item.nombre}
                        </div>
                      </td>
                      <td className="py-4">
                        {item.categoria || '-'}
                      </td>
                      <td className="py-4">
                        {item.stock_actual} {item.unidad}
                      </td>
                      <td className="py-4">
                        <span
                          className={`${status.className} px-3 py-1 rounded-full text-xs`}
                        >
                          {status.label}
                        </span>
                      </td>
<td className="py-4">
  <div className="flex items-center gap-4">
    <Link
      href={`/inventario/${item.id}`}
      className="text-blue-600 hover:text-blue-800"
      title="Editar producto"
    >
      ✏️
    </Link>

    <button
      onClick={() => eliminarProducto(item.id)}
      className="text-red-600 hover:text-red-800"
      title="Eliminar producto"
    >
      <Trash2 size={18} />
    </button>
  </div>
</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
     </section>
      

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
<div className="bg-white rounded-3xl p-10 w-full max-w-5xl max-h-[90vh] overflow-y-auto space-y-4">
                <h2 className="text-3xl ivy text-[#7a0000]">
              Nuevo Producto
            </h2>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
<input
  placeholder="SKU"
  className="w-full border rounded-xl p-3"
  value={form.sku}
  onChange={(e) =>
    setForm({
      ...form,
      sku: e.target.value,
    })
  }
/><input
  placeholder="Nombre"
  className="w-full border rounded-xl p-3"
  value={form.nombre}
  onChange={(e) =>
    setForm({
      ...form,
      nombre: e.target.value,
    })
  }
/><input
  placeholder="Categoría"
  className="w-full border rounded-xl p-3"
  value={form.categoria}
  onChange={(e) =>
    setForm({
      ...form,
      categoria: e.target.value,
    })
  }
/><input
  placeholder="Unidad"
  className="w-full border rounded-xl p-3"
  value={form.unidad}
  onChange={(e) =>
    setForm({
      ...form,
      unidad: e.target.value,
    })
  }
/><input
  type="number"
placeholder="Stock Actual"
  className="w-full border rounded-xl p-3"
  value={form.stock_actual}
  onChange={(e) =>
    setForm({
      ...form,
      stock_actual: Number(e.target.value),
    })
  }
/><input
  type="number"
  placeholder="Stock Mínimo"
  className="w-full border rounded-xl p-3"
  value={form.stock_minimo}
  onChange={(e) =>
    setForm({
      ...form,
      stock_minimo: Number(e.target.value),
    })
  }
/><input
  type="number"
  step="0.01"
  placeholder="Costo Unitario"
  className="w-full border rounded-xl p-3"
  value={form.costo_unitario}
  onChange={(e) =>
    setForm({
      ...form,
      costo_unitario: Number(e.target.value),
    })
  }
/><input
  placeholder="Proveedor"
  className="w-full border rounded-xl p-3"
  value={form.proveedor}
  onChange={(e) =>
    setForm({
      ...form,
      proveedor: e.target.value,
    })
  }
/><input
  placeholder="Proveedor URL"
  className="w-full border rounded-xl p-3"
  value={form.proveedor_url}
  onChange={(e) =>
    setForm({
      ...form,
      proveedor_url: e.target.value,
    })
  }
/><textarea
  placeholder="Notas"
  className="w-full border rounded-xl p-3"
  rows={4}
  value={form.notas}
  onChange={(e) =>
    setForm({
      ...form,
      notas: e.target.value,
    })
  }
/>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-3 border rounded-xl"
              >
                Cancelar
              </button>

              <button
                onClick={guardarProducto}
                className="px-5 py-3 bg-[#7a0000] text-white rounded-xl"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )} 
    </main>
  )
}