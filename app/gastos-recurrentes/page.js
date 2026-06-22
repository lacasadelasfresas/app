'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Plus,
  Repeat,
  Trash2,
  WalletCards,
} from 'lucide-react'

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`
}

function getLastDayOfMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

export default function GastosRecurrentesPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    nombre: '',
    categoria: 'Operación',
    tipo_gasto: 'Fijo',
    proveedor: '',
    metodo_pago: 'Efectivo',
    monto: '',
    dia_generacion: 1,
    requiere_revision: false,
  })

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    setLoading(true)

    const { data, error } = await supabase
      .from('gastos_recurrentes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error cargando gastos recurrentes:', error)
      setLoading(false)
      return
    }

    setItems(data || [])
    setLoading(false)
  }

  function resetForm() {
    setForm({
      nombre: '',
      categoria: 'Operación',
      tipo_gasto: 'Fijo',
      proveedor: '',
      metodo_pago: 'Efectivo',
      monto: '',
      dia_generacion: 1,
      requiere_revision: false,
    })
  }

  async function guardar() {
    if (!form.nombre.trim() || !form.monto) {
      alert('Agrega el nombre y monto del gasto recurrente.')
      return
    }

    setSaving(true)

    const payload = {
      nombre: form.nombre.trim(),
      categoria: form.categoria,
      tipo_gasto: form.tipo_gasto,
      proveedor: form.proveedor.trim() || null,
      metodo_pago: form.metodo_pago,
      monto: Number(form.monto || 0),
      dia_generacion: Number(form.dia_generacion || 1),
      requiere_revision: Boolean(form.requiere_revision),
      activo: true,
    }

    const { error } = await supabase
      .from('gastos_recurrentes')
      .insert([payload])

    if (error) {
      console.error('Error guardando gasto recurrente:', error)
      alert('No se pudo guardar el gasto recurrente.')
      setSaving(false)
      return
    }

    resetForm()
    await fetchItems()
    setSaving(false)
  }

  async function generarGastosDelMes() {
    const confirmar = confirm(
      '¿Generar los gastos recurrentes activos para este mes?'
    )

    if (!confirmar) return

    setSaving(true)

    const hoy = new Date()
    const year = hoy.getFullYear()
    const monthNumber = hoy.getMonth() + 1
    const month = String(monthNumber).padStart(2, '0')
    const periodo = `${year}-${month}`

    const activos = items.filter((item) => item.activo)

    if (activos.length === 0) {
      alert('No hay gastos recurrentes activos para generar.')
      setSaving(false)
      return
    }

    const lastDay = getLastDayOfMonth(year, monthNumber)

    let creados = 0
    let omitidos = 0

    for (const item of activos) {
      const day = Math.min(
        Number(item.dia_generacion || 1),
        lastDay
      )

      const fecha = `${periodo}-${String(day).padStart(2, '0')}`

      const { data: existente, error: errorExistente } = await supabase
        .from('gastos')
        .select('id')
        .eq('concepto', item.nombre)
        .eq('proveedor', item.proveedor || '')
        .gte('fecha', `${periodo}-01`)
        .lte('fecha', `${periodo}-${lastDay}`)
        .maybeSingle()

      if (errorExistente) {
        console.error(
          'Error validando gasto existente:',
          errorExistente
        )
      }

      if (existente) {
        omitidos++
        continue
      }

      const payload = {
        fecha,
        categoria: item.categoria,
        tipo_gasto: item.tipo_gasto || 'Fijo',
        concepto: item.nombre,
        proveedor: item.proveedor || null,
        metodo_pago: item.metodo_pago || 'Efectivo',
        estado_pago: 'Pendiente',
        monto: Number(item.monto || 0),
        notas: item.requiere_revision
          ? 'Gasto recurrente generado para revisión mensual.'
          : 'Gasto recurrente generado automáticamente.',
      }

      const { error } = await supabase
        .from('gastos')
        .insert([payload])

      if (error) {
        console.error(
          'Error generando gasto mensual:',
          error
        )
        continue
      }

      creados++
    }

    alert(
      `Proceso terminado. Creados: ${creados}. Omitidos: ${omitidos}.`
    )

    setSaving(false)
  }

  async function desactivar(item) {
    const confirmar = confirm(
      '¿Desactivar este gasto recurrente?'
    )

    if (!confirmar) return

    const { error } = await supabase
      .from('gastos_recurrentes')
      .update({ activo: false })
      .eq('id', item.id)

    if (error) {
      console.error('Error desactivando gasto:', error)
      alert('No se pudo desactivar este gasto.')
      return
    }

    await fetchItems()
  }

  const activos = useMemo(
    () => items.filter((item) => item.activo),
    [items]
  )

  const montoMensual = useMemo(
    () =>
      activos.reduce(
        (total, item) => total + Number(item.monto || 0),
        0
      ),
    [activos]
  )

  const pendientesRevision = useMemo(
    () =>
      activos.filter((item) => item.requiere_revision).length,
    [activos]
  )

  const inputClass =
    'w-full rounded-xl border border-[#efcaca] px-4 py-3 text-sm outline-none focus:border-[#8c0303] bg-white'

  return (
    <main className="min-h-screen bg-[#fcf8f8]">
      <header className="bg-white border-b border-[#f1dede] px-5 md:px-8 py-3 md:h-[82px] md:py-0 md:flex md:items-center">
        <div className="w-full max-w-none">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
                Control financiero
              </p>

              <h1 className="mt-1 text-[21px] md:text-[23px] font-bold text-[#7a0000] leading-tight">
                Gastos recurrentes
              </h1>

              <p className="mt-1 text-xs md:text-sm text-[#b07a7a]">
                Configura costos fijos o repetitivos del negocio.
              </p>
            </div>

            <button
              type="button"
              onClick={generarGastosDelMes}
              disabled={saving}
              className="w-full sm:w-auto bg-[#8c0303] text-white px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm whitespace-nowrap shadow-sm disabled:opacity-60"
            >
              <Repeat size={16} />
              {saving
                ? 'Procesando...'
                : 'Generar gastos del mes'}
            </button>
          </div>
        </div>
      </header>

      <section className="max-w-[1500px] mx-auto px-4 md:px-8 py-5 md:py-7">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <article className="bg-white border border-[#f3dede] rounded-[24px] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
                  Gastos activos
                </p>

                <p className="mt-3 text-[30px] font-bold text-[#7a0000] leading-none">
                  {activos.length}
                </p>
              </div>

              <div className="w-10 h-10 rounded-2xl bg-[#fff1f1] text-[#8c0303] flex items-center justify-center">
                <Repeat size={18} />
              </div>
            </div>
          </article>

          <article className="bg-white border border-[#f3dede] rounded-[24px] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
                  Costo mensual estimado
                </p>

                <p className="mt-3 text-[30px] font-bold text-[#7a0000] leading-none">
                  {formatCurrency(montoMensual)}
                </p>
              </div>

              <div className="w-10 h-10 rounded-2xl bg-[#fff1f1] text-[#8c0303] flex items-center justify-center">
                <WalletCards size={18} />
              </div>
            </div>
          </article>

          <article className="bg-white border border-[#f3dede] rounded-[24px] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
                  Revisión mensual
                </p>

                <p className="mt-3 text-[30px] font-bold text-[#7a0000] leading-none">
                  {pendientesRevision}
                </p>
              </div>

              <div className="w-10 h-10 rounded-2xl bg-[#fff1f1] text-[#8c0303] flex items-center justify-center">
                <CircleAlert size={18} />
              </div>
            </div>
          </article>
        </div>

        <section className="grid grid-cols-1 xl:grid-cols-[390px_1fr] gap-5 mt-5">
          <article className="bg-white border border-[#f3dede] rounded-[28px] p-5 md:p-6 h-fit">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#fff1f1] text-[#8c0303] flex items-center justify-center shrink-0">
                <Plus size={18} />
              </div>

              <div>
                <h2 className="text-[18px] md:text-[20px] font-bold text-[#7a0000] leading-tight">
                  Nuevo gasto recurrente
                </h2>

                <p className="text-xs md:text-sm text-[#b07a7a] mt-1">
                  Agrega un costo que se repite cada mes.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs text-[#b07a7a] mb-2">
                  Nombre del gasto
                </label>

                <input
                  className={inputClass}
                  placeholder="Ej. Internet, alquiler, plataforma..."
                  value={form.nombre}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      nombre: event.target.value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs text-[#b07a7a] mb-2">
                    Categoría
                  </label>

                  <select
                    className={inputClass}
                    value={form.categoria}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        categoria: event.target.value,
                      })
                    }
                  >
                    <option>Materia prima</option>
                    <option>Packaging</option>
                    <option>Delivery</option>
                    <option>Marketing</option>
                    <option>Operación</option>
                    <option>Equipos</option>
                    <option>Servicios</option>
                    <option>Comisiones plataformas</option>
                    <option>Otros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-[#b07a7a] mb-2">
                    Tipo de gasto
                  </label>

                  <select
                    className={inputClass}
                    value={form.tipo_gasto}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        tipo_gasto: event.target.value,
                      })
                    }
                  >
                    <option>Fijo</option>
                    <option>Variable</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#b07a7a] mb-2">
                  Proveedor
                </label>

                <input
                  className={inputClass}
                  placeholder="Ej. Tigo, Naturgy, proveedor..."
                  value={form.proveedor}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      proveedor: event.target.value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs text-[#b07a7a] mb-2">
                    Método de pago
                  </label>

                  <select
                    className={inputClass}
                    value={form.metodo_pago}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        metodo_pago: event.target.value,
                      })
                    }
                  >
                    <option>Efectivo</option>
                    <option>Yappy</option>
                    <option>ACH</option>
                    <option>Tarjeta</option>
                    <option>Transferencia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-[#b07a7a] mb-2">
                    Monto mensual
                  </label>

                  <input
                    className={inputClass}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={form.monto}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        monto: event.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#b07a7a] mb-2">
                  Día de generación mensual
                </label>

                <input
                  className={inputClass}
                  type="number"
                  min="1"
                  max="28"
                  value={form.dia_generacion}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      dia_generacion: event.target.value,
                    })
                  }
                />
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-[#efcaca] px-4 py-3 text-sm text-[#7a0000] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.requiere_revision}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      requiere_revision: event.target.checked,
                    })
                  }
                />

                Requiere revisión mensual
              </label>

              <button
                type="button"
                onClick={guardar}
                disabled={saving}
                className="w-full rounded-xl bg-[#8c0303] text-white py-3 font-semibold text-sm hover:bg-[#6f0202] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <Plus size={17} />
                {saving
                  ? 'Guardando...'
                  : 'Guardar gasto recurrente'}
              </button>
            </div>
          </article>

          <section className="bg-white border border-[#f3dede] rounded-[28px] overflow-hidden">
            <div className="px-5 md:px-6 py-5 border-b border-[#f3dede]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#fff1f1] text-[#8c0303] flex items-center justify-center shrink-0">
                  <CalendarDays size={18} />
                </div>

                <div>
                  <h2 className="text-[18px] md:text-[20px] font-bold text-[#7a0000] leading-tight">
                    Gastos configurados
                  </h2>

                  <p className="text-xs md:text-sm text-[#b07a7a] mt-1">
                    Consulta los costos que se generan mensualmente.
                  </p>
                </div>
              </div>
            </div>

            <div className="md:hidden divide-y divide-[#f3dede]">
              {loading ? (
                <div className="px-5 py-10 text-center text-sm text-[#b07a7a]">
                  Cargando gastos recurrentes...
                </div>
              ) : items.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-[#b07a7a]">
                  No hay gastos recurrentes registrados.
                </div>
              ) : (
                items.map((item) => (
                  <article key={item.id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[18px] font-bold text-[#7a0000] leading-tight break-words">
                          {item.nombre}
                        </p>

                        <p className="text-sm text-[#b07a7a] mt-2">
                          {item.categoria} · {item.tipo_gasto || 'Fijo'}
                        </p>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${
                          item.activo
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {item.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="rounded-2xl bg-[#fffafa] border border-[#f3dede] p-3">
                        <p className="text-[10px] uppercase tracking-[0.13em] text-[#b9a0a0]">
                          Monto
                        </p>

                        <p className="mt-2 text-lg font-bold text-[#7a0000]">
                          {formatCurrency(item.monto)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#fffafa] border border-[#f3dede] p-3">
                        <p className="text-[10px] uppercase tracking-[0.13em] text-[#b9a0a0]">
                          Día mensual
                        </p>

                        <p className="mt-2 text-lg font-bold text-[#7a0000]">
                          Día {item.dia_generacion}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1 text-sm text-[#b07a7a]">
                      <p>
                        <span className="font-semibold text-[#7a0000]">
                          Proveedor:
                        </span>{' '}
                        {item.proveedor || 'No registrado'}
                      </p>

                      <p>
                        <span className="font-semibold text-[#7a0000]">
                          Pago:
                        </span>{' '}
                        {item.metodo_pago || 'No registrado'}
                      </p>

                      <p>
                        <span className="font-semibold text-[#7a0000]">
                          Revisión:
                        </span>{' '}
                        {item.requiere_revision ? 'Sí' : 'No'}
                      </p>
                    </div>

                    {item.activo && (
                      <button
                        type="button"
                        onClick={() => desactivar(item)}
                        className="mt-4 w-full rounded-xl border border-[#efcaca] px-4 py-3 text-sm font-semibold text-[#8c0303] flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} />
                        Desactivar gasto
                      </button>
                    )}
                  </article>
                ))
              )}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-[950px] w-full text-sm">
                <thead className="bg-[#f8eeee] text-[#b07a7a] uppercase text-[11px] tracking-[0.15em]">
                  <tr>
                    <th className="py-4 px-5 text-left">Nombre</th>
                    <th className="py-4 px-5 text-left">Categoría</th>
                    <th className="py-4 px-5 text-left">Proveedor</th>
                    <th className="py-4 px-5 text-left">Monto</th>
                    <th className="py-4 px-5 text-left">Día</th>
                    <th className="py-4 px-5 text-left">Estado</th>
                    <th className="py-4 px-5 text-left">Revisión</th>
                    <th className="py-4 px-5 text-right">Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="py-10 text-center text-[#b07a7a]"
                      >
                        Cargando gastos recurrentes...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="py-10 text-center text-[#b07a7a]"
                      >
                        No hay gastos recurrentes registrados.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-[#f3dede] hover:bg-[#fffafa]"
                      >
                        <td className="py-4 px-5 font-semibold text-[#2e2e2e]">
                          {item.nombre}
                        </td>

                        <td className="py-4 px-5">
                          <p>{item.categoria}</p>
                          <p className="text-xs text-[#b07a7a] mt-1">
                            {item.tipo_gasto || 'Fijo'}
                          </p>
                        </td>

                        <td className="py-4 px-5">
                          {item.proveedor || '-'}
                        </td>

                        <td className="py-4 px-5 font-semibold text-[#8c0303]">
                          {formatCurrency(item.monto)}
                        </td>

                        <td className="py-4 px-5">
                          Día {item.dia_generacion}
                        </td>

                        <td className="py-4 px-5">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              item.activo
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {item.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>

                        <td className="py-4 px-5">
                          {item.requiere_revision ? 'Sí' : 'No'}
                        </td>

                        <td className="py-4 px-5 text-right">
                          {item.activo && (
                            <button
                              type="button"
                              onClick={() => desactivar(item)}
                              className="w-10 h-10 rounded-xl border border-[#efcaca] text-[#8c0303] hover:bg-[#fff1f1] inline-flex items-center justify-center"
                              title="Desactivar gasto"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>

        <section className="mt-5 rounded-[24px] bg-white border border-[#f3dede] p-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#fff1f1] text-[#8c0303] flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>

          <p className="text-sm text-[#b07a7a]">
            Generar los gastos del mes crea registros pendientes en Finanzas.
            El sistema evita duplicar gastos con el mismo concepto y proveedor
            dentro del mismo mes.
          </p>
        </section>
      </section>
    </main>
  )
}