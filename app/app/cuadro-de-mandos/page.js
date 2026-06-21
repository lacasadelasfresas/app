'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

import {
  AlertTriangle,
  Bell,
  DollarSign,
  Search,
  ShoppingCart,
  Sparkles,
  TrendingUp,
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
  Cell,
} from 'recharts'

const PAYMENT_COLORS = [
  '#8c0303',
  '#d9c55f',
  '#c98a8a',
  '#b07a7a',
  '#8e8e8e',
]

const DAILY_MESSAGES = [
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

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`
}

function formatMonth(date) {
  return date.toLocaleDateString('es-PA', {
    month: 'long',
    year: 'numeric',
  })
}

function getTopItem(items, field) {
  const totals = {}

  items.forEach((item) => {
    const value = item[field]

    if (!value) return

    totals[value] = (totals[value] || 0) + 1
  })

  return Object.entries(totals)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)[0]
}

function getTopRevenueItem(items, field) {
  const totals = {}

  items.forEach((item) => {
    const value = item[field]

    if (!value) return

    totals[value] =
      (totals[value] || 0) + Number(item.monto_pago || 0)
  })

  return Object.entries(totals)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)[0]
}

function formatOperationId(sale) {
  const rawId = sale.operacion || sale.id || ''
  const numberPart = String(rawId).replace(/\D/g, '').slice(-4)

  return numberPart
    ? `#OP-${numberPart.padStart(4, '0')}`
    : '#OP-0000'
}

function MetricCard({
  title,
  value,
  subtitle,
  alert = false,
  className = '',
}) {
  return (
    <div
      className={`bg-white border border-[#f3dede] rounded-[26px] p-5 md:p-7 shadow-[0_4px_30px_rgba(0,0,0,0.03)] ${className}`}
    >
      <p className="text-[10px] md:text-xs uppercase tracking-[0.18em] text-[#b9a0a0]">
        {title}
      </p>

      <h2 className="text-[30px] md:text-[40px] leading-none text-[#7a0000] ivy mt-4 break-words">
        {value}
      </h2>

      <p
        className={`mt-3 text-xs md:text-sm ${
          alert ? 'text-red-500' : 'text-[#b07a7a]'
        }`}
      >
        {subtitle}
      </p>
    </div>
  )
}

