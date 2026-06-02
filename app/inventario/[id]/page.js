'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function EditarProductoPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    nombre: '',
    categoria: '',
    unidad: '',
    stock_actual: 0,
    stock_minimo: 0,
    costo_unitario: 0,
    proveedor: '',
    proveedor_url: '',
    notas: '',
  })

  useEffect(() => {
    if (id) {
      cargarProducto()
    }
  }, [id])

  async function cargarProducto() {
    setLoading(true)

    const { data, error } = await supabase
      .from('inventario')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error(error)
      alert('No se pudo cargar el producto.')
      router.push('/inventario')
      return
    }

    setForm({
      nombre: data.nombre || '',
      categoria: data.categoria || '',
      unidad: data.unidad || '',
      stock_actual: data.stock_actual || 0,
      stock_minimo: data.stock_minimo || 0,
      costo_unitario: data.costo_unitario || 0,
      proveedor: data.proveedor || '',
      proveedor_url: data.proveedor_url || '',
      notas: data.notas || '',
    })

    setLoading(false)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

async function actualizarProducto() {
  setSaving(true)

  const { error } = await supabase
    .from('inventario')
    .update({
      nombre: form.nombre,
      categoria: form.categoria,
      unidad: form.unidad,
      stock_actual: Number(form.stock_actual),
      stock_minimo: Number(form.stock_minimo),
      costo_unitario: Number(form.costo_unitario),
      proveedor: form.proveedor,
      proveedor_url: form.proveedor_url,
      notas: form.notas,
    })
    .eq('id', id)

  if (error) {
    console.error(error)
    alert('Error al actualizar el producto.')
    setSaving(false)
    return
  }

  alert('Producto actualizado correctamente.')
  router.push('/inventario')
}

async function eliminarProducto() {
  const confirmar = confirm(
    '¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.'
  )

  if (!confirmar) return

  setSaving(true)

  const { error } = await supabase
    .from('inventario')
    .delete()
    .eq('id', id)

  if (error) {
    console.error(error)
    alert('Error al eliminar el producto.')
    setSaving(false)
    return
  }

  alert('Producto eliminado correctamente.')
  router.push('/inventario')
}
  if (loading) {
    return (
      <main className="min-h-screen bg-[#fcf8f8] p-8">
        <div className="max-w-5xl mx-auto">
          <p className="text-gray-500">Cargando producto...</p>
        </div>
      </main>
    )
  }

  const inputClass =
    'w-full px-4 py-4 rounded-2xl border border-gray-300 outline-none'

  return (
    <main className="min-h-screen bg-[#fcf8f8] p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-[42px] text-[#7a0000] ivy leading-none">
          Editar Producto
        </h1>

        <p className="text-gray-500 mt-2 mb-8">
          Actualiza la información del producto.
        </p>

        <div className="bg-white border border-[#f3dede] rounded-[30px] p-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Nombre del producto"
              className={inputClass}
            />

            <input
              name="categoria"
              value={form.categoria}
              onChange={handleChange}
              placeholder="Categoría"
              className={inputClass}
            />

            <input
              name="unidad"
              value={form.unidad}
              onChange={handleChange}
              placeholder="Unidad"
              className={inputClass}
            />

            <input
              type="number"
              name="stock_actual"
              value={form.stock_actual}
              onChange={handleChange}
              placeholder="Stock actual"
              className={inputClass}
            />

            <input
              type="number"
              name="stock_minimo"
              value={form.stock_minimo}
              onChange={handleChange}
              placeholder="Stock mínimo"
              className={inputClass}
            />

            <input
              type="number"
              step="0.01"
              name="costo_unitario"
              value={form.costo_unitario}
              onChange={handleChange}
              placeholder="Costo unitario"
              className={inputClass}
            />

            <input
              name="proveedor"
              value={form.proveedor}
              onChange={handleChange}
              placeholder="Proveedor"
              className={inputClass}
            />

            <input
              name="proveedor_url"
              value={form.proveedor_url}
              onChange={handleChange}
              placeholder="URL del proveedor"
              className={inputClass}
            />
          </div>

          <textarea
            name="notas"
            value={form.notas}
            onChange={handleChange}
            placeholder="Notas"
            rows={5}
            className={`${inputClass} mt-6 resize-none`}
          />
<div className="flex justify-between items-center mt-8">
  <button
    onClick={eliminarProducto}
    disabled={saving}
    className="px-6 py-3 bg-red-600 text-white rounded-2xl font-semibold disabled:opacity-50"
  >
    Eliminar Producto
  </button>

  <div className="flex gap-4">
    <button
      onClick={() => router.push('/inventario')}
      className="px-6 py-3 border rounded-2xl"
    >
      Cancelar
    </button>

    <button
      onClick={actualizarProducto}
      disabled={saving}
      className="bg-[#8c0303] text-white px-6 py-3 rounded-2xl font-semibold disabled:opacity-50"
    >
      {saving ? 'Guardando...' : 'Guardar Cambios'}
    </button>
  </div>
</div>

        </div>
      </div>
    </main>
  )
}