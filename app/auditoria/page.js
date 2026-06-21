'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  Search,
  Filter,
  RefreshCw,
  X,
  ShieldCheck,
  CalendarDays,
  User,
  ArrowRight,
} from 'lucide-react'

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
  referencia: 'Referencia',
  motivo: 'Motivo',
  unidad: 'Unidad',
  tipo: 'Tipo',
  status: 'Estado',
  vendedor: 'Vendedor',
  descuento: 'Descuento',
  cupon: 'Cupón',
}

function etiquetaCampo(campo) {
  return (
    ETIQUETAS_CAMPOS[campo] ||
    campo
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letra) => letra.toUpperCase())
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

function formatearFecha(fecha) {
  if (!fecha) return 'Sin fecha'

  return new Date(fecha).toLocaleString('es-PA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function obtenerTipoCambio(item) {
  const antes = item.datos_antes
  const despues = item.datos_despues

  if (!antes && despues) {
    return 'creacion'
  }

  if (antes && !despues) {
    return 'eliminacion'
  }

  if (antes && despues) {
    return 'edicion'
  }

  return 'sinCambios'
}

function obtenerCamposCambios(item) {
  const antes = item.datos_antes
  const despues = item.datos_despues
  const tipoCambio = obtenerTipoCambio(item)

  if (tipoCambio === 'creacion') {
    return Object.keys(despues)
      .filter((campo) => !CAMPOS_OCULTOS.has(campo))
      .map((campo) => ({
        campo,
        antes: null,
        despues: despues[campo],
      }))
  }

  if (tipoCambio === 'eliminacion') {
    return Object.keys(antes)
      .filter((campo) => !CAMPOS_OCULTOS.has(campo))
      .map((campo) => ({
        campo,
        antes: antes[campo],
        despues: null,
      }))
  }

  if (tipoCambio === 'edicion') {
    const todosLosCampos = [
      ...new Set([...Object.keys(antes), ...Object.keys(despues)]),
    ]

    return todosLosCampos
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

  return []
}

function textoBotonCambios(item) {
  const tipoCambio = obtenerTipoCambio(item)

  if (tipoCambio === 'creacion') return 'Ver registro creado'
  if (tipoCambio === 'eliminacion') return 'Ver registro eliminado'
  if (tipoCambio === 'edicion') return 'Ver cambios'

  return 'Sin cambios'
}

function colorAccion(accion = '') {
  const texto = accion.toLowerCase()

  if (texto.includes('eliminar')) {
    return 'bg-red-50 text-red-700 border-red-100'
  }

  if (texto.includes('editar') || texto.includes('cambiar')) {
    return 'bg-amber-50 text-amber-700 border-amber-100'
  }

  if (texto.includes('crear') || texto.includes('iniciar')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-100'
  }

  return 'bg-[#fff1f1] text-[#8c0303] border-[#f3dede]'
}

function CampoCambio({ cambio, tipoCambio }) {
  return (
    <div className="border-b border-[#f3dede] pb-4 last:border-b-0 last:pb-0">
      <p className="font-semibold text-[#8c0303] mb-2">
        {etiquetaCampo(cambio.campo)}
      </p>

      {tipoCambio === 'creacion' && (
        <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 break-words">
          <span className="font-semibold">Nuevo valor: </span>
          {formatearValor(cambio.despues)}
        </div>
      )}

      {tipoCambio === 'eliminacion' && (
        <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800 break-words">
          <span className="font-semibold">Valor eliminado: </span>
          {formatearValor(cambio.antes)}
        </div>
      )}

      {tipoCambio === 'edicion' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800 break-words">
            <p className="font-semibold text-xs uppercase tracking-[0.12em] mb-1">
              Antes
            </p>
            {formatearValor(cambio.antes)}
          </div>

          <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 break-words">
            <p className="font-semibold text-xs uppercase tracking-[0.12em] mb-1">
              Después
            </p>
            {formatearValor(cambio.despues)}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AuditoriaPage() {
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [moduloFiltro, setModuloFiltro] = useState('Todos')
  const [accionFiltro, setAccionFiltro] = useState('Todos')
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null)

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

  const modulos = useMemo(() => {
    return [
      'Todos',
      ...new Set(registros.map((item) => item.modulo).filter(Boolean)),
    ]
  }, [registros])

  const acciones = useMemo(() => {
    return [
      'Todos',
      ...new Set(registros.map((item) => item.accion).filter(Boolean)),
    ]
  }, [registros])

  const registrosFiltrados = useMemo(() => {
    const busqueda = search.trim().toLowerCase()

    return registros.filter((item) => {
      const texto = `
        ${item.usuario_nombre || ''}
        ${item.usuario_email || ''}
        ${item.rol || ''}
        ${item.accion || ''}
        ${item.modulo || ''}
        ${item.descripcion || ''}
      `.toLowerCase()

      const coincideBusqueda =
        !busqueda || texto.includes(busqueda)

      const coincideModulo =
        moduloFiltro === 'Todos' ||
        item.modulo === moduloFiltro

      const coincideAccion =
        accionFiltro === 'Todos' ||
        item.accion === accionFiltro

      return (
        coincideBusqueda &&
        coincideModulo &&
        coincideAccion
      )
    })
  }, [registros, search, moduloFiltro, accionFiltro])

  const camposSeleccionados = registroSeleccionado
    ? obtenerCamposCambios(registroSeleccionado)
    : []

  const tipoCambioSeleccionado = registroSeleccionado
    ? obtenerTipoCambio(registroSeleccionado)
    : null

  function limpiarFiltros() {
    setSearch('')
    setModuloFiltro('Todos')
    setAccionFiltro('Todos')
  }

  return (
    <main className="min-h-screen bg-[#fcf8f8] w-full">
      <header className="bg-white border-b border-[#f1dede] px-5 md:px-8 py-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#b9a0a0] mb-2">
                Administración
              </p>

              <h1 className="text-[38px] md:text-[34px] ivy text-[#7a0000] leading-[0.95]">
                Auditoría
              </h1>

              <p className="text-sm text-[#b07a7a] mt-3">
                Registro de movimientos realizados dentro del sistema.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={fetchAuditoria}
                className="w-12 h-12 rounded-2xl border border-[#efcccc] bg-white text-[#8c0303] flex items-center justify-center hover:bg-[#fff5f5]"
                aria-label="Actualizar auditoría"
                title="Actualizar auditoría"
              >
                <RefreshCw size={18} />
              </button>

              <div className="hidden md:flex items-center gap-2 bg-[#fff5f5] px-4 py-3 rounded-2xl w-[280px]">
                <Search size={17} className="text-[#b07a7a]" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar actividad..."
                  className="w-full bg-transparent outline-none text-sm text-[#2e2e2e]"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="px-4 md:px-8 py-5 md:py-7 max-w-[1600px] mx-auto">
        <div className="bg-white border border-[#f3dede] rounded-[28px] overflow-hidden">
          <button
            type="button"
            onClick={() => setShowFilters((actual) => !actual)}
            className="w-full flex items-center justify-between gap-4 px-5 md:px-6 py-5 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#fff1f1] text-[#8c0303] flex items-center justify-center">
                <Filter size={18} />
              </div>

              <div>
                <p className="text-[22px] ivy text-[#7a0000] leading-none">
                  Filtrar actividad
                </p>

                <p className="text-sm text-[#b07a7a] mt-1">
                  {registrosFiltrados.length} movimientos visibles
                </p>
              </div>
            </div>

            <span className="text-[#8c0303] text-sm font-semibold">
              {showFilters ? 'Cerrar' : 'Filtrar'}
            </span>
          </button>

          {showFilters && (
            <div className="border-t border-[#f3dede] p-5 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
                    Buscar
                  </label>

                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#efcccc] bg-white">
                    <Search size={17} className="text-[#b07a7a]" />

                    <input
                      value={search}
                      onChange={(event) =>
                        setSearch(event.target.value)
                      }
                      placeholder="Usuario, acción o descripción..."
                      className="w-full bg-transparent outline-none text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
                    Módulo
                  </label>

                  <select
                    value={moduloFiltro}
                    onChange={(event) =>
                      setModuloFiltro(event.target.value)
                    }
                    className="w-full px-4 py-3 rounded-xl border border-[#efcccc] bg-white outline-none text-sm"
                  >
                    {modulos.map((modulo) => (
                      <option key={modulo} value={modulo}>
                        {modulo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
                    Acción
                  </label>

                  <select
                    value={accionFiltro}
                    onChange={(event) =>
                      setAccionFiltro(event.target.value)
                    }
                    className="w-full px-4 py-3 rounded-xl border border-[#efcccc] bg-white outline-none text-sm"
                  >
                    {acciones.map((accion) => (
                      <option key={accion} value={accion}>
                        {accion}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={limpiarFiltros}
                className="mt-4 px-4 py-2 rounded-full bg-[#8c0303] text-white text-sm font-semibold"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        <div className="mt-5 md:mt-6 bg-white border border-[#f3dede] rounded-[28px] overflow-hidden">
          <div className="px-5 md:px-6 py-5 border-b border-[#f3dede] flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[28px] md:text-[32px] ivy text-[#7a0000] leading-none">
                Actividad del sistema
              </h2>

              <p className="text-sm text-[#b07a7a] mt-2">
                Últimos 100 movimientos registrados.
              </p>
            </div>

            <div className="w-11 h-11 rounded-2xl bg-[#fff1f1] text-[#8c0303] flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
          </div>

          <div className="md:hidden divide-y divide-[#f3dede]">
            {loading ? (
              <div className="px-5 py-10 text-center text-[#b07a7a]">
                Cargando auditoría...
              </div>
            ) : registrosFiltrados.length === 0 ? (
              <div className="px-5 py-10 text-center text-[#b07a7a]">
                No hay movimientos que coincidan con los filtros.
              </div>
            ) : (
              registrosFiltrados.map((item) => {
                const tipoCambio = obtenerTipoCambio(item)

                return (
                  <article key={item.id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-[#b07a7a] flex items-center gap-2">
                          <CalendarDays size={14} />
                          {formatearFecha(item.created_at)}
                        </p>

                        <h3 className="text-[24px] ivy text-[#7a0000] leading-tight mt-3 break-words">
                          {item.accion || 'Actividad registrada'}
                        </h3>

                        <p className="text-sm text-[#b07a7a] mt-2">
                          {item.modulo || 'Sin módulo'}
                        </p>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full border text-xs font-semibold shrink-0 ${colorAccion(
                          item.accion
                        )}`}
                      >
                        {tipoCambio === 'creacion'
                          ? 'Creación'
                          : tipoCambio === 'eliminacion'
                            ? 'Eliminación'
                            : tipoCambio === 'edicion'
                              ? 'Edición'
                              : 'Actividad'}
                      </span>
                    </div>

                    <div className="mt-4 rounded-2xl bg-[#fffafa] p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#2e2e2e]">
                        <User size={15} className="text-[#8c0303]" />
                        {item.usuario_nombre || 'Usuario'}
                      </div>

                      <p className="text-xs text-[#b07a7a] mt-1 break-all">
                        {item.usuario_email || 'Sin email'}
                      </p>

                      <p className="text-sm text-[#2e2e2e] mt-4 leading-relaxed">
                        {item.descripcion || 'Sin descripción'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 mt-4">
                      <span className="px-3 py-1 rounded-full bg-[#fff1f1] text-[#8c0303] text-xs font-semibold">
                        {item.rol || 'Sin rol'}
                      </span>

                      {obtenerCamposCambios(item).length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setRegistroSeleccionado(item)}
                          className="text-[#8c0303] font-semibold text-sm flex items-center gap-1"
                        >
                          {textoBotonCambios(item)}
                          <ArrowRight size={16} />
                        </button>
                      ) : (
                        <span className="text-xs text-[#b07a7a]">
                          Sin cambios visibles
                        </span>
                      )}
                    </div>
                  </article>
                )
              })
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-[1120px] w-full text-sm">
              <thead className="bg-[#f8eeee] text-[#b07a7a] uppercase text-[11px] tracking-[0.15em]">
                <tr>
                  <th className="py-4 px-5 text-left">Fecha</th>
                  <th className="py-4 px-5 text-left">Usuario</th>
                  <th className="py-4 px-5 text-left">Rol</th>
                  <th className="py-4 px-5 text-left">Acción</th>
                  <th className="py-4 px-5 text-left">Módulo</th>
                  <th className="py-4 px-5 text-left">Descripción</th>
                  <th className="py-4 px-5 text-right">Cambios</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="py-10 text-center text-[#b07a7a]"
                    >
                      Cargando auditoría...
                    </td>
                  </tr>
                ) : registrosFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="py-10 text-center text-[#b07a7a]"
                    >
                      No hay movimientos que coincidan con los filtros.
                    </td>
                  </tr>
                ) : (
                  registrosFiltrados.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[#f3dede] hover:bg-[#fffafa]"
                    >
                      <td className="py-4 px-5 whitespace-nowrap text-[#2e2e2e]">
                        {formatearFecha(item.created_at)}
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

                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full border text-xs font-semibold ${colorAccion(
                            item.accion
                          )}`}
                        >
                          {item.accion || 'Actividad'}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-[#2e2e2e]">
                        {item.modulo || '—'}
                      </td>

                      <td className="py-4 px-5 text-[#2e2e2e] max-w-[320px]">
                        {item.descripcion || 'Sin descripción'}
                      </td>

                      <td className="py-4 px-5 text-right">
                        {obtenerCamposCambios(item).length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setRegistroSeleccionado(item)}
                            className="text-[#8c0303] font-semibold hover:underline whitespace-nowrap"
                          >
                            {textoBotonCambios(item)}
                          </button>
                        ) : (
                          <span className="text-[#b07a7a]">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {registroSeleccionado && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-end md:items-center justify-center">
          <div className="bg-white w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-[30px] md:rounded-[30px] shadow-2xl">
            <div className="sticky top-0 z-10 bg-white border-b border-[#f3dede] px-5 md:px-7 py-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#b9a0a0]">
                  Detalle de auditoría
                </p>

                <h2 className="text-[30px] ivy text-[#7a0000] leading-none mt-2 break-words">
                  {registroSeleccionado.accion || 'Actividad'}
                </h2>

                <p className="text-sm text-[#b07a7a] mt-2">
                  {registroSeleccionado.modulo || 'Sin módulo'} ·{' '}
                  {formatearFecha(registroSeleccionado.created_at)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setRegistroSeleccionado(null)}
                className="w-11 h-11 rounded-full border border-[#efcccc] text-[#8c0303] flex items-center justify-center shrink-0"
                aria-label="Cerrar detalle"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 md:p-7">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div className="rounded-2xl border border-[#f3dede] bg-[#fffafa] p-4">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-[#b9a0a0]">
                    Usuario
                  </p>

                  <p className="font-semibold text-[#2e2e2e] mt-2">
                    {registroSeleccionado.usuario_nombre || 'Usuario'}
                  </p>

                  <p className="text-xs text-[#b07a7a] mt-1 break-all">
                    {registroSeleccionado.usuario_email || 'Sin email'}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#f3dede] bg-[#fffafa] p-4">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-[#b9a0a0]">
                    Rol
                  </p>

                  <p className="font-semibold text-[#8c0303] mt-2">
                    {registroSeleccionado.rol || 'Sin rol'}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#f3dede] bg-[#fffafa] p-4 mb-6">
                <p className="text-[10px] uppercase tracking-[0.15em] text-[#b9a0a0]">
                  Descripción
                </p>

                <p className="text-sm text-[#2e2e2e] leading-relaxed mt-2">
                  {registroSeleccionado.descripcion ||
                    'Sin descripción disponible.'}
                </p>
              </div>

              {camposSeleccionados.length === 0 ? (
                <div className="rounded-2xl border border-[#f3dede] bg-[#fffafa] p-5 text-sm text-[#b07a7a]">
                  Este movimiento no contiene cambios visibles.
                </div>
              ) : (
                <div>
                  <h3 className="text-[25px] ivy text-[#7a0000] mb-4">
                    {tipoCambioSeleccionado === 'creacion'
                      ? 'Registro creado'
                      : tipoCambioSeleccionado === 'eliminacion'
                        ? 'Registro eliminado'
                        : 'Cambios realizados'}
                  </h3>

                  <div className="rounded-2xl border border-[#f3dede] bg-white p-4 md:p-5 space-y-4">
                    {camposSeleccionados.map((cambio) => (
                      <CampoCambio
                        key={cambio.campo}
                        cambio={cambio}
                        tipoCambio={tipoCambioSeleccionado}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}