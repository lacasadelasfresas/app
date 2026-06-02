'use client'

// Agrega estas dos líneas al inicio del archivo, junto a los demás imports
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

import Image from 'next/image'

import {
  LayoutDashboard,
  ShoppingBag,
  FileText,
  Package,
  DollarSign,
  Ticket,
  Boxes,
  Bell,
  Search,
  TrendingUp,
AlertTriangle,
ShoppingCart,
Sparkles,
} from 'lucide-react'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts'

export default function Home() {
  const [salesData, setSalesData] = useState([])
  const [paymentData, setPaymentData] = useState([])
  const [topProducts, setTopProducts] = useState([])

  const [totalIncome, setTotalIncome] = useState(0)
  const [totalTransactions, setTotalTransactions] = useState(0)
  const [averageTicket, setAverageTicket] = useState(0)

  const [incomeChange, setIncomeChange] = useState(0)
  const [transactionsChange, setTransactionsChange] = useState(0)
  const [ticketChange, setTicketChange] = useState(0)

  const [chartTitle, setChartTitle] = useState('Ventas Diarias')
  const [starProduct, setStarProduct] = useState('Sin datos')
  const [activePoint, setActivePoint] = useState('Sin datos')
  const [loadingSales, setLoadingSales] = useState(true)
const [recentActivity, setRecentActivity] = useState([])
const [todayIncome, setTodayIncome] = useState(0)
const [todayTransactions, setTodayTransactions] = useState(0)
const [lastSale, setLastSale] = useState(null)
const lowTicketAlert = averageTicket > 0 && averageTicket < 5
const noSalesAlert = totalTransactions === 0
const lowIncomeAlert = totalIncome > 0 && totalIncome < 100
const negativeIncomeTrendAlert = incomeChange < 0
const negativeTicketTrendAlert = ticketChange < 0
const negativeTransactionsTrendAlert = transactionsChange < 0
const noStarProductAlert = starProduct === 'Sin datos'
const noActivePointAlert = activePoint === 'Sin datos'
const noPaymentDataAlert = paymentData.length === 0
const highPendingOrdersAlert = true
const [inventoryAlerts, setInventoryAlerts] = useState([])
const dailyMessages = [
  'Hoy todo fluye con orden, intención y abundancia.',
  'Cada venta abre espacio para nuevas oportunidades.',
  'La energía que pones en tu negocio también se multiplica.',
  'Hoy atraes clientes ideales, ventas bonitas y crecimiento real.',
  'Lo que construyes con amor también crece con propósito.',
  'Cada pedido es una señal de que tu marca está avanzando.',
  'Hoy es un buen día para vender, crear y recibir.',
  'La abundancia también llega en forma de clientes felices.',
  'Tu constancia está creando resultados que pronto serán visibles.',
  'Cada detalle bien hecho acerca más ventas.',
  'Hoy trabajas con calma, enfoque y prosperidad.',
  'Lo pequeño que haces bien hoy sostiene lo grande de mañana.',
  'Tu negocio crece cuando sirves con excelencia y confianza.',
  'Hoy recibes con gratitud cada venta, cada idea y cada oportunidad.',
  'La disciplina también es una forma de atraer abundancia.',
  'Cada cliente satisfecho puede convertirse en una nueva puerta.',
  'Hoy hay espacio para vender más, aprender más y crecer mejor.',
  'Tu energía, tu orden y tu visión están construyendo algo grande.',
  'Las ventas llegan cuando la preparación se encuentra con la intención.',
  'Hoy eliges avanzar con fe, foco y buena energía.',
  'Cada día organizado acerca tu negocio a su próxima meta.',
  'La abundancia se construye con acción, claridad y gratitud.',
  'Hoy tu marca se mueve con propósito y buena vibra.',
  'Cada venta cuenta, cada cliente importa, cada paso suma.',
  'Lo que haces con intención tiene el poder de multiplicarse.',
]
const todayMessage =
  dailyMessages[new Date().getDate() % dailyMessages.length]
const [reviewItems, setReviewItems] = useState([])
const [opportunityItems, setOpportunityItems] = useState([])
const [businessTasks, setBusinessTasks] = useState([])


useEffect(() => {
  fetchSalesData()
}, [])

async function fetchSalesData() {
  setLoadingSales(true)

  const today = new Date()

  const currentStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const currentEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  const previousStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const previousEnd = new Date(today.getFullYear(), today.getMonth(), 0)

  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  const monthName = (date) =>
    date.toLocaleDateString('es-PA', {
      month: 'long',
      year: 'numeric',
    })

  const { data: currentSales, error: currentError } = await supabase
    .from('ventas')
    .select('*')
    .not('fecha', 'is', null)
    .not('producto', 'is', null)
    .not('metodo_pago', 'is', null)
    .not('monto_pago', 'is', null)
    .gte('fecha', formatDate(currentStart))
    .lte('fecha', formatDate(currentEnd))
    .order('fecha', { ascending: true })

  const { data: previousSales, error: previousError } = await supabase
    .from('ventas')
    .select('*')
    .not('fecha', 'is', null)
    .not('producto', 'is', null)
    .not('metodo_pago', 'is', null)
    .not('monto_pago', 'is', null)
    .gte('fecha', formatDate(previousStart))
    .lte('fecha', formatDate(previousEnd))
    .order('fecha', { ascending: true })

  if (currentError || previousError) {
    console.error(currentError || previousError)
    setLoadingSales(false)
    return
  }

const { data: productosData, error: productosError } = await supabase
  .from('productos')
  .select('id, nombre, activo')

const { data: recipesData, error: recipesError } = await supabase
  .from('recipes')
  .select('producto_id')

const { data: inventarioData, error: inventarioError } = await supabase
  .from('inventario')
  .select('id, nombre, stock_actual, stock_minimo, unidad')

if (productosError) {
  console.error('Error cargando productos para dashboard:', productosError)
}

if (recipesError) {
  console.error('Error cargando recipes para dashboard:', recipesError)
}

if (inventarioError) {
  console.error('Error cargando inventario para dashboard:', inventarioError)
}

const ventasDelPeriodo = currentSales || []

const ventasSinCliente = ventasDelPeriodo.filter((venta) => {
  return !venta.cliente || venta.cliente === 'Walk-in'
}).length

const ventasSinWhatsapp = ventasDelPeriodo.filter((venta) => {
  return !venta.whatsapp
}).length

const ventasSinMetodoPago = ventasDelPeriodo.filter((venta) => {
  return !venta.metodo_pago
}).length

const ventasMontoCero = ventasDelPeriodo.filter((venta) => {
  return Number(venta.monto_pago || 0) <= 0
}).length

const recipeProductIds = new Set(
  (recipesData || []).map((recipe) => recipe.producto_id).filter(Boolean)
)

const productosSinReceta = (productosData || []).filter((producto) => {
  return producto.activo !== false && !recipeProductIds.has(producto.id)
}).length

setReviewItems(
  [
    {
      label: 'Ventas sin cliente identificado',
      value: ventasSinCliente,
    },
    {
      label: 'Ventas sin WhatsApp',
      value: ventasSinWhatsapp,
    },
    {
      label: 'Ventas sin método de pago',
      value: ventasSinMetodoPago,
    },
    {
      label: 'Ventas con monto $0',
      value: ventasMontoCero,
    },
    {
      label: 'Productos sin recipe',
      value: productosSinReceta,
    },
  ].filter((item) => item.value > 0)
)

function getTopItem(items, key) {
  const totals = {}

  items.forEach((item) => {
    const name = item[key] || 'Sin dato'
    totals[name] = (totals[name] || 0) + 1
  })

  return Object.entries(totals)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)[0]
}

function getTopRevenueItem(items, key) {
  const totals = {}

  items.forEach((item) => {
    const name = item[key] || 'Sin dato'
    totals[name] = (totals[name] || 0) + Number(item.monto_pago || 0)
  })

  return Object.entries(totals)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)[0]
}

