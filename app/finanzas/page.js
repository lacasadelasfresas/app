'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Pencil,
  Download,
} from 'lucide-react'

export default function FinanzasPage() {
  const [ventas, setVentas] = useState([])
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
const [fechaFin, setFechaFin] = useState('')
const [categoriaFiltro, setCategoriaFiltro] = useState('Todos')
const [metodoPagoFiltro, setMetodoPagoFiltro] = useState('Todos')
const [editingGasto, setEditingGasto] = useState(null)
const [facturaFile, setFacturaFile] = useState(null)

  const [form, setForm] = useState({
    fecha: getTodayDate(),
    categoria: 'Materia prima',
    tipo_gasto: 'Variable',
    estado_pago: 'Pagado',
    concepto: '',
    proveedor: '',
    metodo_pago: 'Efectivo',
    monto: '',
    notas: '',
    factura: null,
  })

function getTodayDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
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

  useEffect(() => {
    fetchFinanzas()
  }, [])

  async function fetchFinanzas() {
    setLoading(true)

    const { data: ventasData, error: ventasError } = await supabase
      .from('ventas')
      .select('*')
      .not('monto_pago', 'is', null)

    const { data: gastosData, error: gastosError } = await supabase
      .from('gastos')
      .select('*')
      .order('fecha', { ascending: false })

    if (ventasError) {
      console.error('Error cargando ventas:', ventasError)
    }

    if (gastosError) {
      console.error('Error cargando gastos:', gastosError)
    }

    setVentas(ventasData || [])
    setGastos(gastosData || [])
    setLoading(false)
  }

  function handleChange(e) {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

async function guardarGasto() {
  if (!form.concepto || !form.monto) {
    alert('Debes agregar un concepto y un monto.')
    return
  }

  setSaving(true)

let facturaPath = null
let facturaNombre = null

if (facturaFile) {
  facturaNombre = facturaFile.name

  facturaPath = `${Date.now()}-${facturaFile.name}`

  const { error: uploadError } = await supabase.storage
    .from('Facturas-Gastos')
    .upload(facturaPath, facturaFile)

  if (uploadError) {
    console.error('Error subiendo factura:', uploadError)
    alert(`Error subiendo factura: ${uploadError.message}`)
    setSaving(false)
    return
  }
}

const gastoPayload = {
    fecha: form.fecha || getTodayDate(),
    categoria: form.categoria,
    tipo_gasto: form.tipo_gasto || 'Variable',
    estado_pago: form.estado_pago || 'Pagado',
    concepto: form.concepto,
    proveedor: form.proveedor || null,
    metodo_pago: form.metodo_pago || null,
    monto: Number(form.monto || 0),
    notas: form.notas || null,
      factura_path: facturaPath,
  factura_nombre: facturaNombre,
  }
  
  const { error } = editingGasto
    ? await supabase
        .from('gastos')
        .update(gastoPayload)
        .eq('id', editingGasto.id)
    : await supabase
        .from('gastos')
        .insert([gastoPayload])

  if (error) {
    console.error('Error guardando gasto:', error)
    alert('No se pudo guardar el gasto.')
    setSaving(false)
    return
  }

  setForm({
    fecha: getTodayDate(),
    categoria: 'Materia prima',
    tipo_gasto: 'Variable',
    estado_pago: 'Pagado',
    concepto: '',
    proveedor: '',
    metodo_pago: 'Efectivo',
    monto: '',
    notas: '',
  })

  setFacturaFile(null)
  setEditingGasto(null)

  await fetchFinanzas()

  setSuccessMessage(
    editingGasto
      ? 'Gasto actualizado correctamente.'
      : 'Gasto registrado correctamente.'
  )

  setTimeout(() => {
    setSuccessMessage('')
  }, 3000)

  setSaving(false)
}

function exportarGastosCSV() {
  const headers = [
    'Fecha',
    'Categoria',
    'Concepto',
    'Proveedor',
    'Metodo de Pago',
    'Monto',
    'Notas',
  ]

  const rows = gastosFiltrados.map((gasto) => [
    gasto.fecha || '',
    gasto.categoria || '',
    gasto.concepto || '',
    gasto.proveedor || '',
    gasto.metodo_pago || '',
    Number(gasto.monto || 0).toFixed(2),
    gasto.notas || '',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(',')
    ),
  ].join('\n')

  const blob = new Blob([csvContent], {
    type: 'text/csv;charset=utf-8;',
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.setAttribute(
    'download',
    `gastos-${new Date().toISOString().split('T')[0]}.csv`
  )

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function exportarGastosExcel() {
  const headers = [
    'Fecha',
    'Categoria',
    'Concepto',
    'Proveedor',
    'Metodo de Pago',
    'Monto',
    'Notas',
  ]

  const rows = gastosFiltrados.map((gasto) => [
    gasto.fecha || '',
    gasto.categoria || '',
    gasto.concepto || '',
    gasto.proveedor || '',
    gasto.metodo_pago || '',
    Number(gasto.monto || 0).toFixed(2),
    gasto.notas || '',
  ])

  const excelContent = [
    headers.join('\t'),
    ...rows.map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join('\t')
    ),
  ].join('\n')

  const blob = new Blob([excelContent], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `gastos-${new Date().toISOString().split('T')[0]}.xls`

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function editarGasto(gasto) {
  setEditingGasto(gasto)

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

  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
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

const ventasFiltradas = ventas.filter((venta) => {
  const ventaFecha = venta.fecha || venta.created_at?.split('T')[0] || ''

  const matchesFechaInicio =
    !fechaInicio || ventaFecha >= fechaInicio

  const matchesFechaFin =
    !fechaFin || ventaFecha <= fechaFin

  return matchesFechaInicio && matchesFechaFin
})

const gastosFiltrados = gastos.filter((gasto) => {
  const gastoFecha = gasto.fecha || gasto.created_at?.split('T')[0] || ''

  const matchesFechaInicio =
    !fechaInicio || gastoFecha >= fechaInicio

  const matchesFechaFin =
    !fechaFin || gastoFecha <= fechaFin

  const matchesCategoria =
    categoriaFiltro === 'Todos' || gasto.categoria === categoriaFiltro

  const matchesMetodoPago =
    metodoPagoFiltro === 'Todos' || gasto.metodo_pago === metodoPagoFiltro

  return (
    matchesFechaInicio &&
    matchesFechaFin &&
    matchesCategoria &&
    matchesMetodoPago
  )
})

const ingresosMes = ventasFiltradas.reduce((acc, venta) => {
    return acc + Number(venta.monto_pago || 0)
  }, 0)

const totalGastosMes = gastosFiltrados.reduce((acc, gasto) => {
    return acc + Number(gasto.monto || 0)
  }, 0)

  const utilidadEstimada = ingresosMes - totalGastosMes

  const margenUtilidad =
    ingresosMes > 0 ? (utilidadEstimada / ingresosMes) * 100 : 0

    const gastosPagados = gastosFiltrados
  .filter((gasto) => gasto.estado_pago === 'Pagado')
  .reduce((acc, gasto) => acc + Number(gasto.monto || 0), 0)

const gastosPendientes = gastosFiltrados
  .filter((gasto) => gasto.estado_pago === 'Pendiente')
  .reduce((acc, gasto) => acc + Number(gasto.monto || 0), 0)

const gastosProgramados = gastosFiltrados
  .filter((gasto) => gasto.estado_pago === 'Programado')
  .reduce((acc, gasto) => acc + Number(gasto.monto || 0), 0)

const utilidadNetaInversor = ingresosMes - gastosPagados

const porcentajeInversor = 5

const gananciaInversor = utilidadNetaInversor > 0
  ? utilidadNetaInversor * (porcentajeInversor / 100)
  : 0

const utilidadDespuesInversor = utilidadNetaInversor - gananciaInversor

const puntoEquilibrio = gastosPagados

const faltanteParaEquilibrio = puntoEquilibrio > ingresosMes
  ? puntoEquilibrio - ingresosMes
  : 0

const excedenteSobreEquilibrio = ingresosMes > puntoEquilibrio
  ? ingresosMes - puntoEquilibrio
  : 0

const equilibrioCubierto = ingresosMes >= puntoEquilibrio

const gastosPorCategoria = gastosFiltrados.reduce((acc, gasto) => {
    const categoria = gasto.categoria || 'Otros'
    acc[categoria] = (acc[categoria] || 0) + Number(gasto.monto || 0)
    return acc
  }, {})

const resumenCategorias = Object.entries(gastosPorCategoria)
  .map(([categoria, monto]) => ({
    categoria,
    monto,
    porcentaje: totalGastosMes > 0 ? (monto / totalGastosMes) * 100 : 0,
  }))
  .sort((a, b) => b.monto - a.monto)

const resumenMensual = {}

ventas.forEach((venta) => {
  const fecha = venta.fecha || venta.created_at?.split('T')[0]
  if (!fecha) return

  const mesKey = fecha.slice(0, 7)

  if (!resumenMensual[mesKey]) {
    resumenMensual[mesKey] = {
      mes: mesKey,
      ingresos: 0,
      gastos: 0,
      utilidad: 0,
    }
  }

  resumenMensual[mesKey].ingresos += Number(venta.monto_pago || 0)
})

gastos.forEach((gasto) => {
  const fecha = gasto.fecha || gasto.created_at?.split('T')[0]
  if (!fecha) return

  const mesKey = fecha.slice(0, 7)

  if (!resumenMensual[mesKey]) {
    resumenMensual[mesKey] = {
      mes: mesKey,
      ingresos: 0,
      gastos: 0,
      utilidad: 0,
    }
  }

  resumenMensual[mesKey].gastos += Number(gasto.monto || 0)
})

const resumenMensualLista = Object.values(resumenMensual)
  .map((item) => {
    const utilidad = item.ingresos - item.gastos
    const margen = item.ingresos > 0 ? (utilidad / item.ingresos) * 100 : 0

    return {
      ...item,
      utilidad,
      margen,
    }
  })
  .sort((a, b) => b.mes.localeCompare(a.mes))

function formatearMes(mesKey) {
  const [year, month] = mesKey.split('-')

  const date = new Date(Number(year), Number(month) - 1, 1)

  const mesFormateado = date.toLocaleDateString('es-PA', {
    month: 'long',
    year: 'numeric',
  })

  return mesFormateado.charAt(0).toUpperCase() + mesFormateado.slice(1)
}

  return (
    <main className="min-h-screen bg-[#fcf8f8] w-full">
      <section className="w-full min-h-screen">
        <div className="bg-white border-b border-[#f1dede] px-10 h-[86px] flex items-center justify-between">
          <div>
            <h1 className="text-[34px] ivy text-[#7a0000] leading-none">
              Finanzas
            </h1>
            <p className="text-sm text-[#b07a7a] mt-2">
              Controla ingresos, gastos, utilidad estimada y costos operativos.
            </p>
          </div>
        </div>

        <div className="p-10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <KpiCard
              title="Ingresos del mes"
              value={`$${ingresosMes.toFixed(2)}`}
              icon={<DollarSign size={20} />}
            />

            <KpiCard
              title="Gastos del mes"
              value={`$${totalGastosMes.toFixed(2)}`}
              icon={<TrendingDown size={20} />}
            />

            <KpiCard
              title="Utilidad estimada"
              value={`$${utilidadEstimada.toFixed(2)}`}
              icon={<TrendingUp size={20} />}
            />

            <KpiCard
              title="Margen de utilidad"
              value={`${margenUtilidad.toFixed(1)}%`}
              icon={<TrendingUp size={20} />}
            />
          </div>

<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div className="bg-white border border-[#f3dede] rounded-[28px] p-6">
    <p className="text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
      Gastos pagados
    </p>

    <p className="text-3xl ivy text-[#8c0303]">
      ${gastosPagados.toFixed(2)}
    </p>
  </div>

  <div className="bg-white border border-[#f3dede] rounded-[28px] p-6">
    <p className="text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
      Gastos pendientes
    </p>

    <p className="text-3xl ivy text-[#8c0303]">
      ${gastosPendientes.toFixed(2)}
    </p>
  </div>

  <div className="bg-white border border-[#f3dede] rounded-[28px] p-6">
    <p className="text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
      Gastos programados
    </p>

    <p className="text-3xl ivy text-[#8c0303]">
      ${gastosProgramados.toFixed(2)}
    </p>
  </div>
</div>

<div className="bg-white border border-[#f3dede] rounded-[28px] p-6">
  <div className="flex items-start justify-between gap-4 mb-6">
    <div>
      <h2 className="text-[30px] ivy text-[#7a0000] leading-none">
        Resumen para inversor
      </h2>

      <p className="text-sm text-[#b07a7a] mt-2">
        Cálculo de participación sobre la utilidad neta del periodo filtrado.
      </p>
    </div>

    <div className="px-4 py-2 rounded-full bg-[#fff1f1] text-[#8c0303] text-sm font-semibold">
      {porcentajeInversor}% participación
    </div>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div className="border border-[#f3dede] rounded-2xl p-5 bg-[#fffafa]">
      <p className="text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
        Ingresos
      </p>

      <p className="text-3xl ivy text-[#8c0303]">
${ingresosMes.toFixed(2)}
      </p>
    </div>

    <div className="border border-[#f3dede] rounded-2xl p-5 bg-[#fffafa]">
      <p className="text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
        Gastos pagados
      </p>

      <p className="text-3xl ivy text-[#8c0303]">
        ${gastosPagados.toFixed(2)}
      </p>
    </div>

    <div className="border border-[#f3dede] rounded-2xl p-5 bg-[#fffafa]">
      <p className="text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
        Utilidad neta
      </p>

      <p className="text-3xl ivy text-[#8c0303]">
        ${utilidadNetaInversor.toFixed(2)}
      </p>
    </div>

    <div className="border border-[#f3dede] rounded-2xl p-5 bg-[#fffafa]">
      <p className="text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
        Ganancia inversor
      </p>

      <p className="text-3xl ivy text-[#8c0303]">
        ${gananciaInversor.toFixed(2)}
      </p>
    </div>
  </div>

  <div className="mt-5 rounded-2xl border border-[#f3dede] bg-[#fffafa] p-5">
    <p className="text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
      Utilidad después de participación
    </p>

    <p className="text-2xl ivy text-[#8c0303]">
      ${utilidadDespuesInversor.toFixed(2)}
    </p>

    <p className="text-sm text-[#b07a7a] mt-2">
      Esta cifra representa la utilidad restante del negocio luego de separar el 5% del inversor.
    </p>
  </div>
</div>

<div className="bg-white border border-[#f3dede] rounded-[28px] p-6">
  <div className="flex items-start justify-between gap-4 mb-6">
    <div>
      <h2 className="text-[30px] ivy text-[#7a0000] leading-none">
        Punto de equilibrio
      </h2>

      <p className="text-sm text-[#b07a7a] mt-2">
        Monto mínimo de ventas necesario para cubrir los gastos pagados del periodo.
      </p>
    </div>

    <div className="px-4 py-2 rounded-full bg-[#fff1f1] text-[#8c0303] text-sm font-semibold">
      {equilibrioCubierto ? 'Cubierto' : 'Pendiente'}
    </div>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div className="border border-[#f3dede] rounded-2xl p-5 bg-[#fffafa]">
      <p className="text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
        Punto de equilibrio
      </p>

      <p className="text-3xl ivy text-[#8c0303]">
        ${puntoEquilibrio.toFixed(2)}
      </p>
    </div>

    <div className="border border-[#f3dede] rounded-2xl p-5 bg-[#fffafa]">
      <p className="text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
        Ingresos actuales
      </p>

      <p className="text-3xl ivy text-[#8c0303]">
        ${ingresosMes.toFixed(2)}
      </p>
    </div>

    <div className="border border-[#f3dede] rounded-2xl p-5 bg-[#fffafa]">
      <p className="text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
        Faltante
      </p>

      <p className="text-3xl ivy text-[#8c0303]">
        ${faltanteParaEquilibrio.toFixed(2)}
      </p>
    </div>

    <div className="border border-[#f3dede] rounded-2xl p-5 bg-[#fffafa]">
      <p className="text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
        Excedente
      </p>

      <p className="text-3xl ivy text-[#8c0303]">
        ${excedenteSobreEquilibrio.toFixed(2)}
      </p>
    </div>
  </div>

  <div className="mt-5 h-3 bg-[#fff1f1] rounded-full overflow-hidden">
    <div
      className="h-full bg-[#8c0303] rounded-full"
      style={{
        width: `${puntoEquilibrio > 0 ? Math.min((ingresosMes / puntoEquilibrio) * 100, 100) : 100}%`,
      }}
    />
  </div>

  <p className="text-sm text-[#b07a7a] mt-3">
    {equilibrioCubierto
      ? 'El negocio ya cubrió sus gastos pagados del periodo filtrado.'
      : 'El negocio aún necesita generar más ingresos para cubrir sus gastos pagados del periodo filtrado.'}
  </p>
</div>

{/* FILTROS */}
<div className="bg-white border border-[#f3dede] rounded-[28px] p-5">
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
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
    </Field>

    <Field label="Tipo de gasto">
  <select
    name="tipo_gasto"
    value={form.tipo_gasto}
    onChange={handleChange}
    className={inputClass}
  >
    <option>Variable</option>
    <option>Fijo</option>
  </select>
</Field>

<Field label="Estado del pago">
  <select
    name="estado_pago"
    value={form.estado_pago}
    onChange={handleChange}
    className={inputClass}
  >
    <option>Pagado</option>
    <option>Pendiente</option>
    <option>Programado</option>
  </select>
</Field>

    <Field label="Método de pago">
      <select
        value={metodoPagoFiltro}
        onChange={(e) => setMetodoPagoFiltro(e.target.value)}
        className={inputClass}
      >
        <option>Todos</option>
        <option>Efectivo</option>
        <option>Yappy</option>
        <option>Tarjeta</option>
      </select>
    </Field>
  </div>

  <div className="flex flex-wrap items-center gap-3 mt-4">
    <button
      type="button"
      onClick={setFiltroHoy}
      className="px-5 py-2 rounded-full border border-[#efcccc] text-[#8c0303] bg-white font-semibold hover:bg-[#fff5f5] text-sm"
    >
      Hoy
    </button>

    <button
      type="button"
      onClick={setFiltroMesActual}
      className="px-5 py-2 rounded-full border border-[#efcccc] text-[#8c0303] bg-white font-semibold hover:bg-[#fff5f5] text-sm"
    >
      Este mes
    </button>

    <button
      type="button"
      onClick={() => {
        setFechaInicio('')
        setFechaFin('')
        setCategoriaFiltro('Todos')
        setMetodoPagoFiltro('Todos')
      }}
      className="px-5 py-2 rounded-full bg-[#8c0303] text-white font-semibold hover:bg-[#6f0202] text-sm"
    >
      Limpiar filtros
    </button>
  </div>
</div>

          <div className="bg-white border border-[#f3dede] rounded-[28px] p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[30px] ivy text-[#7a0000] leading-none">
  {editingGasto ? 'Editar gasto' : 'Registrar gasto'}
</h2>
                <p className="text-sm text-[#b07a7a] mt-2">
                  Agrega costos operativos, materia prima, packaging o gastos generales del negocio.
                </p>
                {successMessage && (
  <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
    {successMessage}
  </div>
)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Field label="Fecha">
                <input
                  type="date"
                  name="fecha"
                  value={form.fecha}
                  onChange={handleChange}
                  className={inputClass}
                />
              </Field>

              <Field label="Categoría">
                <select
                  name="categoria"
                  value={form.categoria}
                  onChange={handleChange}
                  className={inputClass}
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
              </Field>

<Field label="Tipo de gasto">
  <select
    name="tipo_gasto"
    value={form.tipo_gasto}
    onChange={handleChange}
    className={inputClass}
  >
    <option>Variable</option>
    <option>Fijo</option>
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
                <input
                  name="proveedor"
                  value={form.proveedor}
                  onChange={handleChange}
                  placeholder="Opcional"
                  className={inputClass}
                />
              </Field>

              <Field label="Método de pago">
                <select
                  name="metodo_pago"
                  value={form.metodo_pago}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option>Efectivo</option>
                  <option>Yappy</option>
                  <option>Tarjeta</option>
                </select>
              </Field>

<Field label="Estado del pago">
  <select
    name="estado_pago"
    value={form.estado_pago}
    onChange={handleChange}
    className={inputClass}
  >
    <option>Pagado</option>
    <option>Pendiente</option>
    <option>Programado</option>
  </select>
</Field>

              <Field label="Monto">
                <input
                  type="number"
                  name="monto"
                  value={form.monto}
                  onChange={handleChange}
                  placeholder="0.00"
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
    onChange={(e) => setFacturaFile(e.target.files?.[0] || null)}
    className={inputClass}
  />
</Field>

<div className="md:col-start-4 flex items-end gap-2">
  {editingGasto && (
    <button
      type="button"
      onClick={() => {
        setEditingGasto(null)
setForm({
  fecha: getTodayDate(),
  categoria: 'Materia prima',
  tipo_gasto: 'Variable',
  estado_pago: 'Pagado',
  concepto: '',
  proveedor: '',
  metodo_pago: 'Efectivo',
  monto: '',
  notas: '',
})
      }}
      className="w-full border border-[#efcaca] text-[#8c0303] px-5 py-3 rounded-xl font-semibold hover:bg-[#fff5f5]"
    >
      Cancelar
    </button>
  )}

  <button
    type="button"
    onClick={guardarGasto}
    disabled={saving}
    className="w-full bg-[#8c0303] text-white px-5 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
  >
    <Plus size={18} />
    {saving
      ? editingGasto
        ? 'Guardando cambios...'
        : 'Guardando...'
      : editingGasto
        ? 'Guardar cambios'
        : 'Agregar gasto'}
  </button>
</div>
            </div>
          </div>

<div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
<div className="xl:col-span-2 bg-white border border-[#f3dede] rounded-[28px] overflow-hidden">
    <div className="p-6 border-b border-[#f3dede] flex items-center justify-between gap-4">
      <div>
        <h2 className="text-[30px] ivy text-[#7a0000] leading-none">
          Gastos registrados
        </h2>

        <p className="text-sm text-[#b07a7a] mt-2">
          Historial de gastos operativos del negocio.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={exportarGastosCSV}
          className="border border-[#efcaca] text-[#8c0303] px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#fff5f5] text-sm"
        >
          <Download size={16} />
          CSV
        </button>

        <button
          type="button"
          onClick={exportarGastosExcel}
          className="border border-[#efcaca] text-[#8c0303] px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#fff5f5] text-sm"
        >
          <Download size={16} />
          Excel
        </button>
      </div>
    </div>

    <table className="w-full text-[12px]">
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
            <td colSpan="7" className="py-8 text-center text-[#b07a7a]">
              Cargando finanzas...
            </td>
          </tr>
        ) : gastosFiltrados.length === 0 ? (
          <tr>
            <td colSpan="7" className="py-8 text-center text-[#b07a7a]">
              No hay gastos registrados para estos filtros.
            </td>
          </tr>
        ) : (
          gastosFiltrados.map((gasto) => (
            <tr
              key={gasto.id}
              className="border-b border-[#f3dede] hover:bg-[#fffafa]"
            >
          <td className="py-4 px-3 whitespace-nowrap">{gasto.fecha}</td>
<td className="py-4 px-3">{gasto.categoria}</td>

<td className="py-4 px-5">
  <span className="px-3 py-1 rounded-full bg-[#fff1f1] text-[#8c0303] text-xs font-semibold">
    {gasto.tipo_gasto || 'Variable'}
  </span>
</td>

<td className="py-4 px-5">
  <span className="px-3 py-1 rounded-full bg-[#fffaf0] text-[#8c0303] text-xs font-semibold">
    {gasto.estado_pago || 'Pagado'}
  </span>
</td>

<td className="py-4 px-3 font-medium">
  {gasto.concepto}
</td>

<td className="py-4 px-3 whitespace-nowrap">
  {gasto.proveedor || 'No registrado'}
</td>
              <td className="py-4 px-3 font-semibold">
                ${Number(gasto.monto || 0).toFixed(2)}
              </td>
              <td className="py-4 px-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => editarGasto(gasto)}
                    className="border border-[#efcaca] text-[#8c0303] p-2 rounded-xl hover:bg-[#fff5f5]"
                    title="Editar gasto"
                  >
                    <Pencil size={11} />
                  </button>

{gasto.factura_path && (
  <button
    type="button"
    onClick={() => verFactura(gasto)}
    className="border border-[#efcaca] text-[#8c0303] px-3 py-2 rounded-xl hover:bg-[#fff5f5] text-xs font-semibold"
  >
    Ver factura
  </button>
)}

                  <button
                    type="button"
                    onClick={() => eliminarGasto(gasto.id)}
                    className="border border-[#efcaca] text-red-600 p-2 rounded-xl hover:bg-[#fff5f5]"
                    title="Eliminar gasto"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>

  <div className="bg-white border border-[#f3dede] rounded-[28px] p-6">
    <h2 className="text-[30px] ivy text-[#7a0000] leading-none mb-2">
      Gastos por categoría
    </h2>

    <p className="text-sm text-[#b07a7a] mb-5">
      Distribución de costos del periodo filtrado.
    </p>

    <div className="space-y-4">
      {Object.keys(gastosPorCategoria).length === 0 ? (
        <p className="text-sm text-[#b07a7a]">
          Aún no hay gastos para estos filtros.
        </p>
      ) : (
        Object.entries(gastosPorCategoria)
          .sort((a, b) => b[1] - a[1])
          .map(([categoria, monto]) => {
            const porcentaje =
              totalGastosMes > 0 ? (monto / totalGastosMes) * 100 : 0

            return (
              <div key={categoria}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-[#2e2e2e]">
                    {categoria}
                  </p>

                  <p className="font-semibold text-[#8c0303]">
                    ${monto.toFixed(2)}
                  </p>
                </div>



{resumenCategorias.length > 0 && (
  <div className="mt-8 pt-6 border-t border-[#f3dede]">
    <p className="text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-3">
      Resumen contable
    </p>

    <div className="overflow-hidden rounded-2xl border border-[#f3dede]">
      <table className="w-full text-sm">
        <thead className="bg-[#f8eeee] text-[#b07a7a] uppercase text-[10px] tracking-[0.12em]">
          <tr>
            <th className="py-3 px-4 text-left">Categoría</th>
            <th className="py-3 px-4 text-right">Total</th>
            <th className="py-3 px-4 text-right">%</th>
          </tr>
        </thead>

        <tbody>
          {resumenCategorias.map((item) => (
            <tr
              key={item.categoria}
              className="border-t border-[#f3dede]"
            >
              <td className="py-3 px-4 font-medium text-[#2e2e2e]">
                {item.categoria}
              </td>

              <td className="py-3 px-4 text-right font-semibold text-[#8c0303]">
                ${item.monto.toFixed(2)}
              </td>

              <td className="py-3 px-4 text-right text-[#b07a7a]">
                {item.porcentaje.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}

<div className="mt-3 mb-2 h-2 bg-[#fff1f1] rounded-full overflow-hidden">
  <div
    className="h-full bg-[#8c0303] rounded-full"
    style={{ width: `${porcentaje}%` }}
  />
</div>

                <p className="text-xs text-[#b07a7a] mt-1">
                  {porcentaje.toFixed(1)}% de los gastos
                </p>
              </div>
            )
          })
      )}
    </div>
  </div>
</div>

<div className="bg-white border border-[#f3dede] rounded-[28px] overflow-hidden">
  <div className="p-6 border-b border-[#f3dede]">
    <h2 className="text-[30px] ivy text-[#7a0000] leading-none">
      Ingresos vs gastos por mes
    </h2>

    <p className="text-sm text-[#b07a7a] mt-2">
      Comparativo mensual de ingresos, gastos y utilidad estimada.
    </p>
  </div>

  <table className="w-full text-sm">
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
          <td colSpan="7" className="py-8 text-center text-[#b07a7a]">
            Aún no hay datos suficientes para mostrar el resumen mensual.
          </td>
        </tr>
      ) : (
        resumenMensualLista.map((item) => (
          <tr
            key={formatearMes(item.mes)}
            className="border-b border-[#f3dede] hover:bg-[#fffafa]"
          >
            <td className="py-4 px-5 font-medium text-[#2e2e2e]">
              {formatearMes(item.mes)}
            </td>

            <td className="py-4 px-5 text-right font-semibold text-[#8c0303]">
              ${item.ingresos.toFixed(2)}
            </td>

            <td className="py-4 px-5 text-right font-semibold text-[#8c0303]">
              ${item.gastos.toFixed(2)}
            </td>

            <td className="py-4 px-5 text-right font-bold text-[#2e2e2e]">
              ${item.utilidad.toFixed(2)}
            </td>

            <td className="py-4 px-5 text-right font-bold text-[#8c0303]">
  {item.margen.toFixed(1)}%
</td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>

        </div>
      </section>
    </main>
  )
}

const inputClass =
  'w-full border border-[#efcaca] rounded-xl px-4 py-3 bg-white outline-none text-sm focus:border-[#8c0303]'

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
    <div className="bg-white border border-[#f3dede] rounded-[24px] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-3">
            {title}
          </p>
          <p className="text-[34px] ivy text-[#8c0303] leading-none">
            {value}
          </p>
        </div>

        <div className="w-11 h-11 rounded-2xl bg-[#fff1f1] text-[#8c0303] flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  )
}