export default function DashboardPage() {
  const [salesData, setSalesData] = useState([])
  const [paymentData, setPaymentData] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [inventoryAlerts, setInventoryAlerts] = useState([])
  const [reviewItems, setReviewItems] = useState([])
  const [opportunityItems, setOpportunityItems] = useState([])
  const [businessTasks, setBusinessTasks] = useState([])

  const [totalIncome, setTotalIncome] = useState(0)
  const [totalTransactions, setTotalTransactions] = useState(0)
  const [averageTicket, setAverageTicket] = useState(0)

  const [incomeChange, setIncomeChange] = useState(0)
  const [transactionsChange, setTransactionsChange] = useState(0)
  const [ticketChange, setTicketChange] = useState(0)

  const [todayIncome, setTodayIncome] = useState(0)
  const [todayTransactions, setTodayTransactions] = useState(0)
  const [lastSale, setLastSale] = useState(null)

  const [starProduct, setStarProduct] = useState('Sin datos')
  const [activePoint, setActivePoint] = useState('Sin datos')
  const [chartTitle, setChartTitle] = useState('Ventas diarias')
  const [loading, setLoading] = useState(true)

  const todayMessage =
    DAILY_MESSAGES[new Date().getDate() % DAILY_MESSAGES.length]

  const noSalesAlert = totalTransactions === 0
  const lowTicketAlert = averageTicket > 0 && averageTicket < 5
  const negativeIncomeTrendAlert = incomeChange < 0
  const negativeTicketTrendAlert = ticketChange < 0
  const negativeTransactionsTrendAlert = transactionsChange < 0

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    setLoading(true)

    const today = new Date()

    const currentStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    )

    const currentEnd = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    )

    const previousStart = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1
    )

    const previousEnd = new Date(
      today.getFullYear(),
      today.getMonth(),
      0
    )

    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')

      return `${year}-${month}-${day}`
    }

    const [
      currentSalesResponse,
      previousSalesResponse,
      productosResponse,
      recipesResponse,
      inventarioResponse,
    ] = await Promise.all([
      supabase
        .from('ventas')
        .select('*')
        .gte('fecha', formatDate(currentStart))
        .lte('fecha', formatDate(currentEnd))
        .order('fecha', { ascending: true }),

      supabase
        .from('ventas')
        .select('*')
        .gte('fecha', formatDate(previousStart))
        .lte('fecha', formatDate(previousEnd))
        .order('fecha', { ascending: true }),

      supabase
        .from('productos')
        .select('id, nombre, activo'),

      supabase
        .from('recipes')
        .select('producto_id'),

      supabase
        .from('inventario')
        .select('id, nombre, stock_actual, stock_minimo, unidad'),
    ])

    if (currentSalesResponse.error || previousSalesResponse.error) {
      console.error(
        currentSalesResponse.error || previousSalesResponse.error
      )
      setLoading(false)
      return
    }

    if (productosResponse.error) {
      console.error('Error cargando productos:', productosResponse.error)
    }

    if (recipesResponse.error) {
      console.error('Error cargando recipes:', recipesResponse.error)
    }

    if (inventarioResponse.error) {
      console.error('Error cargando inventario:', inventarioResponse.error)
    }

    const currentSales = currentSalesResponse.data || []
    const previousSales = previousSalesResponse.data || []
    const productos = productosResponse.data || []
    const recipes = recipesResponse.data || []
    const inventario = inventarioResponse.data || []

    const currentIncome = currentSales.reduce(
      (sum, sale) => sum + Number(sale.monto_pago || 0),
      0
    )

    const previousIncome = previousSales.reduce(
      (sum, sale) => sum + Number(sale.monto_pago || 0),
      0
    )

    const currentTransactions = currentSales.length
    const previousTransactions = previousSales.length

    const currentAverage = currentTransactions
      ? currentIncome / currentTransactions
      : 0

    const previousAverage = previousTransactions
      ? previousIncome / previousTransactions
      : 0

    const calculateChange = (currentValue, previousValue) => {
      if (!previousValue) {
        return currentValue > 0 ? 100 : 0
      }

      return ((currentValue - previousValue) / previousValue) * 100
    }

    setTotalIncome(currentIncome)
    setTotalTransactions(currentTransactions)
    setAverageTicket(currentAverage)

    setIncomeChange(calculateChange(currentIncome, previousIncome))
    setTransactionsChange(
      calculateChange(currentTransactions, previousTransactions)
    )
    setTicketChange(calculateChange(currentAverage, previousAverage))

    const todayString = formatDate(today)

    const todaySales = currentSales.filter(
      (sale) => sale.fecha === todayString
    )

    const todayIncomeValue = todaySales.reduce(
      (sum, sale) => sum + Number(sale.monto_pago || 0),
      0
    )

    setTodayIncome(todayIncomeValue)
    setTodayTransactions(todaySales.length)

    const latestSale = [...currentSales]
      .filter((sale) => sale.fecha)
      .sort(
        (a, b) =>
          new Date(`${b.fecha}T00:00:00`) -
          new Date(`${a.fecha}T00:00:00`)
      )[0]

    setLastSale(latestSale || null)

    const daysInCurrentMonth = currentEnd.getDate()

    const groupedCurrent = {}
    const groupedPrevious = {}

    currentSales.forEach((sale) => {
      if (!sale.fecha) return

      const day = new Date(`${sale.fecha}T00:00:00`).getDate()

      groupedCurrent[day] =
        (groupedCurrent[day] || 0) + Number(sale.monto_pago || 0)
    })

    previousSales.forEach((sale) => {
      if (!sale.fecha) return

      const day = new Date(`${sale.fecha}T00:00:00`).getDate()

      groupedPrevious[day] =
        (groupedPrevious[day] || 0) + Number(sale.monto_pago || 0)
    })

    const chart = Array.from(
      { length: daysInCurrentMonth },
      (_, index) => {
        const day = index + 1

        return {
          day: String(day).padStart(2, '0'),
          actual: groupedCurrent[day] || 0,
          anterior: groupedPrevious[day] || 0,
        }
      }
    )

    setSalesData(chart)

    const paymentGroups = {}

    currentSales.forEach((sale) => {
      const method = sale.metodo_pago || 'Sin método'

      paymentGroups[method] = (paymentGroups[method] || 0) + 1
    })

    const payments = Object.entries(paymentGroups).map(
      ([name, value], index) => ({
        name,
        value,
        color: PAYMENT_COLORS[index % PAYMENT_COLORS.length],
      })
    )

    setPaymentData(payments)

    const productGroups = {}

    currentSales.forEach((sale) => {
      const product = sale.producto || 'Sin producto'

      if (!productGroups[product]) {
        productGroups[product] = {
          name: product,
          quantity: 0,
          amount: 0,
        }
      }

      productGroups[product].quantity += Number(sale.cantidad || 1)
      productGroups[product].amount += Number(sale.monto_pago || 0)
    })

    const products = Object.values(productGroups).sort(
      (a, b) => b.quantity - a.quantity
    )

    setTopProducts(products.slice(0, 5))
    setStarProduct(products[0]?.name || 'Sin datos')

    const sellerGroups = {}

    currentSales.forEach((sale) => {
      const seller = sale.vendedor || sale.sucursal || 'Sin punto'

      sellerGroups[seller] =
        (sellerGroups[seller] || 0) + Number(sale.monto_pago || 0)
    })

    const topSeller = Object.entries(sellerGroups).sort(
      (a, b) => b[1] - a[1]
    )[0]

    setActivePoint(topSeller?.[0] || 'Sin datos')

    const recentSales = [...currentSales]
      .sort(
        (a, b) =>
          new Date(`${b.fecha}T00:00:00`) -
          new Date(`${a.fecha}T00:00:00`)
      )
      .slice(0, 5)
      .map((sale) => ({
        order: formatOperationId(sale),
        product: sale.producto || 'Sin producto',
        payment: sale.metodo_pago || 'Sin método',
        total: formatCurrency(sale.monto_pago),
        status: sale.status || 'Entregado',
      }))

    setRecentActivity(recentSales)

    const recipeProductIds = new Set(
      recipes.map((recipe) => recipe.producto_id).filter(Boolean)
    )

    const productsWithoutRecipe = productos.filter(
      (product) =>
        product.activo !== false &&
        !recipeProductIds.has(product.id)
    ).length

    const salesWithoutCustomer = currentSales.filter(
      (sale) => !sale.cliente || sale.cliente === 'Walk-in'
    ).length

    const salesWithoutWhatsapp = currentSales.filter(
      (sale) => !sale.whatsapp
    ).length

    const salesWithoutPaymentMethod = currentSales.filter(
      (sale) => !sale.metodo_pago
    ).length

    const zeroValueSales = currentSales.filter(
      (sale) => Number(sale.monto_pago || 0) <= 0
    ).length

    setReviewItems(
      [
        {
          label: 'Ventas sin cliente identificado',
          value: salesWithoutCustomer,
        },
        {
          label: 'Ventas sin WhatsApp',
          value: salesWithoutWhatsapp,
        },
        {
          label: 'Ventas sin método de pago',
          value: salesWithoutPaymentMethod,
        },
        {
          label: 'Ventas con monto $0',
          value: zeroValueSales,
        },
        {
          label: 'Productos sin recipe',
          value: productsWithoutRecipe,
        },
      ].filter((item) => item.value > 0)
    )

    const topProduct = getTopItem(currentSales, 'producto')
    const topPaymentMethod = getTopItem(
      currentSales,
      'metodo_pago'
    )
    const topOrderLocation = getTopItem(
      currentSales,
      'tipo_pedido'
    )
    const topRevenueProduct = getTopRevenueItem(
      currentSales,
      'producto'
    )

    setOpportunityItems(
      [
        topProduct && {
          label: 'Producto más vendido',
          value: topProduct.label,
          detail: `${topProduct.value} ventas`,
        },
        topPaymentMethod && {
          label: 'Método de pago más usado',
          value: topPaymentMethod.label,
          detail: `${topPaymentMethod.value} ventas`,
        },
        topOrderLocation && {
          label: 'Canal con más ventas',
          value: topOrderLocation.label,
          detail: `${topOrderLocation.value} ventas`,
        },
        topRevenueProduct && {
          label: 'Producto con más ingresos',
          value: topRevenueProduct.label,
          detail: formatCurrency(topRevenueProduct.value),
        },
      ].filter(Boolean)
    )

    const lowInventory = inventario.filter((item) => {
      const currentStock = Number(item.stock_actual || 0)
      const minimumStock = Number(item.stock_minimo || 0)

      return currentStock <= minimumStock
    })

    setInventoryAlerts(lowInventory.slice(0, 5))

    setBusinessTasks(
      [
        productsWithoutRecipe > 0 && {
          label: 'Completar recipes pendientes',
          detail: `${productsWithoutRecipe} productos sin recipe`,
        },
        lowInventory.length > 0 && {
          label: 'Revisar inventario bajo',
          detail: `${lowInventory.length} insumos requieren atención`,
        },
        salesWithoutWhatsapp > 0 && {
          label: 'Completar datos de clientes',
          detail: `${salesWithoutWhatsapp} ventas sin WhatsApp`,
        },
        salesWithoutPaymentMethod > 0 && {
          label: 'Actualizar métodos de pago',
          detail: `${salesWithoutPaymentMethod} ventas sin método registrado`,
        },
      ].filter(Boolean)
    )

    setChartTitle(
      `Ventas diarias · ${formatMonth(currentStart)}`
    )

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#fcf8f8] w-full">
      <section className="w-full">