const topProducto = getTopItem(ventasDelPeriodo, 'producto')
const topMetodoPago = getTopItem(ventasDelPeriodo, 'metodo_pago')
const topSucursal = getTopItem(ventasDelPeriodo, 'tipo_pedido')
const topProductoIngresos = getTopRevenueItem(ventasDelPeriodo, 'producto')

setOpportunityItems(
  [
    topProducto && {
      label: 'Producto más vendido',
      value: topProducto.label,
      detail: `${topProducto.value} ventas`,
    },
    topMetodoPago && {
      label: 'Método de pago más usado',
      value: topMetodoPago.label,
      detail: `${topMetodoPago.value} ventas`,
    },
    topSucursal && {
      label: 'Sucursal con más ventas',
      value: topSucursal.label,
      detail: `${topSucursal.value} ventas`,
    },
    topProductoIngresos && {
      label: 'Producto con más ingresos',
      value: topProductoIngresos.label,
      detail: `$${topProductoIngresos.value.toFixed(2)}`,
    },
  ].filter(Boolean)
)

const alertas = (inventarioData || []).filter((item) => {
  const actual = Number(item.stock_actual || 0)
  const minimo = Number(item.stock_minimo || 0)

  return actual <= minimo
})

setInventoryAlerts(alertas.slice(0, 5))

