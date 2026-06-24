'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Boxes,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  PackageOpen,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from 'lucide-react'

function formatCurrency(value) {
  return new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value || 0))
}

function formatNumber(value) {
  return new Intl.NumberFormat('es-PA').format(Number(value || 0))
}

function parseLocalDate(value) {
  if (!value) return null

  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDate(value) {
  const date = parseLocalDate(value)

  if (!date) return 'Sin fecha'

  return new Intl.DateTimeFormat('es-PA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function isPaid(expense) {
  const estado = normalizeText(expense.estado_pago)

  return (
    estado === 'pagado' ||
    estado === 'paid' ||
    estado === 'completado' ||
    estado === 'completada'
  )
}

function isBetween(dateValue, startDate, endDate) {
  const date = parseLocalDate(dateValue)

  if (!date) return false

  return date >= startDate && date <= endDate
}

function getMonthRange(referenceDate = new Date()) {
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth()

  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)

  return { start, end }
}

function getPreviousMonthRange(referenceDate = new Date()) {
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth()

  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)

  return { start, end }
}

function getLastSevenDays() {
  const days = []

  for (let index = 6; index >= 0; index--) {
    const date = new Date()
    date.setHours(12, 0, 0, 0)
    date.setDate(date.getDate() - index)

    days.push(date)
  }

  return days
}

function dateKey(value) {
  const date = parseLocalDate(value)

  if (!date) return ''

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(date.getDate()).padStart(2, '0')}`
}

function currentDateKey(value = new Date()) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(value.getDate()).padStart(2, '0')}`
}

function getDifferenceLabel(current, previous) {
  const currentValue = Number(current || 0)
  const previousValue = Number(previous || 0)

  if (previousValue === 0 && currentValue === 0) {
    return {
      value: 'Sin comparación',
      positive: true,
    }
  }

  if (previousValue === 0) {
    return {
      value: 'Nuevo movimiento',
      positive: true,
    }
  }

  const variation = ((currentValue - previousValue) / previousValue) * 100

  return {
    value: `${variation >= 0 ? '+' : ''}${variation.toFixed(1)}% vs. mes anterior`,
    positive: variation >= 0,
  }
}

