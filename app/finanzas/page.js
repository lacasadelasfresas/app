'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Pencil,
  Download,
  Filter,
  X,
  FileText,
  ChevronDown,
} from 'lucide-react'

const CATEGORIAS = [
  'Materia prima',
  'Packaging',
  'Delivery',
  'Marketing',
  'Operación',
  'Equipos',
  'Servicios',
  'Comisiones plataformas',
  'Otros',
]

const METODOS_PAGO = ['Efectivo', 'Yappy', 'Tarjeta']
const ESTADOS_PAGO = ['Pagado', 'Pendiente', 'Programado']
const TIPOS_GASTO = ['Variable', 'Fijo']

function getTodayDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getEmptyForm() {
  return {
    fecha: getTodayDate(),
    categoria: 'Materia prima',
    tipo_gasto: 'Variable',
    estado_pago: 'Pagado',
    concepto: '',
    proveedor: '',
    metodo_pago: 'Efectivo',
    monto: '',
    notas: '',
  }
}

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`
}

function formatMonth(mesKey) {
  const [year, month] = mesKey.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)

  const texto = date.toLocaleDateString('es-PA', {
    month: 'long',
    year: 'numeric',
  })

  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function getTipoAutomatico(categoria) {
  const tipos = {
    'Materia prima': 'Variable',
    Packaging: 'Variable',
    Delivery: 'Variable',
    Marketing: 'Fijo',
    Operación: 'Fijo',
    Equipos: 'Fijo',
    Servicios: 'Fijo',
    'Comisiones plataformas': 'Variable',
    Otros: 'Variable',
  }

  return tipos[categoria] || 'Variable'
}

export default function FinanzasPage() {
  const [ventas, setVentas] = useState([])
  const [gastos, setGastos] = useState([])
  const [proveedores, setProveedores] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todos')
  const [tipoGastoFiltro, setTipoGastoFiltro] = useState('Todos')
  const [estadoPagoFiltro, setEstadoPagoFiltro] = useState('Todos')
  const [metodoPagoFiltro, setMetodoPagoFiltro] = useState('Todos')

  const [editingGasto, setEditingGasto] = useState(null)
  const [facturaFile, setFacturaFile] = useState(null)
  const [form, setForm] = useState(getEmptyForm())

  const [showFilters, setShowFilters] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const formGastoRef = useRef(null)

  useEffect(() => {
    fetchFinanzas()
    fetchProveedores()
  }, [])

  async function fetchFinanzas() {
    setLoading(true)

    const [ventasResponse, gastosResponse] = await Promise.all([
      supabase
        .from('ventas')
        .select('*')
        .not('monto_pago', 'is', null),
      supabase
        .from('gastos')
        .select('*')
        .order('fecha', { ascending: false }),
    ])

    if (ventasResponse.error) {
      console.error('Error cargando ventas:', ventasResponse.error)
    }

    if (gastosResponse.error) {
      console.error('Error cargando gastos:', gastosResponse.error)
    }

    setVentas(ventasResponse.data || [])
    setGastos(gastosResponse.data || [])
    setLoading(false)
  }

  async function fetchProveedores() {
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true })

    if (error) {
      console.error('Error cargando proveedores:', error)
      return
    }

    setProveedores(data || [])
  }

  function handleChange(event) {
    const { name, value } = event.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function abrirNuevoGasto() {
    setEditingGasto(null)
    setFacturaFile(null)
    setForm(getEmptyForm())
    setShowForm(true)

    setTimeout(() => {
      formGastoRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 100)
  }

  function cancelarEdicion() {
    setEditingGasto(null)
    setFacturaFile(null)
    setForm(getEmptyForm())
    setShowForm(false)
  }

  function editarGasto(gasto) {
    setEditingGasto(gasto)
    setFacturaFile(null)

    setForm({
      fecha: gasto.fecha || getTodayDate(),
      categoria: gasto.categoria || 'Materia prima',
      tipo_gasto: gasto.tipo_gasto || 'Variable',
      estado_pago: gasto.estado_pago || 'Pagado',
      concepto: gasto.concepto || '',
      proveedor: gasto.proveedor || '',
      metodo_pago: gasto.metodo_pago || 'Efectivo',
      monto: gasto.monto || '',
      notas: gasto.notas || '',
    })

    setShowForm(true)

    setTimeout(() => {
      formGastoRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 100)
  }

  async function guardarGasto() {
    if (!form.concepto.trim()) {
      alert('Escribe el concepto del gasto.')
      return
    }

    if (!form.monto || Number(form.monto) <= 0) {
      alert('Ingresa un monto válido.')
      return
    }

    setSaving(true)

    try {
      if (form.proveedor.trim()) {
        const { error: proveedorError } = await supabase
          .from('proveedores')
          .upsert(
            {
              nombre: form.proveedor.trim(),
              activo: true,
            },
            {
              onConflict: 'nombre',
            }
          )

        if (proveedorError) {
          console.error('Error guardando proveedor:', proveedorError)
        }
      }

      let facturaPath = editingGasto?.factura_path || null
      let facturaNombre = editingGasto?.factura_nombre || null

      if (facturaFile) {
        facturaNombre = facturaFile.name
        facturaPath = `${Date.now()}-${facturaFile.name}`

        const { error: uploadError } = await supabase.storage
          .from('Facturas-Gastos')
          .upload(facturaPath, facturaFile)

        if (uploadError) {
          console.error('Error subiendo factura:', uploadError)
          alert(`No se pudo subir la factura: ${uploadError.message}`)
          setSaving(false)
          return
        }
      }

      const gastoPayload = {
        fecha: form.fecha || getTodayDate(),
        categoria: form.categoria,
        tipo_gasto: form.tipo_gasto,
        estado_pago: form.estado_pago,
        concepto: form.concepto.trim(),
        proveedor: form.proveedor.trim() || null,
        metodo_pago: form.metodo_pago,
        monto: Number(form.monto || 0),
        notas: form.notas.trim() || null,
        factura_path: facturaPath,
        factura_nombre: facturaNombre,
      }

      const { error } = editingGasto
        ? await supabase
            .from('gastos')
            .update(gastoPayload)
            .eq('id', editingGasto.id)
        : await supabase.from('gastos').insert([gastoPayload])

      if (error) {
        console.error('Error guardando gasto:', error)
        alert('No se pudo guardar el gasto.')
        setSaving(false)
        return
      }

      const mensaje = editingGasto
        ? 'Gasto actualizado correctamente.'
        : 'Gasto registrado correctamente.'

      setSuccessMessage(mensaje)
      setForm(getEmptyForm())
      setFacturaFile(null)
      setEditingGasto(null)
      setShowForm(false)

      await Promise.all([fetchFinanzas(), fetchProveedores()])

      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
    } catch (error) {
      console.error('Error inesperado guardando gasto:', error)
      alert('Ocurrió un error al guardar el gasto.')
    } finally {
      setSaving(false)
    }
  }

  async function eliminarGasto(id) {
    const confirmar = confirm('¿Eliminar este gasto?')

    if (!confirmar) return

    const { error } = await supabase
      .from('gastos')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error eliminando gasto:', error)
      alert('No se pudo eliminar el gasto.')
      return
    }

    await fetchFinanzas()
  }

  async function verFactura(gasto) {
    if (!gasto.factura_path) {
      alert('Este gasto no tiene factura adjunta.')
      return
    }

    const { data, error } = await supabase.storage
      .from('Facturas-Gastos')
      .createSignedUrl(gasto.factura_path, 60)

    if (error) {
      console.error('Error abriendo factura:', error)
      alert('No se pudo abrir la factura.')
      return
    }

    window.open(data.signedUrl, '_blank')
  }

  function setFiltroHoy() {
    const today = getTodayDate()
    setFechaInicio(today)
    setFechaFin(today)
  }

  function setFiltroMesActual() {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')

    const firstDay = `${year}-${month}-01`
    const lastDay = new Date(year, today.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0]

    setFechaInicio(firstDay)
    setFechaFin(lastDay)
  }

  function limpiarFiltros() {
    setFechaInicio('')
    setFechaFin('')
    setCategoriaFiltro('Todos')
    setTipoGastoFiltro('Todos')
    setEstadoPagoFiltro('Todos')
    setMetodoPagoFiltro('Todos')
  }

  const ventasFiltradas = ventas.filter((venta) => {
    const fecha = venta.fecha || venta.created_at?.split('T')[0] || ''

    return (
      (!fechaInicio || fecha >= fechaInicio) &&
      (!fechaFin || fecha <= fechaFin)
    )
  })

  const gastosFiltrados = gastos.filter((gasto) => {
    const fecha = gasto.fecha || gasto.created_at?.split('T')[0] || ''

    return (
      (!fechaInicio || fecha >= fechaInicio) &&
      (!fechaFin || fecha <= fechaFin) &&
      (categoriaFiltro === 'Todos' || gasto.categoria === categoriaFiltro) &&
      (tipoGastoFiltro === 'Todos' ||
        gasto.tipo_gasto === tipoGastoFiltro) &&
      (estadoPagoFiltro === 'Todos' ||
        gasto.estado_pago === estadoPagoFiltro) &&
      (metodoPagoFiltro === 'Todos' ||
        gasto.metodo_pago === metodoPagoFiltro)
    )
  })

  const ingresosMes = ventasFiltradas.reduce(
    (total, venta) => total + Number(venta.monto_pago || 0),
    0
  )

  const totalGastosMes = gastosFiltrados.reduce(
    (total, gasto) => total + Number(gasto.monto || 0),
    0
  )

  const gastosPagados = gastosFiltrados
    .filter((gasto) => gasto.estado_pago === 'Pagado')
    .reduce((total, gasto) => total + Number(gasto.monto || 0), 0)

  const gastosPendientes = gastosFiltrados
    .filter((gasto) => gasto.estado_pago === 'Pendiente')
    .reduce((total, gasto) => total + Number(gasto.monto || 0), 0)

  const gastosProgramados = gastosFiltrados
    .filter((gasto) => gasto.estado_pago === 'Programado')
    .reduce((total, gasto) => total + Number(gasto.monto || 0), 0)

  const utilidadEstimada = ingresosMes - totalGastosMes
  const margenUtilidad =
    ingresosMes > 0 ? (utilidadEstimada / ingresosMes) * 100 : 0

  const puntoEquilibrio = gastosPagados
  const equilibrioCubierto = ingresosMes >= puntoEquilibrio
  const faltanteParaEquilibrio = Math.max(
    puntoEquilibrio - ingresosMes,
    0
  )
  const excedenteSobreEquilibrio = Math.max(
    ingresosMes - puntoEquilibrio,
    0
  )

  const avanceEquilibrio =
    puntoEquilibrio > 0
      ? Math.min((ingresosMes / puntoEquilibrio) * 100, 100)
      : 100

  const gastosPorCategoria = gastosFiltrados.reduce((acc, gasto) => {
    const categoria = gasto.categoria || 'Otros'
    acc[categoria] = (acc[categoria] || 0) + Number(gasto.monto || 0)
    return acc
  }, {})

  const resumenCategorias = Object.entries(gastosPorCategoria)
    .map(([categoria, monto]) => ({
      categoria,
      monto,
      porcentaje:
        totalGastosMes > 0 ? (monto / totalGastosMes) * 100 : 0,
    }))
    .sort((a, b) => b.monto - a.monto)

  const resumenMensual = {}

  ventas.forEach((venta) => {
    const fecha = venta.fecha || venta.created_at?.split('T')[0]

    if (!fecha) return

    const mes = fecha.slice(0, 7)

    if (!resumenMensual[mes]) {
      resumenMensual[mes] = {
        mes,
        ingresos: 0,
        gastos: 0,
      }
    }

    resumenMensual[mes].ingresos += Number(venta.monto_pago || 0)
  })

  gastos.forEach((gasto) => {
    const fecha = gasto.fecha || gasto.created_at?.split('T')[0]

    if (!fecha) return

    const mes = fecha.slice(0, 7)

    if (!resumenMensual[mes]) {
      resumenMensual[mes] = {
        mes,
        ingresos: 0,
        gastos: 0,
      }
    }

    resumenMensual[mes].gastos += Number(gasto.monto || 0)
  })

  const resumenMensualLista = Object.values(resumenMensual)
    .map((item) => {
      const utilidad = item.ingresos - item.gastos

      return {
        ...item,
        utilidad,
        margen:
          item.ingresos > 0
            ? (utilidad / item.ingresos) * 100
            : 0,
      }
    })
    .sort((a, b) => b.mes.localeCompare(a.mes))

  function exportarGastosCSV() {
    const headers = [
      'Fecha',
      'Categoría',
      'Tipo',
      'Estado',
      'Concepto',
      'Proveedor',
      'Método de pago',
      'Monto',
      'Notas',
    ]

    const rows = gastosFiltrados.map((gasto) => [
      gasto.fecha || '',
      gasto.categoria || '',
      gasto.tipo_gasto || '',
      gasto.estado_pago || '',
      gasto.concepto || '',
      gasto.proveedor || '',
      gasto.metodo_pago || '',
      Number(gasto.monto || 0).toFixed(2),
      gasto.notas || '',
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n')

    descargarArchivo(
      csv,
      `gastos-${getTodayDate()}.csv`,
      'text/csv;charset=utf-8;'
    )
  }

  function exportarGastosExcel() {
    const headers = [
      'Fecha',
      'Categoría',
      'Tipo',
      'Estado',
      'Concepto',
      'Proveedor',
      'Método de pago',
      'Monto',
      'Notas',
    ]

    const rows = gastosFiltrados.map((gasto) => [
      gasto.fecha || '',
      gasto.categoria || '',
      gasto.tipo_gasto || '',
      gasto.estado_pago || '',
      gasto.concepto || '',
      gasto.proveedor || '',
      gasto.metodo_pago || '',
      Number(gasto.monto || 0).toFixed(2),
      gasto.notas || '',
    ])

    const contenido = [
      headers.join('\t'),
      ...rows.map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join('\t')
      ),
    ].join('\n')

    descargarArchivo(
      contenido,
      `gastos-${getTodayDate()}.xls`,
      'application/vnd.ms-excel;charset=utf-8;'
    )
  }

  function descargarArchivo(contenido, nombre, tipo) {
    const blob = new Blob([contenido], { type: tipo })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = nombre

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

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
          Finanzas
        </h1>

        <p className="mt-1 text-xs md:text-sm text-[#b07a7a]">
          Controla ingresos, gastos, utilidad estimada y costos operativos.
        </p>
      </div>

      <div className="hidden md:flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowFilters((value) => !value)}
          className="border border-[#efcaca] text-[#8c0303] px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#fff5f5]"
        >
          <Filter size={16} />
          Filtros
        </button>

        <button
          type="button"
          onClick={abrirNuevoGasto}
          className="bg-[#8c0303] text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus size={16} />
          Registrar gasto
        </button>
      </div>
    </div>
  </div>
</header>

      <section className="p-4 sm:p-6 lg:p-10 space-y-5 md:space-y-6">
        {successMessage && (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        {/* KPIs principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Ingresos"
            value={formatCurrency(ingresosMes)}
            icon={<DollarSign size={20} />}
          />

          <KpiCard
            title="Gastos"
            value={formatCurrency(totalGastosMes)}
            icon={<TrendingDown size={20} />}
          />

          <KpiCard
            title="Utilidad estimada"
            value={formatCurrency(utilidadEstimada)}
            icon={<TrendingUp size={20} />}
          />

          <KpiCard
            title="Margen"
            value={`${margenUtilidad.toFixed(1)}%`}
            icon={<TrendingUp size={20} />}
          />
        </div>

        {/* Gastos por estado */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MiniKpi title="Pagados" value={formatCurrency(gastosPagados)} />
          <MiniKpi title="Pendientes" value={formatCurrency(gastosPendientes)} />
          <MiniKpi
            title="Programados"
            value={formatCurrency(gastosProgramados)}
          />
        </div>

        {/* Punto de equilibrio */}
        <section className="bg-white border border-[#f3dede] rounded-[28px] p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h2 className="text-[27px] md:text-[30px] ivy text-[#7a0000] leading-none">
                Punto de equilibrio
              </h2>

              <p className="text-sm text-[#b07a7a] mt-2 max-w-[620px]">
                Ventas mínimas necesarias para cubrir los gastos pagados del
                período seleccionado.
              </p>
            </div>

            <span className="self-start px-4 py-2 rounded-full bg-[#fff1f1] text-[#8c0303] text-sm font-semibold">
              {equilibrioCubierto ? 'Cubierto' : 'Pendiente'}
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            <BalanceCard
              title="Punto de equilibrio"
              value={formatCurrency(puntoEquilibrio)}
            />
            <BalanceCard
              title="Ingresos actuales"
              value={formatCurrency(ingresosMes)}
            />
            <BalanceCard
              title="Faltante"
              value={formatCurrency(faltanteParaEquilibrio)}
            />
            <BalanceCard
              title="Excedente"
              value={formatCurrency(excedenteSobreEquilibrio)}
            />
          </div>

          <div className="mt-5 h-3 bg-[#fff1f1] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#8c0303] rounded-full transition-all"
              style={{ width: `${avanceEquilibrio}%` }}
            />
          </div>

          <p className="text-sm text-[#b07a7a] mt-3">
            {equilibrioCubierto
              ? 'El negocio ya cubrió sus gastos pagados del período filtrado.'
              : 'Aún faltan ingresos para cubrir los gastos pagados del período filtrado.'}
          </p>
        </section>

        {/* Acciones móviles */}
        <div className="flex gap-3 md:hidden">
          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className="flex-1 border border-[#efcaca] text-[#8c0303] px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <Filter size={18} />
            Filtros
          </button>

          <button
            type="button"
            onClick={abrirNuevoGasto}
            className="flex-1 bg-[#8c0303] text-white px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Gasto
          </button>
        </div>

        {/* Filtros */}
        <section
          className={`bg-white border border-[#f3dede] rounded-[28px] p-5 md:block ${
            showFilters ? 'block' : 'hidden'
          }`}
        >
          <div className="flex items-center justify-between gap-3 mb-5 md:hidden">
            <div>
              <h2 className="text-[25px] ivy text-[#7a0000]">Filtros</h2>
              <p className="text-sm text-[#b07a7a]">
                Ajusta el período y tipo de gasto.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowFilters(false)}
              className="w-10 h-10 rounded-full border border-[#efcaca] text-[#8c0303] flex items-center justify-center"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <Field label="Desde">
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Hasta">
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Categoría">
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                className={inputClass}
              >
                <option>Todos</option>
                {CATEGORIAS.map((categoria) => (
                  <option key={categoria}>{categoria}</option>
                ))}
              </select>
            </Field>

            <Field label="Tipo de gasto">
              <select
                value={tipoGastoFiltro}
                onChange={(e) => setTipoGastoFiltro(e.target.value)}
                className={inputClass}
              >
                <option>Todos</option>
                {TIPOS_GASTO.map((tipo) => (
                  <option key={tipo}>{tipo}</option>
                ))}
              </select>
            </Field>

            <Field label="Estado del pago">
              <select
                value={estadoPagoFiltro}
                onChange={(e) => setEstadoPagoFiltro(e.target.value)}
                className={inputClass}
              >
                <option>Todos</option>
                {ESTADOS_PAGO.map((estado) => (
                  <option key={estado}>{estado}</option>
                ))}
              </select>
            </Field>

            <Field label="Método de pago">
              <select
                value={metodoPagoFiltro}
                onChange={(e) => setMetodoPagoFiltro(e.target.value)}
                className={inputClass}
              >
                <option>Todos</option>
                {METODOS_PAGO.map((metodo) => (
                  <option key={metodo}>{metodo}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            <button
              type="button"
              onClick={setFiltroHoy}
              className="border border-[#efcaca] text-[#8c0303] px-3 py-3 rounded-xl font-semibold text-sm"
            >
              Hoy
            </button>

            <button
              type="button"
              onClick={setFiltroMesActual}
              className="border border-[#efcaca] text-[#8c0303] px-3 py-3 rounded-xl font-semibold text-sm"
            >
              Este mes
            </button>

            <button
              type="button"
              onClick={limpiarFiltros}
              className="bg-[#8c0303] text-white px-3 py-3 rounded-xl font-semibold text-sm"
            >
              Limpiar
            </button>
          </div>
        </section>

        {/* Formulario de gasto */}
        <section
          ref={formGastoRef}
          className={`bg-white border border-[#f3dede] rounded-[28px] p-5 md:block ${
            showForm ? 'block' : 'hidden'
          }`}
        >
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-[29px] md:text-[30px] ivy text-[#7a0000] leading-none">
                {editingGasto ? 'Editar gasto' : 'Registrar gasto'}
              </h2>

              <p className="text-sm text-[#b07a7a] mt-2 max-w-[560px]">
                Agrega costos operativos, materia prima, packaging o gastos
                generales del negocio.
              </p>
            </div>

            <button
              type="button"
              onClick={cancelarEdicion}
              className="md:hidden w-10 h-10 rounded-full border border-[#efcaca] text-[#8c0303] flex items-center justify-center"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Field label="Fecha">
<input
  type="date"
  value={form.fecha}
  onChange={handleChange}
  className="w-full min-w-0 max-w-full rounded-xl border border-[#efcaca] bg-white px-4 py-3 text-sm text-[#2e2e2e] outline-none"
/>
            </Field>

            <Field label="Categoría">
              <select
                name="categoria"
                value={form.categoria}
                onChange={(e) => {
                  const categoria = e.target.value

                  setForm((prev) => ({
                    ...prev,
                    categoria,
                    tipo_gasto: getTipoAutomatico(categoria),
                  }))
                }}
                className={inputClass}
              >
                {CATEGORIAS.map((categoria) => (
                  <option key={categoria}>{categoria}</option>
                ))}
              </select>
            </Field>

            <Field label="Tipo de gasto">
              <select
                name="tipo_gasto"
                value={form.tipo_gasto}
                onChange={handleChange}
                className={inputClass}
              >
                {TIPOS_GASTO.map((tipo) => (
                  <option key={tipo}>{tipo}</option>
                ))}
              </select>
            </Field>

            <Field label="Concepto">
              <input
                name="concepto"
                value={form.concepto}
                onChange={handleChange}
                placeholder="Ej: compra de fresas"
                className={inputClass}
              />
            </Field>

            <Field label="Proveedor">
              <>
                <input
                  name="proveedor"
                  value={form.proveedor}
                  onChange={handleChange}
                  list="proveedores-list"
                  placeholder="Selecciona o escribe un proveedor"
                  className={inputClass}
                />

                <datalist id="proveedores-list">
                  {proveedores.map((proveedor) => (
                    <option
                      key={proveedor.id}
                      value={proveedor.nombre}
                    />
                  ))}
                </datalist>
              </>
            </Field>

            <Field label="Método de pago">
              <select
                name="metodo_pago"
                value={form.metodo_pago}
                onChange={handleChange}
                className={inputClass}
              >
                {METODOS_PAGO.map((metodo) => (
                  <option key={metodo}>{metodo}</option>
                ))}
              </select>
            </Field>

            <Field label="Estado del pago">
              <select
                name="estado_pago"
                value={form.estado_pago}
                onChange={handleChange}
                className={inputClass}
              >
                {ESTADOS_PAGO.map((estado) => (
                  <option key={estado}>{estado}</option>
                ))}
              </select>
            </Field>

            <Field label="Monto">
              <input
                type="number"
                name="monto"
                value={form.monto}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                className={inputClass}
              />
            </Field>

            <Field label="Notas">
              <input
                name="notas"
                value={form.notas}
                onChange={handleChange}
                placeholder="Opcional"
                className={inputClass}
              />
            </Field>

            <Field label="Factura">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) =>
                  setFacturaFile(e.target.files?.[0] || null)
                }
                className={inputClass}
              />
            </Field>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
            {(editingGasto || showForm) && (
              <button
                type="button"
                onClick={cancelarEdicion}
                className="border border-[#efcaca] text-[#8c0303] px-5 py-3 rounded-xl font-semibold"
              >
                Cancelar
              </button>
            )}

            <button
              type="button"
              onClick={guardarGasto}
              disabled={saving}
              className="bg-[#8c0303] text-white px-5 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Plus size={18} />
              {saving
                ? 'Guardando...'
                : editingGasto
                  ? 'Guardar cambios'
                  : 'Agregar gasto'}
            </button>
          </div>
        </section>

        {/* Gastos */}
        <section className="bg-white border border-[#f3dede] rounded-[28px] overflow-hidden">
          <div className="p-5 md:p-6 border-b border-[#f3dede] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-[29px] md:text-[30px] ivy text-[#7a0000] leading-none">
                Gastos registrados
              </h2>

              <p className="text-sm text-[#b07a7a] mt-2">
                Historial de gastos operativos del negocio.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={exportarGastosCSV}
                className="border border-[#efcaca] text-[#8c0303] px-3 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold"
              >
                <Download size={16} />
                CSV
              </button>

              <button
                type="button"
                onClick={exportarGastosExcel}
                className="border border-[#efcaca] text-[#8c0303] px-3 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold"
              >
                <Download size={16} />
                Excel
              </button>
            </div>
          </div>

          {/* Vista móvil en tarjetas */}
          <div className="md:hidden p-4 space-y-3">
            {loading ? (
              <EmptyState texto="Cargando finanzas..." />
            ) : gastosFiltrados.length === 0 ? (
              <EmptyState texto="No hay gastos registrados para estos filtros." />
            ) : (
              gastosFiltrados.map((gasto) => (
                <article
                  key={gasto.id}
                  className="border border-[#f3dede] rounded-2xl p-4 bg-[#fffafa]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#2e2e2e] break-words">
                        {gasto.concepto || 'Gasto sin concepto'}
                      </p>

                      <p className="text-xs text-[#b07a7a] mt-1">
                        {gasto.fecha} · {gasto.categoria}
                      </p>
                    </div>

                    <p className="font-semibold text-[#8c0303] whitespace-nowrap">
                      {formatCurrency(gasto.monto)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge>{gasto.tipo_gasto || 'Variable'}</Badge>
                    <Badge variant="soft">
                      {gasto.estado_pago || 'Pagado'}
                    </Badge>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#f3dede]">
                    <p className="text-xs text-[#b07a7a]">
                      Proveedor
                    </p>

                    <p className="text-sm text-[#2e2e2e] mt-1">
                      {gasto.proveedor || 'No registrado'}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => editarGasto(gasto)}
                      className="border border-[#efcaca] text-[#8c0303] py-2.5 rounded-xl flex items-center justify-center"
                      aria-label="Editar gasto"
                    >
                      <Pencil size={16} />
                    </button>

                    {gasto.factura_path ? (
                      <button
                        type="button"
                        onClick={() => verFactura(gasto)}
                        className="border border-[#efcaca] text-[#8c0303] py-2.5 rounded-xl flex items-center justify-center"
                        aria-label="Ver factura"
                      >
                        <FileText size={16} />
                      </button>
                    ) : (
                      <div className="border border-[#f5e7e7] text-[#d9baba] py-2.5 rounded-xl flex items-center justify-center">
                        <FileText size={16} />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => eliminarGasto(gasto.id)}
                      className="border border-[#efcaca] text-red-600 py-2.5 rounded-xl flex items-center justify-center"
                      aria-label="Eliminar gasto"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>

          {/* Vista escritorio */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-[980px] w-full text-[12px]">
              <thead className="bg-[#f8eeee] text-[#b07a7a] uppercase text-[11px] tracking-[0.15em]">
                <tr>
                  <th className="py-4 px-3 text-left">Fecha</th>
                  <th className="py-4 px-3 text-left">Categoría</th>
                  <th className="py-4 px-3 text-left">Tipo</th>
                  <th className="py-4 px-3 text-left">Estado</th>
                  <th className="py-4 px-3 text-left">Concepto</th>
                  <th className="py-4 px-3 text-left">Proveedor</th>
                  <th className="py-4 px-3 text-left">Monto</th>
                  <th className="py-4 px-3 text-right">Acción</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="py-8 text-center text-[#b07a7a]"
                    >
                      Cargando finanzas...
                    </td>
                  </tr>
                ) : gastosFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="py-8 text-center text-[#b07a7a]"
                    >
                      No hay gastos registrados para estos filtros.
                    </td>
                  </tr>
                ) : (
                  gastosFiltrados.map((gasto) => (
                    <tr
                      key={gasto.id}
                      className="border-b border-[#f3dede] hover:bg-[#fffafa]"
                    >
                      <td className="py-4 px-3 whitespace-nowrap">
                        {gasto.fecha}
                      </td>
                      <td className="py-4 px-3">{gasto.categoria}</td>
                      <td className="py-4 px-3">
                        <Badge>{gasto.tipo_gasto || 'Variable'}</Badge>
                      </td>
                      <td className="py-4 px-3">
                        <Badge variant="soft">
                          {gasto.estado_pago || 'Pagado'}
                        </Badge>
                      </td>
                      <td className="py-4 px-3 font-medium">
                        {gasto.concepto}
                      </td>
                      <td className="py-4 px-3 whitespace-nowrap">
                        {gasto.proveedor || 'No registrado'}
                      </td>
                      <td className="py-4 px-3 font-semibold">
                        {formatCurrency(gasto.monto)}
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => editarGasto(gasto)}
                            className="border border-[#efcaca] text-[#8c0303] p-2 rounded-xl hover:bg-[#fff5f5]"
                            title="Editar gasto"
                          >
                            <Pencil size={14} />
                          </button>

                          {gasto.factura_path && (
                            <button
                              type="button"
                              onClick={() => verFactura(gasto)}
                              className="border border-[#efcaca] text-[#8c0303] px-3 py-2 rounded-xl hover:bg-[#fff5f5] text-xs font-semibold"
                            >
                              Factura
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => eliminarGasto(gasto.id)}
                            className="border border-[#efcaca] text-red-600 p-2 rounded-xl hover:bg-[#fff5f5]"
                            title="Eliminar gasto"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Categorías + resumen mensual */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 md:gap-6">
          <section className="bg-white border border-[#f3dede] rounded-[28px] p-5 md:p-6">
            <h2 className="text-[29px] md:text-[30px] ivy text-[#7a0000] leading-none">
              Gastos por categoría
            </h2>

            <p className="text-sm text-[#b07a7a] mt-2 mb-5">
              Distribución de costos del período filtrado.
            </p>

            {resumenCategorias.length === 0 ? (
              <EmptyState texto="Aún no hay gastos para estos filtros." />
            ) : (
              <div className="space-y-5">
                {resumenCategorias.map((item) => (
                  <div key={item.categoria}>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="font-medium text-[#2e2e2e]">
                        {item.categoria}
                      </p>

                      <p className="font-semibold text-[#8c0303] whitespace-nowrap">
                        {formatCurrency(item.monto)}
                      </p>
                    </div>

                    <div className="h-2 bg-[#fff1f1] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#8c0303] rounded-full"
                        style={{ width: `${item.porcentaje}%` }}
                      />
                    </div>

                    <p className="text-xs text-[#b07a7a] mt-1">
                      {item.porcentaje.toFixed(1)}% de los gastos
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="xl:col-span-2 bg-white border border-[#f3dede] rounded-[28px] overflow-hidden">
            <div className="p-5 md:p-6 border-b border-[#f3dede]">
              <h2 className="text-[29px] md:text-[30px] ivy text-[#7a0000] leading-none">
                Ingresos vs gastos por mes
              </h2>

              <p className="text-sm text-[#b07a7a] mt-2">
                Comparativo mensual de ingresos, gastos y utilidad estimada.
              </p>
            </div>

            {/* Móvil */}
            <div className="md:hidden p-4 space-y-3">
              {resumenMensualLista.map((item) => (
                <article
                  key={item.mes}
                  className="border border-[#f3dede] rounded-2xl p-4 bg-[#fffafa]"
                >
                  <p className="font-semibold text-[#2e2e2e]">
                    {formatMonth(item.mes)}
                  </p>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4 text-sm">
                    <MetricLine
                      label="Ingresos"
                      value={formatCurrency(item.ingresos)}
                    />
                    <MetricLine
                      label="Gastos"
                      value={formatCurrency(item.gastos)}
                    />
                    <MetricLine
                      label="Utilidad"
                      value={formatCurrency(item.utilidad)}
                    />
                    <MetricLine
                      label="Margen"
                      value={`${item.margen.toFixed(1)}%`}
                    />
                  </div>
                </article>
              ))}
            </div>

            {/* Escritorio */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-[720px] w-full text-sm">
                <thead className="bg-[#f8eeee] text-[#b07a7a] uppercase text-[11px] tracking-[0.15em]">
                  <tr>
                    <th className="py-4 px-5 text-left">Mes</th>
                    <th className="py-4 px-5 text-right">Ingresos</th>
                    <th className="py-4 px-5 text-right">Gastos</th>
                    <th className="py-4 px-5 text-right">Utilidad</th>
                    <th className="py-4 px-5 text-right">Margen</th>
                  </tr>
                </thead>

                <tbody>
                  {resumenMensualLista.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="py-8 text-center text-[#b07a7a]"
                      >
                        Aún no hay datos suficientes para mostrar el resumen.
                      </td>
                    </tr>
                  ) : (
                    resumenMensualLista.map((item) => (
                      <tr
                        key={item.mes}
                        className="border-b border-[#f3dede] hover:bg-[#fffafa]"
                      >
                        <td className="py-4 px-5 font-medium text-[#2e2e2e]">
                          {formatMonth(item.mes)}
                        </td>
                        <td className="py-4 px-5 text-right font-semibold text-[#8c0303]">
                          {formatCurrency(item.ingresos)}
                        </td>
                        <td className="py-4 px-5 text-right font-semibold text-[#8c0303]">
                          {formatCurrency(item.gastos)}
                        </td>
                        <td className="py-4 px-5 text-right font-semibold">
                          {formatCurrency(item.utilidad)}
                        </td>
                        <td className="py-4 px-5 text-right font-semibold text-[#8c0303]">
                          {item.margen.toFixed(1)}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}

const inputClass =
  'w-full border border-[#efcaca] rounded-xl px-4 py-3 bg-white outline-none text-sm text-[#2e2e2e] focus:border-[#8c0303]'

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
        {label}
      </label>
      {children}
    </div>
  )
}

function KpiCard({ title, value, icon }) {
  return (
    <div className="bg-white border border-[#f3dede] rounded-[24px] p-5 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-3">
            {title}
          </p>

          <p className="text-[30px] md:text-[34px] ivy text-[#8c0303] leading-none">
            {value}
          </p>
        </div>

        <div className="w-11 h-11 rounded-2xl bg-[#fff1f1] text-[#8c0303] flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>
    </div>
  )
}

function MiniKpi({ title, value }) {
  return (
    <div className="bg-white border border-[#f3dede] rounded-[24px] p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
        Gastos {title.toLowerCase()}
      </p>

      <p className="text-[27px] ivy text-[#8c0303] leading-none">
        {value}
      </p>
    </div>
  )
}

function BalanceCard({ title, value }) {
  return (
    <div className="border border-[#f3dede] rounded-2xl p-4 bg-[#fffafa]">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#b9a0a0] mb-2">
        {title}
      </p>

      <p className="text-[22px] md:text-[26px] ivy text-[#8c0303] leading-none">
        {value}
      </p>
    </div>
  )
}

function Badge({ children, variant = 'default' }) {
  const styles =
    variant === 'soft'
      ? 'bg-[#fffaf0] text-[#8c0303]'
      : 'bg-[#fff1f1] text-[#8c0303]'

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${styles}`}
    >
      {children}
    </span>
  )
}

function EmptyState({ texto }) {
  return (
    <p className="py-5 text-sm text-center text-[#b07a7a]">
      {texto}
    </p>
  )
}

function MetricLine({ label, value }) {
  return (
    <div>
      <p className="text-xs text-[#b07a7a]">{label}</p>
      <p className="font-semibold text-[#8c0303] mt-1">{value}</p>
    </div>
  )
}