'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  CalendarDays,
  DollarSign,
  RefreshCw,
  Search,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}

export default function VentasPage() {
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [sucursal, setSucursal] = useState('Todos')
  const [metodoPago, setMetodoPago] = useState('Todos')
  const [producto, setProducto] = useState('Todos')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  useEffect(() => {
    fetchVentas()
  }, [])

  async function fetchVentas() {
    setLoading(true)

    const { data, error } = await supabase
      .from('ventas')
      .select('*')
      .not('producto', 'is', null)
      .not('monto_pago', 'is', null)
      .order('fecha', { ascending: false })

    if (error) {
      console.error('Error cargando ventas:', error)
      alert('No se pudieron cargar las ventas.')
      setLoading(false)
      return
    }

    setVentas(data || [])
    setLoading(false)
  }

  const sucursales = useMemo(() => {
    return [
      'Todos',
      ...new Set(
        ventas
          .map((venta) => venta.tipo_pedido || venta.sucursal)
          .filter(Boolean)
      ),
    ]
  }, [ventas])

  const metodosPago = useMemo(() => {
    return [
      'Todos',
      ...new Set(
        ventas.map((venta) => venta.metodo_pago).filter(Boolean)
      ),
    ]
  }, [ventas])

  const productos = useMemo(() => {
    return [
      'Todos',
      ...new Set(
        ventas.map((venta) => venta.producto).filter(Boolean)
      ),
    ]
  }, [ventas])

  const ventasFiltradas = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return ventas.filter((venta) => {
      const text = `
        ${venta.cliente || ''}
        ${venta.producto || ''}
        ${venta.metodo_pago || ''}
        ${venta.vendedor || ''}
        ${venta.tipo_pedido || ''}
        ${venta.sucursal || ''}
      `.toLowerCase()

      const matchesSearch =
        !normalizedSearch || text.includes(normalizedSearch)

      const matchesSucursal =
        sucursal === 'Todos' ||
        venta.tipo_pedido === sucursal ||
        venta.sucursal === sucursal

      const matchesMetodoPago =
        metodoPago === 'Todos' ||
        venta.metodo_pago === metodoPago

      const matchesProducto =
        producto === 'Todos' || venta.producto === producto

      const ventaFecha =
        venta.fecha || venta.created_at?.split('T')[0] || ''

      const matchesFechaInicio =
        !fechaInicio || ventaFecha >= fechaInicio

      const matchesFechaFin =
        !fechaFin || ventaFecha <= fechaFin

      return (
        matchesSearch &&
        matchesSucursal &&
        matchesMetodoPago &&
        matchesProducto &&
        matchesFechaInicio &&
        matchesFechaFin
      )
    })
  }, [
    ventas,
    search,
    sucursal,
    metodoPago,
    producto,
    fechaInicio,
    fechaFin,
  ])

  const ingresosTotales = useMemo(() => {
    return ventasFiltradas.reduce(
      (total, venta) => total + Number(venta.monto_pago || 0),
      0
    )
  }, [ventasFiltradas])

  const totalTransacciones = ventasFiltradas.length

  const ticketPromedio =
    totalTransacciones > 0
      ? ingresosTotales / totalTransacciones
      : 0

  const ventasPorProducto = useMemo(() => {
    return Object.values(
      ventasFiltradas.reduce((accumulator, venta) => {
        const nombre = venta.producto || 'Sin producto'
        const monto = Number(venta.monto_pago || 0)

        if (!accumulator[nombre]) {
          accumulator[nombre] = {
            producto: nombre,
            ventas: 0,
            ingresos: 0,
          }
        }

        accumulator[nombre].ventas += 1
        accumulator[nombre].ingresos += monto

        return accumulator
      }, {})
    ).sort((a, b) => b.ingresos - a.ingresos)
  }, [ventasFiltradas])

  const ventasPorSucursal = useMemo(() => {
    return Object.values(
      ventasFiltradas.reduce((accumulator, venta) => {
        const nombre =
          venta.tipo_pedido ||
          venta.sucursal ||
          'Sin sucursal'

        const monto = Number(venta.monto_pago || 0)

        if (!accumulator[nombre]) {
          accumulator[nombre] = {
            sucursal: nombre,
            ingresos: 0,
            ventas: 0,
          }
        }

        accumulator[nombre].ingresos += monto
        accumulator[nombre].ventas += 1

        return accumulator
      }, {})
    ).sort((a, b) => b.ingresos - a.ingresos)
  }, [ventasFiltradas])

  const ventasPorMetodo = useMemo(() => {
    return Object.values(
      ventasFiltradas.reduce((accumulator, venta) => {
        const nombre = venta.metodo_pago || 'Sin método'
        const monto = Number(venta.monto_pago || 0)

        if (!accumulator[nombre]) {
          accumulator[nombre] = {
            metodo: nombre,
            ingresos: 0,
            ventas: 0,
          }
        }

        accumulator[nombre].ingresos += monto
        accumulator[nombre].ventas += 1

        return accumulator
      }, {})
    ).sort((a, b) => b.ingresos - a.ingresos)
  }, [ventasFiltradas])

  const productoEstrella = ventasPorProducto[0]

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

    const lastDay = new Date(
      year,
      today.getMonth() + 1,
      0
    )
      .toISOString()
      .split('T')[0]

    setFechaInicio(firstDay)
    setFechaFin(lastDay)
  }

  function limpiarFiltros() {
    setSearch('')
    setFechaInicio('')
    setFechaFin('')
    setSucursal('Todos')
    setProducto('Todos')
    setMetodoPago('Todos')
  }

  const inputClass =
    'w-full h-[46px] px-4 rounded-xl border border-[#efcccc] bg-white outline-none text-sm text-[#2e2e2e] focus:border-[#8c0303] focus:ring-2 focus:ring-[#fff1f1]'

  return (
    <main className="min-h-screen bg-[#fcf8f8]">
      <header className="bg-white border-b border-[#f1dede] px-5 md:px-8 py-3 md:h-[82px] md:py-0 md:flex md:items-center">
        <div className="w-full max-w-none">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
                Análisis comercial
              </p>

              <h1 className="mt-1 text-[21px] md:text-[23px] font-bold text-[#7a0000] leading-tight">
                Análisis de ventas
              </h1>

              <p className="mt-1 text-xs md:text-sm text-[#b07a7a]">
                Revisa ingresos, productos, puntos de venta y métodos de pago.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchVentas}
              disabled={loading}
              className="w-full sm:w-auto h-10 px-4 rounded-xl border border-[#efcaca] bg-white text-[#8c0303] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#fff5f5] disabled:opacity-60"
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

      <section className="max-w-[1500px] mx-auto px-4 md:px-8 py-5 md:py-7 space-y-5">
        <section className="bg-white border border-[#f3dede] rounded-[26px] p-5 md:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-[#fff1f1] text-[#8c0303] flex items-center justify-center">
              <Search size={18} />
            </div>

            <div>
              <h2 className="text-[18px] font-bold text-[#7a0000]">
                Filtros de análisis
              </h2>

              <p className="text-xs md:text-sm text-[#b07a7a] mt-1">
                Ajusta el período y los datos que deseas revisar.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#b07a7a] mb-2">
                Buscar
              </label>

              <div className="flex items-center gap-2 border border-[#efcccc] rounded-xl px-4 bg-[#fffafa] h-[46px] focus-within:border-[#8c0303] focus-within:ring-2 focus-within:ring-[#fff1f1]">
                <Search size={17} className="text-[#b07a7a] shrink-0" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Producto, vendedor o pago..."
                  className="w-full bg-transparent outline-none text-sm text-[#2e2e2e]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#b07a7a] mb-2">
                Desde
              </label>

              <input
                type="date"
                value={fechaInicio}
                onChange={(event) => setFechaInicio(event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#b07a7a] mb-2">
                Hasta
              </label>

              <input
                type="date"
                value={fechaFin}
                onChange={(event) => setFechaFin(event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#b07a7a] mb-2">
                Sucursal o canal
              </label>

              <select
                value={sucursal}
                onChange={(event) => setSucursal(event.target.value)}
                className={inputClass}
              >
                {sucursales.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#b07a7a] mb-2">
                Producto
              </label>

              <select
                value={producto}
                onChange={(event) => setProducto(event.target.value)}
                className={inputClass}
              >
                {productos.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#b07a7a] mb-2">
                Método de pago
              </label>

              <select
                value={metodoPago}
                onChange={(event) => setMetodoPago(event.target.value)}
                className={inputClass}
              >
                {metodosPago.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-5">
            <button
              type="button"
              onClick={setFiltroHoy}
              className="px-4 py-2 rounded-full border border-[#efcccc] text-[#8c0303] bg-white hover:bg-[#fff5f5] text-sm font-semibold"
            >
              Hoy
            </button>

            <button
              type="button"
              onClick={setFiltroMesActual}
              className="px-4 py-2 rounded-full border border-[#efcccc] text-[#8c0303] bg-white hover:bg-[#fff5f5] text-sm font-semibold"
            >
              Este mes
            </button>

            <button
              type="button"
              onClick={limpiarFiltros}
              className="px-4 py-2 rounded-full bg-[#8c0303] text-white hover:bg-[#720000] text-sm font-semibold"
            >
              Limpiar filtros
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label="Ingresos filtrados"
            value={formatCurrency(ingresosTotales)}
            icon={<DollarSign size={20} />}
          />

          <KpiCard
            label="Transacciones"
            value={totalTransacciones}
            icon={<ShoppingBag size={20} />}
          />

          <KpiCard
            label="Ticket promedio"
            value={formatCurrency(ticketPromedio)}
            icon={<TrendingUp size={20} />}
          />

          <KpiCard
            label="Producto estrella"
            value={productoEstrella?.producto || 'Sin datos'}
            icon={<CalendarDays size={20} />}
            compact
          />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <article className="bg-white border border-[#f3dede] rounded-[26px] p-5 md:p-6">
            <h2 className="text-[18px] md:text-[20px] font-bold text-[#7a0000]">
              Ventas por producto
            </h2>

            <p className="text-sm text-[#b07a7a] mt-1">
              Productos con mayores ingresos dentro de los filtros seleccionados.
            </p>

            <div className="w-full h-[280px] mt-5">
              {ventasPorProducto.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ventasPorProducto.slice(0, 8)}
                    margin={{
                      top: 10,
                      right: 6,
                      left: -16,
                      bottom: 10,
                    }}
                  >
                    <CartesianGrid
                      stroke="#f3dede"
                      strokeDasharray="4 4"
                    />

                    <XAxis
                      dataKey="producto"
                      tick={{ fontSize: 10 }}
                      interval={0}
                      angle={-18}
                      textAnchor="end"
                      height={65}
                    />

                    <YAxis tick={{ fontSize: 10 }} />

                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                    />

                    <Bar
                      dataKey="ingresos"
                      fill="#8c0303"
                      radius={[9, 9, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState text="No hay datos suficientes para mostrar." />
              )}
            </div>
          </article>

          <article className="bg-white border border-[#f3dede] rounded-[26px] p-5 md:p-6">
            <h2 className="text-[18px] md:text-[20px] font-bold text-[#7a0000]">
              Ventas por sucursal
            </h2>

            <p className="text-sm text-[#b07a7a] mt-1">
              Rendimiento por punto de venta o tipo de pedido.
            </p>

            <div className="space-y-3 mt-5">
              {ventasPorSucursal.length === 0 ? (
                <EmptyState text="No hay datos para mostrar." />
              ) : (
                ventasPorSucursal.map((item) => (
                  <div
                    key={item.sucursal}
                    className="border border-[#f3dede] rounded-2xl p-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[#2e2e2e] break-words">
                        {item.sucursal}
                      </p>

                      <p className="text-xs text-[#b07a7a] mt-1">
                        {item.ventas} transacciones
                      </p>
                    </div>

                    <p className="text-[#8c0303] font-bold shrink-0">
                      {formatCurrency(item.ingresos)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <article className="bg-white border border-[#f3dede] rounded-[26px] overflow-hidden">
            <div className="p-5 md:p-6 border-b border-[#f3dede]">
              <h2 className="text-[18px] md:text-[20px] font-bold text-[#7a0000]">
                Ranking de productos
              </h2>
            </div>

            <div className="md:hidden divide-y divide-[#f3dede]">
              {ventasPorProducto.length === 0 ? (
                <EmptyState text="No hay productos para mostrar." />
              ) : (
                ventasPorProducto.map((item) => (
                  <div
                    key={item.producto}
                    className="px-5 py-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[#2e2e2e] break-words">
                        {item.producto}
                      </p>

                      <p className="text-xs text-[#b07a7a] mt-1">
                        {item.ventas} ventas
                      </p>
                    </div>

                    <p className="font-bold text-[#8c0303] shrink-0">
                      {formatCurrency(item.ingresos)}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f8eeee] text-[#b07a7a] uppercase text-[11px] tracking-[0.14em]">
                  <tr>
                    <th className="py-4 px-5 text-left">Producto</th>
                    <th className="py-4 px-5 text-left">Ventas</th>
                    <th className="py-4 px-5 text-left">Ingresos</th>
                  </tr>
                </thead>

                <tbody>
                  {ventasPorProducto.length === 0 ? (
                    <tr>
                      <td
                        colSpan="3"
                        className="py-10 text-center text-[#b07a7a]"
                      >
                        No hay productos para mostrar.
                      </td>
                    </tr>
                  ) : (
                    ventasPorProducto.map((item) => (
                      <tr
                        key={item.producto}
                        className="border-b border-[#f9eded]"
                      >
                        <td className="py-4 px-5 font-semibold text-[#2e2e2e]">
                          {item.producto}
                        </td>

                        <td className="py-4 px-5">{item.ventas}</td>

                        <td className="py-4 px-5 font-bold text-[#8c0303]">
                          {formatCurrency(item.ingresos)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="bg-white border border-[#f3dede] rounded-[26px] overflow-hidden">
            <div className="p-5 md:p-6 border-b border-[#f3dede]">
              <h2 className="text-[18px] md:text-[20px] font-bold text-[#7a0000]">
                Métodos de pago
              </h2>
            </div>

            <div className="md:hidden divide-y divide-[#f3dede]">
              {ventasPorMetodo.length === 0 ? (
                <EmptyState text="No hay métodos de pago para mostrar." />
              ) : (
                ventasPorMetodo.map((item) => (
                  <div
                    key={item.metodo}
                    className="px-5 py-4 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-semibold text-[#2e2e2e]">
                        {item.metodo}
                      </p>

                      <p className="text-xs text-[#b07a7a] mt-1">
                        {item.ventas} ventas
                      </p>
                    </div>

                    <p className="font-bold text-[#8c0303]">
                      {formatCurrency(item.ingresos)}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f8eeee] text-[#b07a7a] uppercase text-[11px] tracking-[0.14em]">
                  <tr>
                    <th className="py-4 px-5 text-left">Método</th>
                    <th className="py-4 px-5 text-left">Ventas</th>
                    <th className="py-4 px-5 text-left">Ingresos</th>
                  </tr>
                </thead>

                <tbody>
                  {ventasPorMetodo.length === 0 ? (
                    <tr>
                      <td
                        colSpan="3"
                        className="py-10 text-center text-[#b07a7a]"
                      >
                        No hay métodos de pago para mostrar.
                      </td>
                    </tr>
                  ) : (
                    ventasPorMetodo.map((item) => (
                      <tr
                        key={item.metodo}
                        className="border-b border-[#f9eded]"
                      >
                        <td className="py-4 px-5 font-semibold text-[#2e2e2e]">
                          {item.metodo}
                        </td>

                        <td className="py-4 px-5">{item.ventas}</td>

                        <td className="py-4 px-5 font-bold text-[#8c0303]">
                          {formatCurrency(item.ingresos)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </section>

        <section className="bg-white border border-[#f3dede] rounded-[26px] overflow-hidden">
          <div className="p-5 md:p-6 border-b border-[#f3dede]">
            <h2 className="text-[18px] md:text-[20px] font-bold text-[#7a0000]">
              Historial comercial
            </h2>

            <p className="text-sm text-[#b07a7a] mt-1">
              {ventasFiltradas.length} venta(s) dentro de los filtros actuales.
            </p>
          </div>

          <div className="md:hidden divide-y divide-[#f3dede]">
            {loading ? (
              <EmptyState text="Cargando ventas..." />
            ) : ventasFiltradas.length === 0 ? (
              <EmptyState text="No hay ventas con estos filtros." />
            ) : (
              ventasFiltradas.map((venta) => (
                <article key={venta.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-bold text-[#7a0000] break-words">
                        {venta.producto || 'Sin producto'}
                      </p>

                      <p className="text-sm text-[#b07a7a] mt-1">
                        {venta.fecha || 'Sin fecha'}
                      </p>
                    </div>

                    <p className="font-bold text-[#8c0303] shrink-0">
                      {formatCurrency(venta.monto_pago)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="rounded-2xl border border-[#f3dede] bg-[#fffafa] p-3">
                      <p className="text-[10px] uppercase tracking-[0.13em] text-[#b9a0a0]">
                        Canal
                      </p>

                      <p className="mt-2 text-sm font-semibold text-[#2e2e2e] break-words">
                        {venta.tipo_pedido || venta.sucursal || '—'}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[#f3dede] bg-[#fffafa] p-3">
                      <p className="text-[10px] uppercase tracking-[0.13em] text-[#b9a0a0]">
                        Pago
                      </p>

                      <p className="mt-2 text-sm font-semibold text-[#2e2e2e] break-words">
                        {venta.metodo_pago || '—'}
                      </p>
                    </div>
                  </div>

                  {venta.vendedor && (
                    <p className="mt-4 text-xs text-[#b07a7a]">
                      Vendedor: {venta.vendedor}
                    </p>
                  )}
                </article>
              ))
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-[#f8eeee] text-[#b07a7a] uppercase text-[11px] tracking-[0.14em]">
                <tr>
                  <th className="py-4 px-5 text-left">Fecha</th>
                  <th className="py-4 px-5 text-left">Producto</th>
                  <th className="py-4 px-5 text-left">Sucursal</th>
                  <th className="py-4 px-5 text-left">Vendedor</th>
                  <th className="py-4 px-5 text-left">Pago</th>
                  <th className="py-4 px-5 text-right">Total</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="py-10 text-center text-[#b07a7a]"
                    >
                      Cargando ventas...
                    </td>
                  </tr>
                ) : ventasFiltradas.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="py-10 text-center text-[#b07a7a]"
                    >
                      No hay ventas con estos filtros.
                    </td>
                  </tr>
                ) : (
                  ventasFiltradas.map((venta) => (
                    <tr
                      key={venta.id}
                      className="border-b border-[#f9eded] hover:bg-[#fffafa]"
                    >
                      <td className="py-4 px-5">
                        {venta.fecha || '—'}
                      </td>

                      <td className="py-4 px-5 font-semibold text-[#2e2e2e]">
                        {venta.producto || 'Sin producto'}
                      </td>

                      <td className="py-4 px-5">
                        {venta.tipo_pedido || venta.sucursal || '—'}
                      </td>

                      <td className="py-4 px-5">
                        {venta.vendedor || '—'}
                      </td>

                      <td className="py-4 px-5">
                        {venta.metodo_pago || '—'}
                      </td>

                      <td className="py-4 px-5 text-right font-bold text-[#8c0303]">
                        {formatCurrency(venta.monto_pago)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  )
}

function KpiCard({ label, value, icon, compact = false }) {
  return (
    <article className="bg-white border border-[#f3dede] rounded-[24px] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
            {label}
          </p>

          <p
            className={`mt-3 font-bold text-[#7a0000] leading-tight break-words ${
              compact ? 'text-[20px]' : 'text-[30px]'
            }`}
          >
            {value}
          </p>
        </div>

        <div className="w-10 h-10 rounded-2xl bg-[#fff1f1] text-[#8c0303] flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>
    </article>
  )
}

function EmptyState({ text }) {
  return (
    <div className="min-h-[120px] flex items-center justify-center px-5 text-center text-sm text-[#b07a7a]">
      {text}
    </div>
  )
}