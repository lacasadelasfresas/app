'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import {
  ArrowLeft,
  ExternalLink,
  Package,
  Save,
  Trash2,
} from 'lucide-react'

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`
}

export default function EditarProductoPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

    if (error || !data) {
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

  function handleChange(event) {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  async function actualizarProducto() {
    if (!form.nombre.trim()) {
      alert('Ingresa el nombre del producto.')
      return
    }

    setSaving(true)

    const { error } = await supabase
      .from('inventario')
      .update({
        nombre: form.nombre.trim(),
        categoria: form.categoria.trim() || null,
        unidad: form.unidad.trim() || null,
        stock_actual: Number(form.stock_actual || 0),
        stock_minimo: Number(form.stock_minimo || 0),
        costo_unitario: Number(form.costo_unitario || 0),
        proveedor: form.proveedor.trim() || null,
        proveedor_url: form.proveedor_url.trim() || null,
        notas: form.notas.trim() || null,
      })
      .eq('id', id)

    if (error) {
      console.error(error)
      alert('No se pudo actualizar el producto.')
      setSaving(false)
      return
    }

    alert('Producto actualizado correctamente.')
    router.push('/inventario')
  }

  async function eliminarProducto() {
    const confirmar = confirm(
      '¿Estás segura de que deseas eliminar este producto? Esta acción no se puede deshacer.'
    )

    if (!confirmar) return

    setDeleting(true)

    const { error } = await supabase
      .from('inventario')
      .delete()
      .eq('id', id)

    if (error) {
      console.error(error)
      alert('No se pudo eliminar el producto.')
      setDeleting(false)
      return
    }

    alert('Producto eliminado correctamente.')
    router.push('/inventario')
  }

  const inputClass =
    'w-full rounded-xl border border-[#efcaca] bg-white px-4 py-3 text-sm text-[#2e2e2e] outline-none transition focus:border-[#8c0303] focus:ring-2 focus:ring-[#fff1f1]'

  const isLowStock =
    Number(form.stock_actual || 0) <= Number(form.stock_minimo || 0)

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fcf8f8]">
        <header className="bg-white border-b border-[#f1dede] px-5 md:px-8 py-3 md:h-[82px] md:py-0 md:flex md:items-center">
          <div className="w-full max-w-none">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
              Inventario
            </p>

            <h1 className="mt-1 text-[21px] md:text-[23px] font-bold text-[#7a0000] leading-tight">
              Editar producto
            </h1>
          </div>
        </header>

        <section className="px-4 md:px-8 py-8">
          <p className="text-sm text-[#b07a7a]">
            Cargando información del producto...
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#fcf8f8]">
      <header className="bg-white border-b border-[#f1dede] px-5 md:px-8 py-3 md:h-[82px] md:py-0 md:flex md:items-center">
        <div className="w-full max-w-none">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
                Inventario
              </p>

              <h1 className="mt-1 text-[21px] md:text-[23px] font-bold text-[#7a0000] leading-tight">
                Editar producto
              </h1>

              <p className="mt-1 text-xs md:text-sm text-[#b07a7a]">
                Actualiza la información, stock y datos del proveedor.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push('/inventario')}
              className="w-full sm:w-auto border border-[#efcaca] bg-white px-4 py-2.5 rounded-xl text-[#8c0303] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#fff5f5]"
            >
              <ArrowLeft size={16} />
              Volver a inventario
            </button>
          </div>
        </div>
      </header>

      <section className="max-w-[1300px] mx-auto px-4 md:px-8 py-5 md:py-7">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
          <section className="bg-white border border-[#f3dede] rounded-[28px] p-5 md:p-7">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#fff1f1] text-[#8c0303] flex items-center justify-center shrink-0">
                <Package size={19} />
              </div>

              <div>
                <h2 className="text-[18px] md:text-[20px] font-bold text-[#7a0000]">
                  Información del producto
                </h2>

                <p className="text-xs md:text-sm text-[#b07a7a] mt-1">
                  Mantén esta información actualizada para controlar mejor tu inventario.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-7">
              <div>
                <label className="block text-xs font-medium text-[#b07a7a] mb-2">
                  Nombre del producto
                </label>

                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej. Fresas congeladas"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#b07a7a] mb-2">
                  Categoría
                </label>

                <input
                  name="categoria"
                  value={form.categoria}
                  onChange={handleChange}
                  placeholder="Ej. Frutas, empaque, topping..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#b07a7a] mb-2">
                  Unidad de medida
                </label>

                <input
                  name="unidad"
                  value={form.unidad}
                  onChange={handleChange}
                  placeholder="Ej. libras, unidades, ml..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#b07a7a] mb-2">
                  Costo unitario
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="costo_unitario"
                  value={form.costo_unitario}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#b07a7a] mb-2">
                  Stock actual
                </label>

                <input
                  type="number"
                  min="0"
                  name="stock_actual"
                  value={form.stock_actual}
                  onChange={handleChange}
                  placeholder="0"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#b07a7a] mb-2">
                  Stock mínimo
                </label>

                <input
                  type="number"
                  min="0"
                  name="stock_minimo"
                  value={form.stock_minimo}
                  onChange={handleChange}
                  placeholder="0"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-7 pt-6 border-t border-[#f3dede]">
              <h3 className="text-[16px] font-bold text-[#7a0000]">
                Datos del proveedor
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-medium text-[#b07a7a] mb-2">
                    Proveedor
                  </label>

                  <input
                    name="proveedor"
                    value={form.proveedor}
                    onChange={handleChange}
                    placeholder="Nombre del proveedor"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#b07a7a] mb-2">
                    Enlace del proveedor
                  </label>

                  <input
                    name="proveedor_url"
                    value={form.proveedor_url}
                    onChange={handleChange}
                    placeholder="https://..."
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="mt-7 pt-6 border-t border-[#f3dede]">
              <label className="block text-xs font-medium text-[#b07a7a] mb-2">
                Notas
              </label>

              <textarea
                name="notas"
                value={form.notas}
                onChange={handleChange}
                placeholder="Información adicional del producto, fecha de compra, presentación o condiciones."
                rows={5}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 mt-7 pt-6 border-t border-[#f3dede]">
              <button
                type="button"
                onClick={() => router.push('/inventario')}
                disabled={saving || deleting}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-[#efcaca] text-[#8c0303] font-semibold text-sm hover:bg-[#fff5f5] disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={actualizarProducto}
                disabled={saving || deleting}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#8c0303] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#720000] disabled:opacity-60"
              >
                <Save size={17} />
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </section>

          <aside className="space-y-5">
            <section className="bg-white border border-[#f3dede] rounded-[28px] p-5">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
                Estado de inventario
              </p>

              <p className="mt-3 text-[28px] font-bold text-[#7a0000]">
                {Number(form.stock_actual || 0)}
              </p>

              <p className="text-sm text-[#b07a7a] mt-1">
                {form.unidad || 'unidades'} disponibles
              </p>

              <div
                className={`mt-5 rounded-2xl px-4 py-3 text-sm font-semibold ${
                  isLowStock
                    ? 'bg-red-50 text-red-600'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {isLowStock
                  ? 'Stock mínimo o agotado'
                  : 'Inventario disponible'}
              </div>

              <div className="mt-4 pt-4 border-t border-[#f3dede] text-sm text-[#b07a7a]">
                <p>
                  Stock mínimo:{' '}
                  <strong className="text-[#7a0000]">
                    {Number(form.stock_minimo || 0)}
                  </strong>
                </p>

                <p className="mt-2">
                  Costo unitario:{' '}
                  <strong className="text-[#7a0000]">
                    {formatCurrency(form.costo_unitario)}
                  </strong>
                </p>
              </div>
            </section>

            <section className="bg-white border border-[#f3dede] rounded-[28px] p-5">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
                Acciones adicionales
              </p>

              {form.proveedor_url ? (
                <a
                  href={form.proveedor_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 w-full rounded-xl border border-[#efcaca] px-4 py-3 text-sm font-semibold text-[#8c0303] flex items-center justify-center gap-2 hover:bg-[#fff5f5]"
                >
                  <ExternalLink size={16} />
                  Ver proveedor
                </a>
              ) : (
                <div className="mt-4 rounded-xl bg-[#fffafa] px-4 py-3 text-sm text-[#b07a7a]">
                  No hay enlace de proveedor registrado.
                </div>
              )}
            </section>

            <section className="bg-white border border-red-100 rounded-[28px] p-5">
              <p className="text-[10px] uppercase tracking-[0.16em] text-red-400">
                Zona de peligro
              </p>

              <p className="mt-3 text-sm text-[#b07a7a] leading-relaxed">
                Eliminar un producto no se puede deshacer. Verifica que ya no esté siendo utilizado en recetas activas.
              </p>

              <button
                type="button"
                onClick={eliminarProducto}
                disabled={saving || deleting}
                className="mt-5 w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white flex items-center justify-center gap-2 hover:bg-red-700 disabled:opacity-60"
              >
                <Trash2 size={16} />
                {deleting ? 'Eliminando...' : 'Eliminar producto'}
              </button>
            </section>
          </aside>
        </div>
      </section>
    </main>
  )
}