<header className="bg-white border-b border-[#f1dede] px-5 md:px-8 py-3 md:h-[82px] md:py-0 md:flex md:items-center">
  <div className="w-full max-w-none">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="text-left">
        <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
          Vista general
        </p>

        <h1 className="mt-1 text-[21px] md:text-[23px] font-bold text-[#7a0000] leading-tight">
          Dashboard
        </h1>

        <p className="mt-1 text-xs md:text-sm text-[#b07a7a]">
          Resumen operativo de La Casa de las Fresas.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
        <div className="hidden xl:flex w-[250px] items-center gap-2 bg-[#fff5f5] px-4 py-2.5 rounded-xl">
          <Search size={16} className="text-[#b07a7a]" />

          <input
            placeholder="Buscar..."
            className="w-full bg-transparent outline-none text-sm text-[#2e2e2e]"
          />
        </div>

        <button
          type="button"
          aria-label="Notificaciones"
          className="hidden sm:flex w-10 h-10 rounded-xl bg-[#fff5f5] text-[#7a0000] items-center justify-center"
        >
          <Bell size={17} />
        </button>

        <Link
          href="/pedidos?new=1"
          className="w-full sm:w-auto bg-[#8c0303] text-white px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm whitespace-nowrap shadow-sm"
        >
          <DollarSign size={16} />
          Registrar venta
        </Link>
      </div>
    </div>
  </div>