const stockBajo = alertas.length

setBusinessTasks(
  [
    productosSinReceta > 0 && {
      label: 'Completar recipes pendientes',
      detail: `${productosSinReceta} productos sin recipe`,
    },
    stockBajo > 0 && {
      label: 'Revisar inventario bajo',
      detail: `${stockBajo} insumos requieren atención`,
    },
    ventasSinWhatsapp > 0 && {
      label: 'Completar datos de clientes',
      detail: `${ventasSinWhatsapp} ventas sin WhatsApp`,
    },
    ventasSinMetodoPago > 0 && {
      label: 'Actualizar métodos de pago',
      detail: `${ventasSinMetodoPago} ventas sin método registrado`,
    },
  ].filter(Boolean)
)
  const current = currentSales || []
  const previous = previousSales || []

const todayString = formatDate(new Date())

const todaySales = current.filter((sale) => sale.fecha === todayString)

const todayIncomeValue = todaySales.reduce(
  (sum, sale) => sum + Number(sale.monto_pago || 0),
  0
)

setTodayIncome(todayIncomeValue)
setTodayTransactions(todaySales.length)

const latestSale = [...current]
  .filter((sale) => sale.fecha && sale.producto && sale.monto_pago !== null)
  .sort((a, b) => new Date(`${b.fecha}T00:00:00`) - new Date(`${a.fecha}T00:00:00`))[0]