export default function PanelDelSocioPage() {
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const [ventas, setVentas] = useState([])
  const [gastos, setGastos] = useState([])
  const [inventario, setInventario] = useState([])
  const [gastosRecurrentes, setGastosRecurrentes] = useState([])

  useEffect(() => {
    cargarPanel()
  }, [])

  async function cargarPanel() {
    setLoading(true)

    const fechaReferencia = new Date()
    const { start: mesAnteriorInicio } =
      getPreviousMonthRange(fechaReferencia)

    const fechaDesde = currentDateKey(mesAnteriorInicio)

    const [
      ventasResponse,
      gastosResponse,
      inventarioResponse,
      recurrentesResponse,
    ] = await Promise.all([
      supabase
        .from('ventas')
        .select(
          'id, fecha, cliente, producto, cantidad, monto_pago, tipo_pedido, metodo_pago, created_at'
        )
        .gte('fecha', fechaDesde)
        .order('fecha', { ascending: false }),

      supabase
        .from('gastos')
        .select(
          'id, fecha, concepto, categoria, proveedor, monto, estado_pago, metodo_pago, notas, created_at'
        )
        .gte('fecha', fechaDesde)
        .order('fecha', { ascending: false }),

      supabase
        .from('inventario')
        .select(
          'id, nombre, categoria, unidad, stock_actual, stock_minimo, costo_unitario, activo'
        )
        .order('nombre', { ascending: true }),

      supabase
        .from('gastos_recurrentes')
        .select(
          'id, nombre, categoria, proveedor, monto, dia_generacion, requiere_revision, activo'
        )
        .eq('activo', true)
        .order('dia_generacion', { ascending: true }),
    ])

    if (ventasResponse.error) {
      console.error('Error cargando ventas del panel del socio:', ventasResponse.error)
    }

    if (gastosResponse.error) {
      console.error('Error cargando gastos del panel del socio:', gastosResponse.error)
    }

    if (inventarioResponse.error) {
      console.error(
        'Error cargando inventario del panel del socio:',
        inventarioResponse.error
      )
    }

    if (recurrentesResponse.error) {
      console.error(
        'Error cargando gastos recurrentes del panel del socio:',
        recurrentesResponse.error
      )
    }

    setVentas(ventasResponse.data || [])
    setGastos(gastosResponse.data || [])
    setInventario(inventarioResponse.data || [])
    setGastosRecurrentes(recurrentesResponse.data || [])
    setLastUpdate(new Date())
    setLoading(false)
  }

  const resumen = useMemo(() => {
    const hoy = new Date()

    const { start: inicioMes, end: finMes } = getMonthRange(hoy)
    const { start: inicioMesAnterior, end: finMesAnterior } =
      getPreviousMonthRange(hoy)

    const ventasMes = ventas.filter((item) =>
      isBetween(item.fecha, inicioMes, finMes)
    )

    const ventasMesAnterior = ventas.filter((item) =>
      isBetween(item.fecha, inicioMesAnterior, finMesAnterior)
    )

    const gastosMes = gastos.filter((item) =>
      isBetween(item.fecha, inicioMes, finMes)
    )

    const gastosMesAnterior = gastos.filter((item) =>
      isBetween(item.fecha, inicioMesAnterior, finMesAnterior)
    )

    const totalVentas = ventasMes.reduce(
      (total, item) => total + Number(item.monto_pago || 0),
      0
    )

    const totalVentasAnterior = ventasMesAnterior.reduce(
      (total, item) => total + Number(item.monto_pago || 0),
      0
    )

    const gastosPagados = gastosMes
      .filter(isPaid)
      .reduce((total, item) => total + Number(item.monto || 0), 0)

    const gastosPendientes = gastosMes
      .filter((item) => !isPaid(item))
      .reduce((total, item) => total + Number(item.monto || 0), 0)

    const gastosTotales = gastosMes.reduce(
      (total, item) => total + Number(item.monto || 0),
      0
    )

    const gastosTotalesAnterior = gastosMesAnterior.reduce(
      (total, item) => total + Number(item.monto || 0),
      0
    )

    const utilidadEstimada = totalVentas - gastosTotales
    const flujoNeto = totalVentas - gastosPagados
    const ticketPromedio =
      ventasMes.length > 0 ? totalVentas / ventasMes.length : 0

    const utilidadAnterior = totalVentasAnterior - gastosTotalesAnterior

    return {
      totalVentas,
      totalVentasAnterior,
      ventasMes,
      gastosMes,
      gastosPagados,
      gastosPendientes,
      gastosTotales,
      utilidadEstimada,
      utilidadAnterior,
      flujoNeto,
      ticketPromedio,
      totalPedidos: ventasMes.length,
      comparativoVentas: getDifferenceLabel(
        totalVentas,
        totalVentasAnterior
      ),
      comparativoUtilidad: getDifferenceLabel(
        utilidadEstimada,
        utilidadAnterior
      ),
    }
  }, [ventas, gastos])

  const ventasUltimosSieteDias = useMemo(() => {
    const days = getLastSevenDays()

    return days.map((day) => {
      const key = currentDateKey(day)

      const total = ventas
        .filter((venta) => dateKey(venta.fecha) === key)
        .reduce(
          (sum, venta) => sum + Number(venta.monto_pago || 0),
          0
        )

      return {
        key,
        label: new Intl.DateTimeFormat('es-PA', {
          weekday: 'short',
          day: 'numeric',
        })
          .format(day)
          .replace('.', ''),
        total,
      }
    })
  }, [ventas])

  const productosTop = useMemo(() => {
    const totals = {}

    resumen.ventasMes.forEach((venta) => {
      const nombre = venta.producto || 'Producto no especificado'

      if (!totals[nombre]) {
        totals[nombre] = {
          nombre,
          cantidad: 0,
          ingresos: 0,
        }
      }

      totals[nombre].cantidad += Number(venta.cantidad || 1)
      totals[nombre].ingresos += Number(venta.monto_pago || 0)
    })

    return Object.values(totals)
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, 5)
  }, [resumen.ventasMes])

  const canales = useMemo(() => {
    const totals = {}

    resumen.ventasMes.forEach((venta) => {
      const nombre = venta.tipo_pedido || 'Sin canal'

      if (!totals[nombre]) {
        totals[nombre] = {
          nombre,
          total: 0,
          ventas: 0,
        }
      }

      totals[nombre].total += Number(venta.monto_pago || 0)
      totals[nombre].ventas += 1
    })

    return Object.values(totals).sort((a, b) => b.total - a.total)
  }, [resumen.ventasMes])

  const inventarioCritico = useMemo(() => {
    return inventario
      .filter((item) => {
        const actual = Number(item.stock_actual || 0)
        const minimo = Number(item.stock_minimo || 0)

        return actual <= minimo
      })
      .sort(
        (a, b) =>
          Number(a.stock_actual || 0) - Number(b.stock_actual || 0)
      )
      .slice(0, 6)
  }, [inventario])

  const gastosProximos = useMemo(() => {
    const hoy = new Date()
    const diaActual = hoy.getDate()
    const ultimoDiaMes = new Date(
      hoy.getFullYear(),
      hoy.getMonth() + 1,
      0
    ).getDate()

    return gastosRecurrentes
      .map((item) => ({
        ...item,
        diaReal: Math.min(Number(item.dia_generacion || 1), ultimoDiaMes),
      }))
      .filter((item) => item.diaReal >= diaActual)
      .sort((a, b) => a.diaReal - b.diaReal)
      .slice(0, 5)
  }, [gastosRecurrentes])

  const ultimasVentas = useMemo(() => {
    return [...ventas]
      .sort((a, b) => {
        const dateA = parseLocalDate(a.fecha)?.getTime() || 0
        const dateB = parseLocalDate(b.fecha)?.getTime() || 0

        return dateB - dateA
      })
      .slice(0, 6)
  }, [ventas])

  const maxVentasDia = Math.max(
    ...ventasUltimosSieteDias.map((item) => item.total),
    1
  )

  return (
    <main className="min-h-screen bg-[#fcf8f8]">
      <header className="border-b border-[#f1dede] bg-white px-5 py-3 md:flex md:h-[82px] md:items-center md:px-8 md:py-0">
        <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
              Vista ejecutiva · solo lectura
            </p>

            <h1 className="mt-1 text-[21px] font-bold leading-tight text-[#7a0000] md:text-[23px]">
              Panel del socio
            </h1>

            <p className="mt-1 text-xs text-[#b07a7a] md:text-sm">
              Visión consolidada del desempeño comercial, financiero y operativo.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
            <div className="rounded-xl bg-[#fff5f5] px-4 py-2 text-center text-xs text-[#b07a7a] sm:text-left">
              Actualizado:{' '}
              <span className="font-semibold text-[#7a0000]">
                {lastUpdate.toLocaleTimeString('es-PA', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <button
              type="button"
              onClick={cargarPanel}
              disabled={loading}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#efcccc] bg-white px-4 text-sm font-semibold text-[#8c0303] hover:bg-[#fff5f5] disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={loading ? 'animate-spin' : ''}
              />
              Actualizar
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1600px] space-y-5 px-4 py-5 md:px-8 md:py-7">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Ventas del mes"
            value={formatCurrency(resumen.totalVentas)}
            detail={`${formatNumber(resumen.totalPedidos)} ventas registradas`}
            icon={<TrendingUp size={19} />}
            comparison={resumen.comparativoVentas}
          />

          <MetricCard
            label="Gastos pagados"
            value={formatCurrency(resumen.gastosPagados)}
            detail="Salidas de dinero confirmadas"
            icon={<Wallet size={19} />}
          />

          <MetricCard
            label="Utilidad estimada"
            value={formatCurrency(resumen.utilidadEstimada)}
            detail="Ventas menos todos los gastos registrados"
            icon={<CircleDollarSign size={19} />}
            comparison={resumen.comparativoUtilidad}
            negative={resumen.utilidadEstimada < 0}
          />

          <MetricCard
            label="Flujo neto actual"
            value={formatCurrency(resumen.flujoNeto)}
            detail="Ventas menos gastos ya pagados"
            icon={<CreditCard size={19} />}
            negative={resumen.flujoNeto < 0}
          />
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_.9fr]">
          <article className="rounded-[28px] border border-[#f3dede] bg-white p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
                  Comportamiento comercial
                </p>

                <h2 className="mt-1 text-[21px] font-bold text-[#7a0000]">
                  Ventas de los últimos 7 días
                </h2>

                <p className="mt-1 text-sm text-[#b07a7a]">
                  Movimiento diario basado en ventas registradas.
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#fff1f1] text-[#8c0303]">
                <BarChart3 size={19} />
              </div>
            </div>

            <div className="mt-7 flex h-[235px] items-end gap-2 sm:gap-4">
              {ventasUltimosSieteDias.map((item) => {
                const height = Math.max(
                  (item.total / maxVentasDia) * 100,
                  item.total > 0 ? 8 : 2
                )

                return (
                  <div
                    key={item.key}
                    className="flex min-w-0 flex-1 flex-col items-center justify-end gap-3"
                  >
                    <p className="text-[11px] font-semibold text-[#7a0000]">
                      {item.total > 0 ? formatCurrency(item.total) : '—'}
                    </p>

                    <div className="flex h-[155px] w-full items-end rounded-t-2xl bg-[#fff7f7] px-1">
                      <div
                        className="w-full rounded-t-xl bg-[#8c0303] transition-all duration-500"
                        style={{ height: `${height}%` }}
                      />
                    </div>

                    <p className="truncate text-[10px] uppercase tracking-[0.08em] text-[#b07a7a]">
                      {item.label}
                    </p>
                  </div>
                )
              })}
            </div>
          </article>

          <article className="rounded-[28px] border border-[#f3dede] bg-white p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
                  Indicadores clave
                </p>

                <h2 className="mt-1 text-[21px] font-bold text-[#7a0000]">
                  Resumen financiero
                </h2>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#fff1f1] text-[#8c0303]">
                <ClipboardList size={19} />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <SummaryRow
                label="Ticket promedio"
                value={formatCurrency(resumen.ticketPromedio)}
              />

              <SummaryRow
                label="Gastos pendientes"
                value={formatCurrency(resumen.gastosPendientes)}
                warning={resumen.gastosPendientes > 0}
              />

              <SummaryRow
                label="Gastos registrados"
                value={formatCurrency(resumen.gastosTotales)}
              />

              <SummaryRow
                label="Compromisos recurrentes activos"
                value={formatCurrency(
                  gastosRecurrentes.reduce(
                    (total, item) => total + Number(item.monto || 0),
                    0
                  )
                )}
              />
            </div>

            <div className="mt-6 rounded-2xl border border-[#f0dfc7] bg-[#fff9ee] p-4">
              <p className="text-xs font-semibold text-[#8c6500]">
                Lectura correcta de las cifras
              </p>

              <p className="mt-2 text-xs leading-relaxed text-[#806b4c]">
                La utilidad estimada descuenta todos los gastos registrados,
                incluyendo los pendientes. El flujo neto solo descuenta gastos
                que ya fueron pagados.
              </p>
            </div>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <article className="rounded-[28px] border border-[#f3dede] bg-white p-5 md:p-6">
            <SectionHeader
              eyebrow="Rendimiento"
              title="Productos más vendidos"
              icon={<ShoppingBag size={18} />}
            />

            <div className="mt-5 space-y-3">
              {productosTop.length === 0 ? (
                <EmptyState text="Todavía no hay ventas registradas este mes." />
              ) : (
                productosTop.map((item, index) => (
                  <div
                    key={item.nombre}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-[#fffafa] p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-bold text-[#8c0303]">
                        {index + 1}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#2e2e2e]">
                          {item.nombre}
                        </p>

                        <p className="mt-1 text-xs text-[#b07a7a]">
                          {formatNumber(item.cantidad)} unidad(es)
                        </p>
                      </div>
                    </div>

                    <p className="shrink-0 text-sm font-bold text-[#7a0000]">
                      {formatCurrency(item.ingresos)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="rounded-[28px] border border-[#f3dede] bg-white p-5 md:p-6">
            <SectionHeader
              eyebrow="Canales"
              title="Origen de las ventas"
              icon={<PackageOpen size={18} />}
            />

            <div className="mt-5 space-y-3">
              {canales.length === 0 ? (
                <EmptyState text="No hay canales con ventas registradas este mes." />
              ) : (
                canales.map((item) => (
                  <div
                    key={item.nombre}
                    className="rounded-2xl border border-[#f3dede] p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[#2e2e2e]">
                        {item.nombre}
                      </p>

                      <p className="text-sm font-bold text-[#7a0000]">
                        {formatCurrency(item.total)}
                      </p>
                    </div>

                    <p className="mt-1 text-xs text-[#b07a7a]">
                      {formatNumber(item.ventas)} venta(s) registrada(s)
                    </p>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="rounded-[28px] border border-[#f3dede] bg-white p-5 md:p-6">
            <SectionHeader
              eyebrow="Control"
              title="Inventario crítico"
              icon={<Boxes size={18} />}
            />

            <div className="mt-5 space-y-3">
              {inventarioCritico.length === 0 ? (
                <EmptyState text="No hay productos con inventario en nivel crítico." />
              ) : (
                inventarioCritico.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-red-100 bg-red-50 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#7a0000]">
                          {item.nombre}
                        </p>

                        <p className="mt-1 text-xs text-red-700">
                          Mínimo esperado: {item.stock_minimo || 0}{' '}
                          {item.unidad || ''}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-red-700">
                        {item.stock_actual || 0} {item.unidad || ''}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <article className="overflow-hidden rounded-[28px] border border-[#f3dede] bg-white">
            <div className="border-b border-[#f3dede] p-5 md:p-6">
              <SectionHeader
                eyebrow="Actividad reciente"
                title="Últimas ventas registradas"
                icon={<CalendarDays size={18} />}
              />
            </div>

            <div className="divide-y divide-[#f3dede]">
              {ultimasVentas.length === 0 ? (
                <div className="p-7">
                  <EmptyState text="Aún no hay ventas recientes para mostrar." />
                </div>
              ) : (
                ultimasVentas.map((venta) => (
                  <div
                    key={venta.id}
                    className="flex items-center justify-between gap-4 p-4 md:px-6"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#2e2e2e]">
                        {venta.producto || 'Producto no especificado'}
                      </p>

                      <p className="mt-1 text-xs text-[#b07a7a]">
                        {formatDate(venta.fecha)} ·{' '}
                        {venta.cliente || 'Cliente no registrado'}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-[#7a0000]">
                        {formatCurrency(venta.monto_pago)}
                      </p>

                      <p className="mt-1 text-xs text-[#b07a7a]">
                        {venta.tipo_pedido || 'Sin canal'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="overflow-hidden rounded-[28px] border border-[#f3dede] bg-white">
            <div className="border-b border-[#f3dede] p-5 md:p-6">
              <SectionHeader
                eyebrow="Compromisos próximos"
                title="Gastos recurrentes por generar"
                icon={<AlertTriangle size={18} />}
              />
            </div>

            <div className="divide-y divide-[#f3dede]">
              {gastosProximos.length === 0 ? (
                <div className="p-7">
                  <EmptyState text="No hay gastos recurrentes pendientes para el resto del mes." />
                </div>
              ) : (
                gastosProximos.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 p-4 md:px-6"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#2e2e2e]">
                        {item.nombre}
                      </p>

                      <p className="mt-1 text-xs text-[#b07a7a]">
                        Día {item.diaReal} · {item.categoria || 'Sin categoría'}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-[#7a0000]">
                        {formatCurrency(item.monto)}
                      </p>

                      <p className="mt-1 text-xs text-[#b07a7a]">
                        {item.requiere_revision
                          ? 'Requiere revisión'
                          : 'Automático'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>

        <section className="rounded-[24px] border border-[#f0dfc7] bg-[#fff9ee] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#9c6500]">
              <AlertTriangle size={18} />
            </div>

            <div>
              <p className="text-sm font-bold text-[#7a0000]">
                Alertas ejecutivas
              </p>

              <div className="mt-2 space-y-1 text-sm leading-relaxed text-[#806b4c]">
                <p>
                  • {inventarioCritico.length} producto(s) se encuentran en nivel
                  crítico o por debajo de su mínimo.
                </p>

                <p>
                  • Hay {formatCurrency(resumen.gastosPendientes)} en gastos
                  pendientes dentro del mes actual.
                </p>

                <p>
                  • Los compromisos recurrentes activos suman{' '}
                  {formatCurrency(
                    gastosRecurrentes.reduce(
                      (total, item) => total + Number(item.monto || 0),
                      0
                    )
                  )}{' '}
                  mensuales.
                </p>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  )
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  comparison,
  negative = false,
}) {
  return (
    <article className="rounded-[24px] border border-[#f3dede] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#b9a0a0]">
            {label}
          </p>

          <p
            className={`mt-3 text-[27px] font-bold leading-none md:text-[30px] ${
              negative ? 'text-red-600' : 'text-[#7a0000]'
            }`}
          >
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#fff1f1] text-[#8c0303]">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-[#b07a7a]">{detail}</p>

      {comparison && (
        <div
          className={`mt-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
            comparison.positive
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {comparison.positive ? (
            <ArrowUpRight size={13} />
          ) : (
            <ArrowDownRight size={13} />
          )}

          {comparison.value}
        </div>
      )}
    </article>
  )
}

function SummaryRow({ label, value, warning = false }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#fffafa] p-3">
      <p className="text-sm text-[#755c5c]">{label}</p>

      <p
        className={`text-sm font-bold ${
          warning ? 'text-amber-700' : 'text-[#7a0000]'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function SectionHeader({ eyebrow, title, icon }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-[20px] font-bold text-[#7a0000]">
          {title}
        </h2>
      </div>

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#fff1f1] text-[#8c0303]">
        {icon}
      </div>
    </div>
  )
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl bg-[#fffafa] p-4 text-center text-sm text-[#b07a7a]">
      {text}
    </div>
  )
}