</header>

        <div className="px-4 md:px-8 py-5 md:py-7 space-y-5 md:space-y-6">
          <section className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <MetricCard
              title="Ingresos del mes"
              value={formatCurrency(totalIncome)}
              subtitle={
                noSalesAlert
                  ? 'Sin ventas registradas'
                  : `${incomeChange >= 0 ? '+' : ''}${incomeChange.toFixed(
                      0
                    )}% vs. mes anterior`
              }
              alert={negativeIncomeTrendAlert || noSalesAlert}
            />

            <MetricCard
              title="Transacciones"
              value={totalTransactions}
              subtitle={
                noSalesAlert
                  ? 'Sin transacciones'
                  : `${transactionsChange >= 0 ? '+' : ''}${transactionsChange.toFixed(
                      0
                    )}% vs. mes anterior`
              }
              alert={negativeTransactionsTrendAlert || noSalesAlert}
            />

            <MetricCard
              title="Ticket promedio"
              value={formatCurrency(averageTicket)}
              subtitle={
                lowTicketAlert
                  ? 'Ticket por debajo de $5.00'
                  : `${ticketChange >= 0 ? '+' : ''}${ticketChange.toFixed(
                      0
                    )}% vs. mes anterior`
              }
              alert={lowTicketAlert || negativeTicketTrendAlert}
              className="col-span-2 lg:col-span-1"
            />
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white border border-[#f3dede] rounded-[26px] p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#b9a0a0]">
                    Mensaje del día
                  </p>

                  <p className="text-[19px] ivy text-[#8c0303] mt-4 leading-tight">
                    {todayMessage}
                  </p>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-[#fff1f1] text-[#8c0303] flex items-center justify-center shrink-0">
                  <Sparkles size={22} />
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#f3dede] rounded-[26px] p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#b9a0a0]">
                    Producto estrella
                  </p>

                  <p className="text-[25px] ivy text-[#7a0000] mt-4 leading-tight break-words">
                    {starProduct}
                  </p>
                </div>

                <TrendingUp
                  size={22}
                  className="text-[#8c0303] shrink-0"
                />
              </div>
            </div>

            <div className="bg-white border border-[#f3dede] rounded-[26px] p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#b9a0a0]">
                    Ventas del día
                  </p>

                  <p className="text-[30px] ivy text-[#7a0000] mt-4 leading-none">
                    {formatCurrency(todayIncome)}
                  </p>

                  <p className="text-sm text-[#b07a7a] mt-3">
                    {todayTransactions} ventas registradas hoy
                  </p>
                </div>

                <ShoppingCart
                  size={22}
                  className="text-[#8c0303] shrink-0"
                />
              </div>
            </div>

            <div className="bg-[#fff7f7] border border-[#f3dede] rounded-[26px] p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#b9a0a0]">
                    Última venta
                  </p>

                  <p className="text-[30px] ivy text-[#7a0000] mt-4 leading-none">
                    {lastSale
                      ? formatCurrency(lastSale.monto_pago)
                      : '$0.00'}
                  </p>

                  <p className="text-sm text-[#b07a7a] mt-3 break-words">
                    {lastSale
                      ? `${lastSale.producto || 'Sin producto'} · ${
                          lastSale.vendedor || 'Sin vendedor'
                        }`
                      : 'Sin ventas registradas'}
                  </p>
                </div>

                <DollarSign
                  size={22}
                  className="text-[#8c0303] shrink-0"
                />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-5 md:gap-6">
            <div className="xl:col-span-2 bg-white border border-[#f3dede] rounded-[28px] p-5 md:p-7 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-[27px] md:text-[32px] ivy text-[#7a0000] leading-none">
                    {chartTitle}
                  </h2>

                  <p className="text-sm text-[#b07a7a] mt-2">
                    Ingresos reales por día ·{' '}
                    <span className="font-semibold text-[#8c0303]">
                      {totalTransactions} transacciones
                    </span>
                  </p>
                </div>

                <div className="text-xs text-[#b07a7a] flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#8c0303]" />
                  {activePoint}
                </div>
              </div>

              <div className="h-[250px] md:h-[320px] w-full min-w-0">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-sm text-[#b07a7a]">
                    Cargando ventas...
                  </div>
                ) : salesData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-[#b07a7a]">
                    No hay ventas registradas para este período.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData}>
                      <defs>
                        <linearGradient
                          id="salesGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#8c0303"
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="100%"
                            stopColor="#8c0303"
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        stroke="#f3dede"
                        strokeDasharray="4 4"
                      />

                      <XAxis
                        dataKey="day"
                        tick={{ fill: '#b07a7a', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />

                      <YAxis
                        tick={{ fill: '#b07a7a', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        width={42}
                        tickFormatter={(value) => `$${value}`}
                      />

                      <Tooltip
                        formatter={(value, key) => [
                          formatCurrency(value),
                          key === 'actual'
                            ? 'Mes actual'
                            : 'Mes anterior',
                        ]}
                        contentStyle={{
                          borderRadius: '14px',
                          border: '1px solid #f3dede',
                        }}
                      />

                      <Area
                        type="monotone"
                        dataKey="anterior"
                        stroke="#d9c55f"
                        strokeWidth={2}
                        fill="none"
                        dot={false}
                      />

                      <Area
                        type="monotone"
                        dataKey="actual"
                        stroke="#8c0303"
                        strokeWidth={3}
                        fill="url(#salesGradient)"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-white border border-[#f3dede] rounded-[28px] p-5 md:p-7 min-w-0">
              <h2 className="text-[27px] md:text-[30px] ivy text-[#7a0000]">
                Métodos de pago
              </h2>

              <div className="h-[220px] mt-3">
                {paymentData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-[#b07a7a]">
                    Sin métodos de pago registrados.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentData}
                        dataKey="value"
                        innerRadius={55}
                        outerRadius={82}
                        paddingAngle={3}
                      >
                        {paymentData.map((method) => (
                          <Cell
                            key={method.name}
                            fill={method.color}
                          />
                        ))}
                      </Pie>

                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="space-y-3 mt-3">
                {paymentData.map((method) => {
                  const total = paymentData.reduce(
                    (sum, item) => sum + item.value,
                    0
                  )

                  const percentage = total
                    ? Math.round((method.value / total) * 100)
                    : 0

                  return (
                    <div
                      key={method.name}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{
                            backgroundColor: method.color,
                          }}
                        />

                        <span className="truncate text-[#6f6f6f]">
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
          </section>

          <section className="bg-[#fff7f7] border border-[#f3dede] rounded-[28px] p-5 md:p-7">
            <div className="flex items-center gap-3 mb-5">
              <AlertTriangle className="text-[#8c0303]" size={22} />

              <div>
                <h2 className="text-[27px] md:text-[32px] ivy text-[#7a0000] leading-none">
                  Alertas de inventario
                </h2>

                <p className="text-sm text-[#b07a7a] mt-2">
                  Insumos que requieren atención.
                </p>
              </div>
            </div>

            {inventoryAlerts.length === 0 ? (
              <div className="bg-white rounded-2xl p-5 text-sm text-[#b07a7a]">
                No hay alertas de inventario por ahora.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {inventoryAlerts.map((item) => {
                  const currentStock = Number(item.stock_actual || 0)
                  const minimumStock = Number(item.stock_minimo || 0)
                  const outOfStock = currentStock <= 0

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl p-5 flex items-start justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-[#2e2e2e] break-words">
                          {item.nombre}
                        </p>

                        <p className="text-sm text-[#b07a7a] mt-2">
                          {currentStock} {item.unidad || 'unidades'} restantes
                          · mínimo {minimumStock}
                        </p>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs shrink-0 ${
                          outOfStock
                            ? 'bg-red-100 text-red-600'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {outOfStock ? 'Agotado' : 'Bajo'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-5 md:gap-6">
            <div className="bg-white border border-[#f3dede] rounded-[28px] p-5 md:p-7">
              <div className="flex items-center justify-between gap-3 mb-5">
                <h2 className="text-[27px] md:text-[30px] ivy text-[#7a0000] leading-none">
                  Productos más vendidos
                </h2>

                <TrendingUp
                  size={22}
                  className="text-[#8c0303] shrink-0"
                />
              </div>

              {topProducts.length === 0 ? (
                <p className="text-sm text-[#b07a7a]">
                  No hay ventas suficientes para mostrar productos.
                </p>
              ) : (
                <div className="space-y-5">
                  {topProducts.map((product, index) => {
                    const highestQuantity =
                      topProducts[0]?.quantity || 1

                    const width = Math.max(
                      8,
                      (product.quantity / highestQuantity) * 100
                    )

                    return (
                      <div key={product.name}>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-[#2e2e2e] break-words">
                              {product.name}
                            </p>

                            <p className="text-sm text-[#b07a7a]">
                              {product.quantity} uds
                            </p>
                          </div>

                          <p className="font-semibold text-[#8c0303] whitespace-nowrap">
                            {formatCurrency(product.amount)}
                          </p>
                        </div>

                        <div className="h-2 bg-[#fff1f1] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#8c0303] rounded-full"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="bg-white border border-[#f3dede] rounded-[28px] p-5 md:p-7">
              <div className="flex items-center justify-between gap-3 mb-5">
                <h2 className="text-[27px] md:text-[30px] ivy text-[#7a0000] leading-none">
                  Actividad reciente
                </h2>

                <Bell
                  size={22}
                  className="text-[#8c0303] shrink-0"
                />
              </div>

              {recentActivity.length === 0 ? (
                <p className="text-sm text-[#b07a7a]">
                  Aún no hay ventas recientes.
                </p>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((item) => (
                    <div
                      key={item.order}
                      className="flex items-start justify-between gap-3 border-b border-[#f5e7e7] pb-4 last:border-b-0"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-[#8c0303]">
                          {item.order}
                        </p>

                        <p className="text-sm text-[#2e2e2e] mt-1 break-words">
                          {item.product}
                        </p>

                        <p className="text-xs text-[#b07a7a] mt-1">
                          {item.payment}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">
                          {item.status}
                        </span>

                        <p className="font-semibold text-[#2e2e2e] mt-2">
                          {item.total}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div className="bg-white border border-[#f3dede] rounded-[28px] p-5">
                <h2 className="text-[27px] ivy text-[#7a0000] leading-none mb-5">
                  Pendientes por revisar
                </h2>

                {reviewItems.length === 0 ? (
                  <p className="text-sm text-[#b07a7a]">
                    No hay pendientes importantes por ahora.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {reviewItems.slice(0, 5).map((item) => (
                      <div
                        key={item.label}
                        className="flex items-start justify-between gap-3 border-b border-[#f3dede] pb-3 last:border-b-0"
                      >
                        <p className="font-semibold text-sm text-[#2e2e2e]">
                          {item.label}
                        </p>

                        <span className="px-3 py-1 rounded-full bg-[#fff1f1] text-[#8c0303] text-sm shrink-0">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white border border-[#f3dede] rounded-[28px] p-5">
                <h2 className="text-[27px] ivy text-[#7a0000] leading-none mb-5">
                  Oportunidades
                </h2>

                {opportunityItems.length === 0 ? (
                  <p className="text-sm text-[#b07a7a]">
                    Aún no hay suficientes datos para detectar oportunidades.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {opportunityItems.slice(0, 4).map((item) => (
                      <div
                        key={item.label}
                        className="border-b border-[#f3dede] pb-3 last:border-b-0"
                      >
                        <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
                          {item.label}
                        </p>

                        <p className="font-semibold text-[#2e2e2e] mt-1 break-words">
                          {item.value}
                        </p>

                        <p className="text-sm text-[#b07a7a] mt-1">
                          {item.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white border border-[#f3dede] rounded-[28px] p-5">
                <h2 className="text-[27px] ivy text-[#7a0000] leading-none mb-5">
                  Tareas del negocio
                </h2>

                {businessTasks.length === 0 ? (
                  <p className="text-sm text-[#b07a7a]">
                    Todo se ve en orden por ahora.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {businessTasks.slice(0, 4).map((item) => (
                      <div
                        key={item.label}
                        className="border-b border-[#f3dede] pb-3 last:border-b-0"
                      >
                        <p className="font-semibold text-[#2e2e2e]">
                          {item.label}
                        </p>

                        <p className="text-sm text-[#b07a7a] mt-1">
                          {item.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}