setLastSale(latestSale || null)

  const currentIncome = current.reduce(
    (sum, sale) => sum + Number(sale.monto_pago || 0),
    0
  )

  const previousIncome = previous.reduce(
    (sum, sale) => sum + Number(sale.monto_pago || 0),
    0
  )

  const currentTransactions = current.length
  const previousTransactions = previous.length

  const currentAverage = currentTransactions
    ? currentIncome / currentTransactions
    : 0

  const previousAverage = previousTransactions
    ? previousIncome / previousTransactions
    : 0

  const calcChange = (currentValue, previousValue) => {
    if (!previousValue) return currentValue > 0 ? 100 : 0
    return ((currentValue - previousValue) / previousValue) * 100
  }

  setTotalIncome(currentIncome)
  setTotalTransactions(currentTransactions)
  setAverageTicket(currentAverage)

  setIncomeChange(calcChange(currentIncome, previousIncome))
  setTransactionsChange(calcChange(currentTransactions, previousTransactions))
  setTicketChange(calcChange(currentAverage, previousAverage))

  const daysInCurrentMonth = currentEnd.getDate()

  const groupedCurrent = {}
  const groupedPrevious = {}

  current.forEach((sale) => {
    const day = new Date(`${sale.fecha}T00:00:00`).getDate()
    groupedCurrent[day] = (groupedCurrent[day] || 0) + Number(sale.monto_pago || 0)
  })

  previous.forEach((sale) => {
    const day = new Date(`${sale.fecha}T00:00:00`).getDate()
    groupedPrevious[day] = (groupedPrevious[day] || 0) + Number(sale.monto_pago || 0)
  })

  const chart = Array.from({ length: daysInCurrentMonth }, (_, index) => {
    const dayNumber = index + 1

    return {
      day: String(dayNumber).padStart(2, '0'),
      sales: groupedCurrent[dayNumber] || 0,
      previous: groupedPrevious[dayNumber] || 0,
    }
  })

  setSalesData(chart)

  const paymentGroups = {}

  current.forEach((sale) => {
    const method = sale.metodo_pago || 'Sin método'
    paymentGroups[method] = (paymentGroups[method] || 0) + 1
  })

  const paymentColors = [
    '#10B981',
    '#3B82F6',
    '#8B5CF6',
    '#F59E0B',
    '#EF4444',
  ]

  const paymentChartData = Object.keys(paymentGroups).map((method, index) => ({
    name: method,
    value: paymentGroups[method],
    color: paymentColors[index % paymentColors.length],
  }))

  setPaymentData(paymentChartData)

  const productGroups = {}

  current.forEach((sale) => {
    const product = sale.producto || 'Sin producto'

    if (!productGroups[product]) {
      productGroups[product] = {
        name: product,
        value: 0,
        amount: 0,
      }
    }

    productGroups[product].value += Number(sale.cantidad || 1)
    productGroups[product].amount += Number(sale.monto_pago || 0)
  })

  const sortedProducts = Object.values(productGroups).sort(
    (a, b) => b.value - a.value
  )

  setTopProducts(sortedProducts.slice(0, 5))
  setStarProduct(sortedProducts[0]?.name || 'Sin datos')

  const sellerGroups = {}

  current.forEach((sale) => {
    const seller = sale.vendedor || 'Sin punto'
    sellerGroups[seller] =
      (sellerGroups[seller] || 0) + Number(sale.monto_pago || 0)
  })

  const topSeller = Object.entries(sellerGroups).sort(
    (a, b) => b[1] - a[1]
  )[0]

  setActivePoint(topSeller?.[0] || 'Sin datos')

function formatRecentOrderId(sale) {
  const rawId = sale.operacion || sale.id || ''
  const numberPart = String(rawId).replace(/\D/g, '').slice(-4)

  if (numberPart) {
    return `#OP-${numberPart.padStart(4, '0')}`
  }

  return '#OP-0000'
}

