'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  Search,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  CalendarDays,
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
      setLoading(false)
      return
    }

    setVentas(data || [])
    setLoading(false)
  }

  const sucursales = useMemo(() => {
    return [
      'Todos',
      ...new Set(ventas.map((venta) => venta.tipo_pedido || venta.sucursal).filter(Boolean)),
    ]
  }, [ventas])

  const metodosPago = useMemo(() => {
    return [
      'Todos',
      ...new Set(ventas.map((venta) => venta.metodo_pago).filter(Boolean)),
    ]
  }, [ventas])

  const productos = useMemo(() => {
    return [
      'Todos',
      ...new Set(ventas.map((venta) => venta.producto).filter(Boolean)),
    ]
  }, [ventas])

const ventasFiltradas = ventas.filter((venta) => {
  const text = `
    ${venta.cliente || ''}
    ${venta.producto || ''}
    ${venta.metodo_pago || ''}
    ${venta.vendedor || ''}
    ${venta.tipo_pedido || ''}
    ${venta.sucursal || ''}
  `.toLowerCase()

  const matchesSearch = text.includes(search.toLowerCase())

  const matchesSucursal =
    sucursal === 'Todos' ||
    venta.tipo_pedido === sucursal ||
    venta.sucursal === sucursal

  const matchesMetodoPago =
    metodoPago === 'Todos' || venta.metodo_pago === metodoPago

  const matchesProducto =
    producto === 'Todos' || venta.producto === producto

  const ventaFecha = venta.fecha || venta.created_at?.split('T')[0]

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

  const ingresosTotales = ventasFiltradas.reduce(
    (total, venta) => total + Number(venta.monto_pago || 0),
    0
  )

  const totalTransacciones = ventasFiltradas.length

  const ticketPromedio =
    totalTransacciones > 0 ? ingresosTotales / totalTransacciones : 0

  const ventasPorProducto = Object.values(
    ventasFiltradas.reduce((acc, venta) => {
      const nombre = venta.producto || 'Sin producto'
      const monto = Number(venta.monto_pago || 0)

      if (!acc[nombre]) {
        acc[nombre] = {
          producto: nombre,
          ventas: 0,
          ingresos: 0,
        }
      }

      acc[nombre].ventas += 1
      acc[nombre].ingresos += monto

      return acc
    }, {})
  ).sort((a, b) => b.ingresos - a.ingresos)

  const productoEstrella = ventasPorProducto[0]

  const ventasPorSucursal = Object.values(
    ventasFiltradas.reduce((acc, venta) => {
      const nombre = venta.tipo_pedido || venta.sucursal || 'Sin sucursal'
      const monto = Number(venta.monto_pago || 0)

      if (!acc[nombre]) {
        acc[nombre] = {
          sucursal: nombre,
          ingresos: 0,
          ventas: 0,
        }
      }

      acc[nombre].ingresos += monto
      acc[nombre].ventas += 1

      return acc
    }, {})
  ).sort((a, b) => b.ingresos - a.ingresos)

  const ventasPorMetodo = Object.values(
    ventasFiltradas.reduce((acc, venta) => {
      const nombre = venta.metodo_pago || 'Sin método'
      const monto = Number(venta.monto_pago || 0)

      if (!acc[nombre]) {
        acc[nombre] = {
          metodo: nombre,
          ingresos: 0,
          ventas: 0,
        }
      }

      acc[nombre].ingresos += monto
      acc[nombre].ventas += 1

      return acc
    }, {})
  ).sort((a, b) => b.ingresos - a.ingresos)

const inputClass =
  'w-full h-[46px] px-4 rounded-xl border border-[#efcccc] bg-white outline-none text-sm'

function getTodayDate() {
  return new Date().toISOString().split('T')[0]
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
  setSearch('')
  setFechaInicio('')
  setFechaFin('')
  setSucursal('Todos')
  setProducto('Todos')
  setMetodoPago('Todos')
}

return (
  <main className="min-h-screen bg-[#fcf8f8]">
<div className="bg-white border-b border-[#f1dede] px-10 h-[86px] flex items-center">
  <div>
    <h1 className="text-[30px] text-[#7a0000] ivy leading-none">
      Análisis de Ventas
    </h1>

    <p className="text-sm text-[#b07a7a] mt-2">
      Análisis comercial por producto, sucursal, método de pago y rendimiento general.
    </p>
  </div>
</div>

    <section className="p-8 space-y-6">

{/* FILTROS */}
<div className="bg-white border border-[#f3dede] rounded-[28px] p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 items-end">
  <div>
    <label className="block text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
      Buscar
    </label>

    <div className="flex items-center gap-2 border border-[#efcccc] rounded-xl px-4 bg-[#fff7f7] h-[46px]">
      <Search size={17} className="text-[#b07a7a]" />
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar venta..."
        className="w-full bg-transparent outline-none text-sm"
      />
    </div>
  </div>

<div>
  <label className="block text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
    Desde
  </label>

  <input
    type="date"
    value={fechaInicio}
    onChange={(e) => setFechaInicio(e.target.value)}
    className={inputClass}
  />
</div>

<div>
  <label className="block text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
    Hasta
  </label>

  <input
    type="date"
    value={fechaFin}
    onChange={(e) => setFechaFin(e.target.value)}
    className={inputClass}
  />
</div>

  <div>
    <label className="block text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
      Sucursal
    </label>

    <select
      value={sucursal}
      onChange={(e) => setSucursal(e.target.value)}
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
    <label className="block text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
      Producto
    </label>

    <select
      value={producto}
      onChange={(e) => setProducto(e.target.value)}
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
    <label className="block text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
      Método de pago
    </label>

    <select
      value={metodoPago}
      onChange={(e) => setMetodoPago(e.target.value)}
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

<div className="flex flex-wrap gap-3">
  <button
    type="button"
    onClick={setFiltroHoy}
    className="px-4 py-2 rounded-full border border-[#efcccc] text-[#8c0303] bg-white hover:bg-[#fff5f5] text-sm"
  >
    Hoy
  </button>

  <button
    type="button"
    onClick={setFiltroMesActual}
    className="px-4 py-2 rounded-full border border-[#efcccc] text-[#8c0303] bg-white hover:bg-[#fff5f5] text-sm"
  >
    Este mes
  </button>

  <button
    type="button"
    onClick={limpiarFiltros}
    className="px-4 py-2 rounded-full bg-[#8c0303] text-white hover:bg-[#6f0202] text-sm"
  >
    Limpiar filtros
  </button>
</div>

        {/* KPIS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <KpiCard
            label="Ingresos filtrados"
            value={`$${ingresosTotales.toFixed(2)}`}
            icon={<DollarSign size={22} />}
          />

          <KpiCard
            label="Transacciones"
            value={totalTransacciones}
            icon={<ShoppingBag size={22} />}
          />

          <KpiCard
            label="Ticket promedio"
            value={`$${ticketPromedio.toFixed(2)}`}
            icon={<TrendingUp size={22} />}
          />

          <KpiCard
            label="Producto estrella"
            value={productoEstrella?.producto || 'Sin datos'}
            icon={<CalendarDays size={22} />}
            small
          />
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white border border-[#f3dede] rounded-[30px] p-7">
            <h2 className="text-[28px] text-[#7a0000] ivy mb-2">
              Ventas por producto
            </h2>

            <p className="text-sm text-[#b07a7a] mb-6">
              Productos ordenados por ingresos generados.
            </p>

<div className="w-full min-w-0 h-[300px] min-h-[300px] overflow-hidden">
{ventasPorProducto.length > 0 ? (
  <ResponsiveContainer width="99%" height={300}>
                  <BarChart data={ventasPorProducto.slice(0, 8)}>
                    <CartesianGrid stroke="#f3dede" strokeDasharray="4 4" />
                    <XAxis dataKey="producto" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="ingresos" fill="#8c0303" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </div>
          </div>

          <div className="bg-white border border-[#f3dede] rounded-[30px] p-7">
            <h2 className="text-[28px] text-[#7a0000] ivy mb-2">
              Ventas por sucursal
            </h2>

            <p className="text-sm text-[#b07a7a] mb-6">
              Rendimiento por punto de venta o tipo de pedido.
            </p>

            <div className="space-y-3">
              {ventasPorSucursal.length === 0 ? (
                <p className="text-[#b07a7a] text-sm">
                  No hay datos para mostrar.
                </p>
              ) : (
                ventasPorSucursal.map((item) => (
                  <div
                    key={item.sucursal}
                    className="border border-[#f3dede] rounded-2xl p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-[#2e2e2e]">
                        {item.sucursal}
                      </p>
                      <p className="text-xs text-[#b07a7a]">
                        {item.ventas} transacciones
                      </p>
                    </div>

                    <p className="text-[#8c0303] font-semibold">
                      ${item.ingresos.toFixed(2)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* TABLES */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white border border-[#f3dede] rounded-[30px] p-7">
            <h2 className="text-[28px] text-[#7a0000] ivy mb-6">
              Ranking de productos
            </h2>

            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#b9a0a0] uppercase tracking-[0.15em] text-xs border-b border-[#f3dede]">
                  <th className="py-3">Producto</th>
                  <th className="py-3">Ventas</th>
                  <th className="py-3">Ingresos</th>
                </tr>
              </thead>

              <tbody>
                {ventasPorProducto.map((item) => (
                  <tr key={item.producto} className="border-b border-[#f9eded]">
                    <td className="py-4 font-semibold">{item.producto}</td>
                    <td className="py-4">{item.ventas}</td>
                    <td className="py-4 font-semibold">
                      ${item.ingresos.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white border border-[#f3dede] rounded-[30px] p-7">
            <h2 className="text-[28px] text-[#7a0000] ivy mb-6">
              Métodos de pago
            </h2>

            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#b9a0a0] uppercase tracking-[0.15em] text-xs border-b border-[#f3dede]">
                  <th className="py-3">Método</th>
                  <th className="py-3">Ventas</th>
                  <th className="py-3">Ingresos</th>
                </tr>
              </thead>

              <tbody>
                {ventasPorMetodo.map((item) => (
                  <tr key={item.metodo} className="border-b border-[#f9eded]">
                    <td className="py-4 font-semibold">{item.metodo}</td>
                    <td className="py-4">{item.ventas}</td>
                    <td className="py-4 font-semibold">
                      ${item.ingresos.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* DETALLE */}
        <div className="bg-white border border-[#f3dede] rounded-[30px] p-7">
          <h2 className="text-[28px] text-[#7a0000] ivy mb-6">
            Historial comercial
          </h2>

          {loading ? (
            <p className="text-[#b07a7a]">Cargando ventas...</p>
          ) : ventasFiltradas.length === 0 ? (
            <p className="text-[#b07a7a]">No hay ventas con estos filtros.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#b9a0a0] uppercase tracking-[0.15em] text-xs border-b border-[#f3dede]">
                  <th className="py-3">Fecha</th>
                  <th className="py-3">Producto</th>
                  <th className="py-3">Sucursal</th>
                  <th className="py-3">Vendedor</th>
                  <th className="py-3">Pago</th>
                  <th className="py-3">Total</th>
                </tr>
              </thead>

              <tbody>
                {ventasFiltradas.map((venta) => (
                  <tr key={venta.id} className="border-b border-[#f9eded]">
                    <td className="py-4">{venta.fecha || '—'}</td>
                    <td className="py-4 font-semibold">
                      {venta.producto || 'Sin producto'}
                    </td>
                    <td className="py-4">
                      {venta.tipo_pedido || venta.sucursal || '—'}
                    </td>
                    <td className="py-4">{venta.vendedor || '—'}</td>
                    <td className="py-4">{venta.metodo_pago || '—'}</td>
                    <td className="py-4 font-semibold">
                      ${Number(venta.monto_pago || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
    </section>
  </main>
)
}

function KpiCard({ label, value, icon, small }) {
  return (
    <div className="bg-white border border-[#f3dede] rounded-[28px] p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#b9a0a0]">
            {label}
          </p>

          <h2
            className={`text-[#8c0303] ivy mt-4 leading-none ${
              small ? 'text-[28px]' : 'text-[44px]'
            }`}
          >
            {value}
          </h2>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-[#fff1f1] text-[#8c0303] flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="w-full h-full flex items-center justify-center text-[#b07a7a] text-sm">
      No hay datos suficientes para mostrar.
    </div>
  )
}