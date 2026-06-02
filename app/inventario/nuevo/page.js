'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function NuevoProductoPage() {
  const router = useRouter()

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
  })

  const [saving, setSaving] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  async function guardarProducto() {
    if (!form.nombre.trim()) {
      alert('El nombre del producto es obligatorio.')
      return
    }

    setSaving(true)

    const { error } = await supabase.from('inventario').insert([
      {
        sku: form.sku || null,
        nombre: form.nombre,
        categoria: form.categoria || null,
        unidad: form.unidad || null,
        stock_actual: Number(form.stock_actual || 0),
        stock_minimo: Number(form.stock_minimo || 0),
        costo_unitario: Number(form.costo_unitario || 0),
        proveedor: form.proveedor || null,
        proveedor_url: form.proveedor_url || null,
        notas: form.notas || null,
      },
    ])

    setSaving(false)

    if (error) {
      console.error(error)
      alert('Error al guardar el producto.')
      return
    }

    alert('Producto guardado correctamente.')
    router.push('/inventario')
  }

  return (
    <main className="min-h-screen bg-[#fcf8f8] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-[42px] text-[#7a0000] ivy leading-none">
            Nuevo Producto
          </h1>
          <p className="text-gray-500 mt-2">
            Agrega un nuevo producto al inventario.
          </p>
        </div>

        <div className="bg-white border border-[#f3dede] rounded-[30px] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input name="sku" value={form.sku} onChange={handleChange} placeholder="SKU" className="w-full border rounded-2xl px-4 py-3" />
            <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre del producto" className="w-full border rounded-2xl px-4 py-3" />
            <input name="categoria" value={form.categoria} onChange={handleChange} placeholder="Categoría" className="w-full border rounded-2xl px-4 py-3" />
            <input name="unidad" value={form.unidad} onChange={handleChange} placeholder="Unidad" className="w-full border rounded-2xl px-4 py-3" />
            <input type="number" name="stock_actual" value={form.stock_actual} onChange={handleChange} placeholder="Stock actual" className="w-full border rounded-2xl px-4 py-3" />
            <input type="number" name="stock_minimo" value={form.stock_minimo} onChange={handleChange} placeholder="Stock mínimo" className="w-full border rounded-2xl px-4 py-3" />
            <input type="number" step="0.01" name="costo_unitario" value={form.costo_unitario} onChange={handleChange} placeholder="Costo unitario" className="w-full border rounded-2xl px-4 py-3" />
            <input name="proveedor" value={form.proveedor} onChange={handleChange} placeholder="Proveedor" className="w-full border rounded-2xl px-4 py-3" />
            <input name="proveedor_url" value={form.proveedor_url} onChange={handleChange} placeholder="URL del proveedor" className="w-full border rounded-2xl px-4 py-3 md:col-span-2" />
            <textarea name="notas" value={form.notas} onChange={handleChange} placeholder="Notas" rows="4" className="w-full border rounded-2xl px-4 py-3 md:col-span-2" />
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <Link
              href="/inventario"
              className="px-6 py-3 border rounded-2xl"
            >
              Cancelar
            </Link>

            <button
              onClick={guardarProducto}
              disabled={saving}
              className="bg-[#7a0000] text-white px-6 py-3 rounded-2xl font-semibold"
            >
              {saving ? 'Guardando...' : 'Guardar Producto'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}