const recentSales = [...current]
  .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  .slice(0, 5)
  .map((sale) => ({
    order: formatRecentOrderId(sale),
    item: sale.producto || 'Sin producto',
    payment: sale.metodo_pago || 'Sin método',
    total: `$${Number(sale.monto_pago || 0).toFixed(2)}`,
    status: sale.status || 'Entregado',
  }))

  setRecentActivity(recentSales)

  setChartTitle(
    `Ventas Diarias — ${monthName(currentStart)} vs ${monthName(previousStart)}`
  )

  setLoadingSales(false)
}
  return (
<main className="min-h-screen bg-[#fcf8f8] w-full">
  {/* CONTENT */}
<section className="w-full min-h-screen">
  
        {/* TOPBAR */}
        <div className="bg-white border-b border-[#f1dede] px-10 h-[90px] flex items-center justify-between sticky top-0 z-20">

<h1 className="text-[24px] font-medium text-[#151515] leading-none">
              Centro de Mandos | La Casa de las Fresas
          </h1>

          <div className="flex items-center gap-4">

            <div className="flex items-center gap-2 bg-[#fff5f5] px-4 py-3 rounded-2xl">

              <Search size={18} className="text-gray-400" />

              <input
                placeholder="Buscar..."
                className="bg-transparent outline-none"
              />

            </div>

            <button className="w-11 h-11 rounded-2xl bg-[#fff5f5] flex items-center justify-center">
              <Bell size={18} />
            </button>

<Link
  href="/pedidos?new=1"
  className="bg-[#8c0303] text-white px-5 py-3 rounded-2xl font-semibold flex items-center gap-2"
>
  <DollarSign size={16} />
  Registrar Venta
</Link>
          </div>

        </div>

        {/* WRAPPER */}
<div className="w-full px-8 py-7">

          {/* BODY */}
<div className="space-y-6 max-w-none">

            {/* TOP CARDS */}
<div className="grid grid-cols-3 gap-6 w-full min-w-0">

              <div className="bg-white border border-[#f3dede] rounded-[30px] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">

                <p className="text-xs uppercase tracking-[0.2em] text-[#b9a0a0]">
                  Ingresos Totales
                </p>

                <h2 className="text-[44px] leading-none text-[#7a0000] ivy mt-4">
${totalIncome.toFixed(2)}
                </h2>
<p className={`mt-3 text-sm ${negativeIncomeTrendAlert || noSalesAlert ? 'text-red-500' : 'text-green-500'}`}>
  {noSalesAlert
    ? 'Sin ventas registradas'
    : `${incomeChange >= 0 ? '+' : ''}${incomeChange.toFixed(0)}% vs período anterior`}
                </p>

              </div>

              <div className="bg-white border border-[#f3dede] rounded-[30px] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">

                <p className="text-xs uppercase tracking-[0.2em] text-[#b9a0a0]">
                  Total Transacciones
                </p>

                <h2 className="text-[58px] leading-none text-[#7a0000] ivy mt-4">
{totalTransactions}             
                </h2>

<p className={`mt-3 text-sm ${negativeTransactionsTrendAlert || noSalesAlert ? 'text-red-500' : 'text-green-500'}`}>
  {noSalesAlert
    ? 'Sin transacciones'
    : `${transactionsChange >= 0 ? '+' : ''}${transactionsChange.toFixed(0)}% vs período anterior`}
</p>

              </div>

              <div className="bg-white border border-[#f3dede] rounded-[30px] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">

                <p className="text-xs uppercase tracking-[0.2em] text-[#b9a0a0]">
                  Ticket Promedio
                </p>

                <h2 className="text-[58px] leading-none text-[#7a0000] ivy mt-4">
${averageTicket.toFixed(2)}
                </h2>

<p className={`mt-3 text-sm ${lowTicketAlert || negativeTicketTrendAlert ? 'text-red-500' : 'text-green-500'}`}>
  {lowTicketAlert
    ? 'Ticket por debajo de $5.00'
    : `${ticketChange >= 0 ? '+' : ''}${ticketChange.toFixed(0)}% vs período anterior`}
</p>
              </div>

            </div>

            {/* MINI CARDS */}
            <div className="grid grid-cols-4 gap-6">

<div className="bg-white border border-[#f3dede] rounded-[30px] p-6">
  <div className="flex items-start justify-between gap-5">
    <div>
      <p className="text-xs uppercase tracking-[0.22em] text-[#b9a0a0]">
        Mensaje del día
      </p>

      <h2 className="text-[20px] text-[#8c0303] ivy mt-4 leading-tight">
        {todayMessage}
      </h2>
    </div>

    <div className="w-14 h-14 rounded-2xl bg-[#fff1f1] text-[#8c0303] flex items-center justify-center shrink-0">
      <Sparkles size={24} />
    </div>
  </div>
</div>
              <div className="bg-white border border-[#f3dede] rounded-[30px] p-7 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#b9a0a0]">
                      Producto Estrella
                    </p>

                    <h3 className="text-[36px] ivy text-[#7a0000] leading-none mt-3">
{starProduct}
                    </h3>
                  </div>

                  <TrendingUp className="text-[#8c0303]" />
                </div>
              </div>

<div className="bg-white border border-[#f3dede] rounded-[30px] p-7 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-[#b9a0a0]">
        Ventas del Día
      </p>

      <h3 className="text-[48px] ivy text-[#7a0000] leading-none mt-3">
        ${todayIncome.toFixed(2)}
      </h3>

      <p className="text-sm text-[#b07a7a] mt-2">
        {todayTransactions} ventas registradas hoy
      </p>
    </div>

    <ShoppingCart className="text-[#8c0303]" />
  </div>
</div>

<div className="bg-[#fff7f7] border border-[#f3dede] rounded-[30px] p-7 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-[#b9a0a0]">
        Última Venta
      </p>

      <h3 className="text-[48px] ivy text-[#7a0000] leading-none mt-3">
        {lastSale ? `$${Number(lastSale.monto_pago || 0).toFixed(2)}` : '$0.00'}
      </h3>

      <p className="text-sm text-[#b07a7a] mt-2">
        {lastSale
          ? `${lastSale.producto || 'Sin producto'} · ${lastSale.vendedor || 'Sin vendedor'}`
          : 'Sin ventas registradas'}
      </p>
    </div>

    <DollarSign className="text-[#8c0303]" />
  </div>
</div>

            </div>

{/* CHARTS */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

  {/* Ventas Diarias */}
  <div className="lg:col-span-2 bg-white border border-[#f3dede] rounded-[30px] p-6 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
      <div>
        <h2 className="text-[32px] leading-none text-[#7a0000] ivy">
          {chartTitle}
        </h2>

        <p className="text-[#b07a7a] mt-2">
          Ingresos reales por día de operación ·{" "}
          <span className="text-[#8c0303] font-semibold">
{totalTransactions} transacciones
          </span>
        </p>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <span className="w-3 h-3 rounded-full bg-[#8c0303]"></span>
        <span className="text-[#b07a7a] text-sm">
          Punto de Venta (Naths)
        </span>
      </div>
    </div>

<div className="w-full min-w-0 h-[320px] min-h-[320px] overflow-hidden">
{salesData.length > 0 ? (
<AreaChart width={880} height={320} data={salesData}>
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8c0303" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#8c0303" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid
            stroke="#f3dede"
            strokeDasharray="4 4"
          />

          <XAxis
            dataKey="day"
            tick={{ fill: "#b07a7a", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tick={{ fill: "#b07a7a", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `$${value}`}
          />

<Tooltip
  formatter={(value, name) => [
    `$${Number(value).toFixed(2)}`,
    name === 'sales' ? 'Mes actual' : 'Mes anterior',
  ]}
            contentStyle={{
              borderRadius: "16px",
              border: "1px solid #f3dede",
              boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
            }}
          />
<Area
  type="monotone"
  dataKey="previous"
  stroke="#d9c55f"
  strokeWidth={3}
  fill="none"
  dot={{
    r: 3,
    fill: '#ffffff',
    stroke: '#d9c55f',
    strokeWidth: 2,
  }}
  activeDot={{
    r: 5,
    fill: '#ffffff',
    stroke: '#d9c55f',
    strokeWidth: 3,
  }}
/>
<Area
  type="monotone"
  dataKey="previous"
  stroke="#d8bcbc"
  strokeWidth={2}
  fill="none"
  dot={false}
/>
          <Area
            type="monotone"
            dataKey="sales"
            stroke="#8c0303"
            strokeWidth={3}
            fill="url(#salesGradient)"
            dot={{
              r: 4,
              fill: "#ffffff",
              stroke: "#8c0303",
              strokeWidth: 2,
            }}
            activeDot={{
              r: 6,
              fill: "#ffffff",
              stroke: "#8c0303",
              strokeWidth: 3,
            }}
          />
    </AreaChart>
  ) : (
    <div className="h-full flex items-center justify-center text-[#b07a7a] text-sm">
      No hay ventas registradas para este período.
    </div>
  )}
</div>
  </div>

{/* DONUT */}
<div className="bg-white border border-[#f3dede] rounded-[30px] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.03)] min-w-0 overflow-hidden">
  <h2 className="text-[30px] text-[#7a0000] ivy mb-6">
    Métodos de Pago
  </h2>

<div className="w-full min-w-0 h-[220px] min-h-[220px] overflow-hidden">
  {paymentData.length > 0 ? (
    <PieChart width={300} height={220}>
        <Pie
          data={paymentData}
          dataKey="value"
          innerRadius={65}
          outerRadius={95}
          paddingAngle={3}
        >
          {paymentData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color}
            />
          ))}
        </Pie>
        <Tooltip />
    </PieChart>
  ) : (
    <div className="h-full flex items-center justify-center text-[#b07a7a] text-sm">
      Sin métodos de pago registrados.
    </div>
  )}
</div>

  <div className="mt-6 space-y-3">
    {paymentData.map((method, index) => {
      const total = paymentData.reduce((acc, item) => acc + item.value, 0)
      const percentage = total ? ((method.value / total) * 100).toFixed(0) : 0

      return (
        <div key={index} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: method.color }}
            />

            <span className="text-[#6f6f6f]">
              {method.name}
            </span>
          </div>

          <span className="font-semibold text-[#8c0303]">
            {percentage}%
          </span>
        </div>
      )
    })}
  </div>
