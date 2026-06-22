'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import {
  ArrowLeft,
  PackagePlus,
  Save,
  WalletCards,
} from 'lucide-react'

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`
}

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

  function handleChange(event) {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
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
        sku: form.sku.trim() || null,
        nombre: form.nombre.trim(),
        categoria: form.categoria.trim() || null,
        unidad: form.unidad.trim() || null,
        stock_actual: Number(form.stock_actual || 0),
        stock_minimo: Number(form.stock_minimo || 0),
        costo_unitario: Number(form.costo_unitario || 0),
        proveedor: form.proveedor.trim() || null,
        proveedor_url: form.proveedor_url.trim() || null,
        notas: form.notas.trim() || null,
      },
    ])

    if (error) {
      console.error(error)
      alert('No se pudo guardar el producto.')
      setSaving(false)
      return
    }

    alert('Producto guardado correctamente.')
    router.push('/inventario')
  }

  const inputClass =
    'w-full rounded-xl border border-[#efcaca] bg-white px-4 py-3 text-sm text-[#2e2e2e] outline-none transition focus:border-[#8c0303] focus:ring-2 focus:ring-[#fff1f1]'

  const stockActual = Number(form.stock_actual || 0)
  const stockMinimo = Number(form.stock_minimo || 0)

  const isLowStock =
    stockActual <= stockMinimo && stockMinimo > 0

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
                Nuevo producto
              </h1>

              <p className="mt-1 text-xs md:text-sm text-[#b07a7a]">
                Agrega un nuevo insumo o producto para controlar tu inventario.
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
                <PackagePlus size={19} />
              </div>

              <div>
                <h2 className="text-[18px] md:text-[20px] font-bold text-[#7a0000]">
                  Información del producto
                </h2>

                <p className="text-xs md:text-sm text-[#b07a7a] mt-1">
                  Completa los datos necesarios para mantener el inventario ordenado.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-7">
              <div>
                <label className="block text-xs font-medium text-[#b07a7a] mb-2">
                  SKU o código interno
                </label>

                <input
                  name="sku"
                  value={form.sku}
                  onChange={handleChange}
                  placeholder="Ej. FRS-001"
                  className={inputClass}
                />
              </div>

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
                  placeholder="Ej. Frutas, toppings, empaque..."
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

              <div className="md:col-span-2">
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
                placeholder="Detalles de presentación, fecha de compra, observaciones o condiciones."
                rows={5}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 mt-7 pt-6 border-t border-[#f3dede]">
              <button
                type="button"
                onClick={() => router.push('/inventario')}
                disabled={saving}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-[#efcaca] text-[#8c0303] font-semibold text-sm hover:bg-[#fff5f5] disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={guardarProducto}
                disabled={saving}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#8c0303] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#720000] disabled:opacity-60"
              >
                <Save size={17} />
                {saving ? 'Guardando...' : 'Guardar producto'}
              </button>
            </div>
          </section>

          <aside className="space-y-5">
            <section className="bg-white border border-[#f3dede] rounded-[28px] p-5">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
                Vista previa de inventario
              </p>

              <p className="mt-3 text-[29px] font-bold text-[#7a0000]">
                {stockActual}
              </p>

              <p className="text-sm text-[#b07a7a] mt-1">
                {form.unidad || 'unidades'} disponibles
              </p>

              <div
                className={`mt-5 rounded-2xl px-4 py-3 text-sm font-semibold ${
                  isLowStock
                    ? 'bg-red-50 text-red-600'
                    : 'bg-[#fff1f1] text-[#8c0303]'
                }`}
              >
                {isLowStock
                  ? 'Quedará en nivel mínimo'
                  : 'Inventario inicial disponible'}
              </div>

              <div className="mt-4 pt-4 border-t border-[#f3dede] text-sm text-[#b07a7a]">
                <p>
                  Stock mínimo:{' '}
                  <strong className="text-[#7a0000]">
                    {stockMinimo}
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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#fff1f1] text-[#8c0303] flex items-center justify-center">
                  <WalletCards size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-[#7a0000]">
                    Recomendación
                  </p>

                  <p className="text-xs text-[#b07a7a] mt-1">
                    Registra el costo real de compra para calcular márgenes con precisión.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  )
}