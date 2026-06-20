'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

const CAMPOS_OCULTOS = new Set([
  'id',
  'created_at',
  'updated_at',
  'factura_path',
  'factura_nombre',
])

const ETIQUETAS_CAMPOS = {
  nombre: 'Nombre',
  producto: 'Producto',
  concepto: 'Concepto',
  monto: 'Monto',
  monto_pago: 'Monto pagado',
  categoria: 'Categoría',
  tipo_gasto: 'Tipo de gasto',
  estado_pago: 'Estado de pago',
  metodo_pago: 'Método de pago',
  proveedor: 'Proveedor',
  cliente: 'Cliente',
  whatsapp: 'WhatsApp',
  email: 'Email',
  observaciones: 'Observaciones',
  notas: 'Notas',
  cantidad: 'Cantidad',
  stock_actual: 'Stock actual',
  stock_minimo: 'Stock mínimo',
  costo_unitario: 'Costo unitario',
  precio_venta: 'Precio de venta',
  activo: 'Activo',
  editado_por: 'Editado por',
  editado_en: 'Editado en',
  fecha: 'Fecha',
  sucursal: 'Sucursal',
  tipo_pedido: 'Tipo de pedido',
  requiere_revision: 'Requiere revisión',
  dia_generacion: 'Día de generación',
}

function etiquetaCampo(campo) {
  return (
    ETIQUETAS_CAMPOS[campo] ||
    campo.replace(/_/g, ' ').replace(/\b\w/g, (letra) => letra.toUpperCase())
  )
}

function formatearValor(valor) {
  if (valor === null || valor === undefined || valor === '') {
    return '—'
  }

  if (typeof valor === 'boolean') {
    return valor ? 'Sí' : 'No'
  }

  if (typeof valor === 'object') {
    return JSON.stringify(valor)
  }

  return String(valor)
}

function DetalleCambios({ item }) {
  const antes = item.datos_antes
  const despues = item.datos_despues

  const esCreacion = !antes && !!despues
  const esEliminacion = !!antes && !despues
  const esEdicion = !!antes && !!despues

  if (!esCreacion && !esEliminacion && !esEdicion) {
    return <span className="text-[#b07a7a]">—</span>
  }

  let titulo = 'Ver cambios'
  let campos = []

  if (esCreacion) {
    titulo = 'Ver registro creado'

    campos = Object.keys(despues)
      .filter((campo) => !CAMPOS_OCULTOS.has(campo))
      .map((campo) => ({
        campo,
        antes: null,
        despues: despues[campo],
      }))
  }

  if (esEliminacion) {
    titulo = 'Ver registro eliminado'

    campos = Object.keys(antes)
      .filter((campo) => !CAMPOS_OCULTOS.has(campo))
      .map((campo) => ({
        campo,
        antes: antes[campo],
        despues: null,
      }))
  }

  if (esEdicion) {
    const todosLosCampos = [
      ...new Set([...Object.keys(antes), ...Object.keys(despues)]),
    ]

    campos = todosLosCampos
      .filter((campo) => !CAMPOS_OCULTOS.has(campo))
      .filter(
        (campo) =>
          JSON.stringify(antes[campo]) !== JSON.stringify(despues[campo])
      )
      .map((campo) => ({
        campo,
        antes: antes[campo],
        despues: despues[campo],
      }))
  }

  if (campos.length === 0) {
    return <span className="text-[#b07a7a]">Sin cambios visibles</span>
  }

  return (
    <details>
      <summary className="cursor-pointer text-[#8c0303] font-semibold">
        {titulo}
      </summary>

      <div className="mt-3 rounded-xl border border-[#f3dede] bg-[#fffafa] p-4 text-xs space-y-2">
        {campos.map((cambio) => (
          <div
            key={cambio.campo}
            className="border-b border-[#f5e5e5] pb-2 last:border-b-0"
          >
            <p className="font-semibold text-[#8c0303]">
              {etiquetaCampo(cambio.campo)}
            </p>

            {esCreacion && (
              <p>
                <strong>Nuevo valor:</strong>{' '}
                {formatearValor(cambio.despues)}
              </p>
            )}

            {esEliminacion && (
              <p>
                <strong>Valor eliminado:</strong>{' '}
                {formatearValor(cambio.antes)}
              </p>
            )}

            {esEdicion && (
              <>
                <p>
                  <strong>Antes:</strong> {formatearValor(cambio.antes)}
                </p>

                <p>
                  <strong>Después:</strong> {formatearValor(cambio.despues)}
                </p>
              </>
            )}
          </div>
        ))}
      </div>
    </details>
  )
}

export default function AuditoriaPage() {
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAuditoria()
  }, [])

  async function fetchAuditoria() {
    setLoading(true)

    const { data, error } = await supabase
      .from('auditoria')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error cargando auditoría:', error)
      setLoading(false)
      return
    }

    setRegistros(data || [])
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#fcf8f8]">
      <div className="bg-white border-b border-[#f1dede] px-10 h-[86px] flex items-center">
        <div>
          <h1 className="text-[30px] text-[#7a0000] ivy leading-none">
            Auditoría
          </h1>

          <p className="text-sm text-[#b07a7a] mt-2">
            Registro de movimientos realizados dentro del sistema.
          </p>
        </div>
      </div>

      <section className="p-8">
        <div className="bg-white border border-[#f3dede] rounded-[28px] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#f8eeee] text-[#b07a7a] uppercase text-[11px] tracking-[0.15em]">
              <tr>
                <th className="py-4 px-5 text-left">Fecha</th>
                <th className="py-4 px-5 text-left">Usuario</th>
                <th className="py-4 px-5 text-left">Rol</th>
                <th className="py-4 px-5 text-left">Acción</th>
                <th className="py-4 px-5 text-left">Módulo</th>
                <th className="py-4 px-5 text-left">Descripción</th>
                <th className="py-4 px-5 text-left">Cambios</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-[#b07a7a]">
                    Cargando auditoría...
                  </td>
                </tr>
              ) : registros.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-[#b07a7a]">
                    No hay movimientos registrados todavía.
                  </td>
                </tr>
              ) : (
                registros.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[#f3dede] hover:bg-[#fffafa]"
                  >
                    <td className="py-4 px-5 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleString('es-PA')}
                    </td>

                    <td className="py-4 px-5">
                      <p className="font-semibold text-[#2e2e2e]">
                        {item.usuario_nombre || 'Usuario'}
                      </p>

                      <p className="text-xs text-[#b07a7a]">
                        {item.usuario_email || 'Sin email'}
                      </p>
                    </td>

                    <td className="py-4 px-5">
                      <span className="px-3 py-1 rounded-full bg-[#fff1f1] text-[#8c0303] text-xs font-semibold">
                        {item.rol || 'Sin rol'}
                      </span>
                    </td>

                    <td className="py-4 px-5 font-semibold text-[#8c0303]">
                      {item.accion}
                    </td>

                    <td className="py-4 px-5">{item.modulo}</td>

                    <td className="py-4 px-5">
                      {item.descripcion || 'Sin descripción'}
                    </td>

                    <td className="py-4 px-5">
                      <DetalleCambios item={item} />
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