</div>
</div>
            {/* INVENTARIO */}
            <div className="bg-[#fff7f7] border border-[#f3dede] rounded-[30px] p-8">

              <div className="flex items-center gap-3 mb-6">

                <AlertTriangle className="text-[#8c0303]" />

                <h3 className="text-[38px] ivy text-[#7a0000] leading-none">
                  Alertas de Inventario
                </h3>

              </div>

<div className="space-y-4">
  {inventoryAlerts.length === 0 ? (
    <div className="bg-white rounded-2xl p-5 text-[#b07a7a] text-sm">
      No hay alertas de inventario por ahora.
    </div>
  ) : (
    inventoryAlerts.map((item) => {
      const actual = Number(item.stock_actual || 0)
      const minimo = Number(item.stock_minimo || 0)
      const agotado = actual <= 0

      return (
        <div
          key={item.id}
          className="flex items-center justify-between bg-white rounded-2xl p-5"
        >
          <div>
            <p className="font-semibold">
              {item.nombre}
            </p>

            <p className="text-sm text-gray-400">
              {actual} {item.unidad || ''} restantes · mínimo {minimo}
            </p>
          </div>

          <span
            className={`px-4 py-2 rounded-full text-sm ${
              agotado
                ? 'bg-red-100 text-red-600'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {agotado ? 'Agotado' : 'Bajo'}
          </span>
        </div>
      )
    })
  )}
</div>

            </div>

            {/* BOTTOM GRID */}
            <div className="grid grid-cols-3 gap-6">

              {/* PRODUCTOS */}
              <div className="bg-white border border-[#f3dede] rounded-[30px] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">

                <div className="flex items-center justify-between mb-6">

                  <h3 className="text-[32px] ivy text-[#7a0000]">
                    Productos Más Vendidos
                  </h3>

                  <TrendingUp className="text-[#8c0303]" size={22} />

                </div>

                <div className="space-y-5">

                  {[
                    {
                      name: 'Clásicas 12oz',
                      sales: '281 uds',
                      amount: '$1,405'
                    },
                    {
                      name: 'Crocante',
                      sales: '24 uds',
                      amount: '$152'
                    },
                    {
                      name: 'Brownie Lover',
                      sales: '18 uds',
                      amount: '$132'
                    },
                    {
                      name: 'Kids',
                      sales: '12 uds',
                      amount: '$51'
                    }
                  ].map((product, index) => (

                    <div key={index}>

                      <div className="flex items-center justify-between mb-2">

                        <div>

                          <p className="font-semibold text-[#2e2e2e]">
                            {product.name}
                          </p>

                          <p className="text-sm text-[#b1a1a1]">
                            {product.sales}
                          </p>

                        </div>

                        <p className="text-[#8c0303] font-semibold">
                          {product.amount}
                        </p>

                      </div>

                      <div className="w-full h-2 bg-[#fff1f1] rounded-full overflow-hidden">

                        <div
                          className="h-full bg-[#8c0303] rounded-full"
                          style={{
                            width: `${90 - index * 18}%`
                          }}
                        />

                      </div>

                    </div>

                  ))}

                </div>

              </div>

              {/* ACTIVIDAD */}
              <div className="bg-white border border-[#f3dede] rounded-[30px] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">

                <div className="flex items-center justify-between mb-6">

                  <h3 className="text-[32px] ivy text-[#7a0000]">
                    Actividad Reciente
                  </h3>

                  <Bell className="text-[#8c0303]" size={22} />

                </div>

                <div className="space-y-5">

{recentActivity.map((item, index) => (

                    <div
                      key={index}
                      className="flex items-center justify-between border-b border-[#f5e7e7] pb-4"
                    >

                      <div>

                        <p className="font-semibold text-[#8c0303]">
                          {item.order}
                        </p>

                        <p className="text-sm text-[#7a7a7a]">
                          {item.item}
                        </p>

                        <p className="text-xs text-[#b1a1a1]">
                          {item.payment}
                        </p>

                      </div>

                      <div className="text-right">

                        <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs">
                          Entregado
                        </span>

                        <p className="font-semibold mt-2 text-[#2e2e2e]">
                          {item.total}
                        </p>

                      </div>

                    </div>

                  ))}

                </div>

              </div>

 {/* ACCIONES E INSIGHTS */}
<div className="space-y-6">
<div className="bg-white border border-[#f3dede] rounded-[30px] p-6">
    <h3 className="text-[30px] ivy text-[#7a0000] mb-6">
      Pendientes por revisar
    </h3>

    <div className="space-y-4">
      {reviewItems.length === 0 ? (
        <p className="text-sm text-[#b07a7a]">
          No hay pendientes importantes por ahora.
        </p>
      ) : (
        reviewItems.slice(0, 5).map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between border-b border-[#f3dede] pb-3"
          >
            <p className="font-semibold text-[#2e2e2e]">
              {item.label}
            </p>

            <span className="px-3 py-1 rounded-full bg-[#fff1f1] text-[#8c0303] text-sm">
              {item.value}
            </span>
          </div>
        ))
      )}
    </div>
  </div>

  <div className="bg-white border border-[#f3dede] rounded-[30px] p-6">
    <h3 className="text-[30px] ivy text-[#7a0000] mb-6">
      Oportunidades
    </h3>

    <div className="space-y-4">
      {opportunityItems.length === 0 ? (
        <p className="text-sm text-[#b07a7a]">
          Aún no hay suficientes datos para detectar oportunidades.
        </p>
      ) : (
        opportunityItems.slice(0, 4).map((item) => (
          <div
            key={item.label}
            className="border-b border-[#f3dede] pb-3"
          >
            <p className="text-xs uppercase tracking-[0.16em] text-[#b9a0a0]">
              {item.label}
            </p>

            <p className="font-semibold text-[#2e2e2e] mt-1">
              {item.value}
            </p>

            <p className="text-sm text-[#b07a7a]">
              {item.detail}
            </p>
          </div>
        ))
      )}
    </div>
  </div>

  <div className="bg-white border border-[#f3dede] rounded-[30px] p-6">
    <h3 className="text-[30px] ivy text-[#7a0000] mb-6">
      Tareas del negocio
    </h3>

    <div className="space-y-4">
      {businessTasks.length === 0 ? (
        <p className="text-sm text-[#b07a7a]">
          Todo se ve en orden por ahora.
        </p>
      ) : (
        businessTasks.slice(0, 4).map((item) => (
          <div
            key={item.label}
            className="border-b border-[#f3dede] pb-3"
          >
            <p className="font-semibold text-[#2e2e2e]">
              {item.label}
            </p>

            <p className="text-sm text-[#b07a7a]">
              {item.detail}
            </p>
          </div>
        ))
      )}
    </div>
  </div>
      </div>
    </div>
  </div>
  </div>
</section>
</main>
)
}