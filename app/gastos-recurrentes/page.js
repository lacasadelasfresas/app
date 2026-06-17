'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { registrarAuditoria } from '@/lib/auditoria'
import { Plus, Trash2 } from 'lucide-react'

export default function GastosRecurrentesPage() {
  const [items, setItems] = useState([])
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
    const { data, error } = await supabase
      .from('gastos_recurrentes')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setItems(data || [])
  }

  async function guardar() {
    if (!form.nombre || !form.monto) {
      alert('Agrega nombre y monto.')
      return
    }

    setSaving(true)

const payload = {
  ...form,
  monto: Number(form.monto || 0),
  dia_generacion: Number(form.dia_generacion || 1),
  requiere_revision: Boolean(form.requiere_revision),
  activo: true,
}

    const { data, error } = await supabase
      .from('gastos_recurrentes')
      .insert([payload])
      .select()
      .single()

    if (error) {
      console.error(error)
      alert('No se pudo guardar el gasto recurrente.')
      setSaving(false)
      return
    }

    await registrarAuditoria({
      accion: 'Crear gasto recurrente',
      modulo: 'Finanzas',
      descripcion: `Creó gasto recurrente: ${form.nombre} por $${form.monto}`,
      registroId: data?.id || null,
      datosDespues: data || null,
    })

    setForm({
      nombre: '',
      categoria: 'Operación',
      tipo_gasto: 'Fijo',
      proveedor: '',
      metodo_pago: 'Efectivo',
      monto: '',
      dia_generacion: 1,
    })

    await fetchItems()
    setSaving(false)
  }

  async function desactivar(item) {
    const confirmar = confirm('¿Desactivar este gasto recurrente?')
    if (!confirmar) return

    const { data, error } = await supabase
      .from('gastos_recurrentes')
      .update({ activo: false })
      .eq('id', item.id)
      .select()
      .single()

    if (error) {
      alert('No se pudo desactivar.')
      return
    }

    await registrarAuditoria({
      accion: 'Desactivar gasto recurrente',
      modulo: 'Finanzas',
      descripcion: `Desactivó gasto recurrente: ${item.nombre}`,
      registroId: item.id,
      datosAntes: item,
      datosDespues: data,
    })

    fetchItems()
  }

  const inputClass =
    'w-full rounded-xl border border-[#efcaca] px-4 py-3 text-sm outline-none focus:border-[#8c0303] bg-white'

  return (
    <main className="min-h-screen bg-[#fcf8f8]">
      <div className="bg-white border-b border-[#f1dede] px-10 h-[86px] flex items-center justify-between">
        <div>
          <h1 className="text-[30px] text-[#7a0000] ivy leading-none">
            Gastos recurrentes
          </h1>
          <p className="text-sm text-[#b07a7a] mt-2">
            Configura costos fijos o repetitivos del negocio.
          </p>
        </div>
      </div>

      <section className="p-8 grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
        <div className="bg-white border border-[#f3dede] rounded-[28px] p-6">
          <h2 className="text-2xl text-[#8c0303] ivy mb-4">
            Nuevo gasto recurrente
          </h2>

          <div className="space-y-4">
            <input
              className={inputClass}
              placeholder="Nombre, ej: Internet"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />

            <select
              className={inputClass}
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
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

            <input
              className={inputClass}
              placeholder="Proveedor"
              value={form.proveedor}
              onChange={(e) => setForm({ ...form, proveedor: e.target.value })}
            />

            <select
              className={inputClass}
              value={form.metodo_pago}
              onChange={(e) => setForm({ ...form, metodo_pago: e.target.value })}
            >
              <option>Efectivo</option>
              <option>Yappy</option>
              <option>ACH</option>
              <option>Tarjeta</option>
              <option>Transferencia</option>
            </select>

            <input
              className={inputClass}
              type="number"
              placeholder="Monto"
              value={form.monto}
              onChange={(e) => setForm({ ...form, monto: e.target.value })}
            />

            <input
              className={inputClass}
              type="number"
              min="1"
              max="28"
              placeholder="Día de generación"
              value={form.dia_generacion}
              onChange={(e) =>
                setForm({ ...form, dia_generacion: e.target.value })
              }
            />
            <label className="flex items-center gap-3 rounded-xl border border-[#efcaca] px-4 py-3 text-sm text-[#7a0000]">
  <input
    type="checkbox"
    checked={form.requiere_revision}
    onChange={(e) =>
      setForm({ ...form, requiere_revision: e.target.checked })
    }
  />
  Requiere revisión mensual
</label>

            <button
              onClick={guardar}
              disabled={saving}
              className="w-full rounded-xl bg-[#8c0303] text-white py-3 font-semibold hover:bg-[#6f0202] disabled:opacity-60"
            >
              <Plus size={16} className="inline mr-2" />
              {saving ? 'Guardando...' : 'Guardar recurrente'}
            </button>
          </div>
        </div>

        <div className="bg-white border border-[#f3dede] rounded-[28px] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#f8eeee] text-[#b07a7a] uppercase text-[11px] tracking-[0.15em]">
              <tr>
                <th className="py-4 px-5 text-left">Nombre</th>
                <th className="py-4 px-5 text-left">Categoría</th>
                <th className="py-4 px-5 text-left">Proveedor</th>
                <th className="py-4 px-5 text-left">Monto</th>
                <th className="py-4 px-5 text-left">Día</th>
                <th className="py-4 px-5 text-left">Estado</th>
                <th className="py-4 px-5 text-left">Acción</th>
             <th className="py-4 px-5 text-left">Revisión</th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-[#b07a7a]">
                    No hay gastos recurrentes registrados.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-[#f3dede]">
                    <td className="py-4 px-5 font-semibold">{item.nombre}</td>
                    <td className="py-4 px-5">{item.categoria}</td>
                    <td className="py-4 px-5">{item.proveedor || '-'}</td>
                    <td className="py-4 px-5 font-semibold">
                      ${Number(item.monto || 0).toFixed(2)}
                    </td>
                    <td className="py-4 px-5">Día {item.dia_generacion}</td>
                    <td className="py-4 px-5">
                      {item.activo ? 'Activo' : 'Inactivo'}
                    </td>
                    <td className="py-4 px-5">
                      {item.activo && (
                        <button
                          onClick={() => desactivar(item)}
                          className="rounded-xl border border-[#efcaca] px-3 py-2 text-[#8c0303]"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      {item.requiere_revision ? 'Sí' : 'No'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}