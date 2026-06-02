'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  Search,
  Plus,
  Download,
  X,
  ChevronDown,
  Eye,
  Pencil,
  RefreshCw,
  Trash2,
} from 'lucide-react'

function PedidosContent() {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
const [fechaFin, setFechaFin] = useState('')
const [productoFiltro, setProductoFiltro] = useState('Todos')
const [metodoPagoFiltro, setMetodoPagoFiltro] = useState('Todos')
  const [toppings, setToppings] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [editingOrder, setEditingOrder] = useState(null)

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

function limpiarFiltrosPedidos() {
  setSearch('')
  setFechaInicio('')
  setFechaFin('')
  setProductoFiltro('Todos')
  setMetodoPagoFiltro('Todos')
}

  const [form, setForm] = useState({
  cliente: '',
  whatsapp: '',
  email: '',
  producto: '',
  tipo_pedido: 'Northside Galleries',
  metodo_pago: 'Efectivo',
  fecha: getTodayDate(),
  cupon: '',
  tipo_descuento: 'Sin descuento',
  descuento: '',
  observaciones: '',
  monto_pago: 0,
})

useEffect(() => {
  fetchOrders()
  fetchProducts()
}, [])

useEffect(() => {
  const params = new URLSearchParams(window.location.search)

  if (params.get('new') === '1') {
    setShowModal(true)
  }
}, [])

async function fetchOrders() {
  setLoading(true)

  const { data, error } = await supabase
    .from('ventas')
    .select('*')
    .not('fecha', 'is', null)
    .not('producto', 'is', null)
    .not('metodo_pago', 'is', null)
    .not('monto_pago', 'is', null)
    .order('fecha', { ascending: false })

  if (error) {
    console.error('ERROR FETCH ORDERS:', error)
    setLoading(false)
    return
  }

  setOrders(data || [])
  setLoading(false)
}

async function fetchProducts() {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .order('nombre', { ascending: true })

  if (error) {
    console.error(error)
    return
  }

  setProducts(data || [])
}

const validOrders = orders.filter((order) =>
  order.fecha &&
  order.producto &&
  order.metodo_pago &&
  order.monto_pago !== null
)

const productosFiltro = [
  'Todos',
  ...new Set(validOrders.map((order) => order.producto).filter(Boolean)),
]

const metodosPagoFiltro = [
  'Todos',
  ...new Set(validOrders.map((order) => order.metodo_pago).filter(Boolean)),
]

const filteredOrders = validOrders.filter((order) => {
  const text = `
    ${order.cliente || ''}
    ${order.producto || ''}
    ${order.metodo_pago || ''}
    ${order.tipo_pedido || ''}
    ${order.sucursal || ''}
    ${order.vendedor || ''}
    ${order.operacion || ''}
    ${formatOrderId(order)}
  `.toLowerCase()

  const matchesSearch = text.includes(search.toLowerCase())

  const orderFecha = order.fecha || order.created_at?.split('T')[0] || ''

  const matchesFechaInicio =
    !fechaInicio || orderFecha >= fechaInicio

  const matchesFechaFin =
    !fechaFin || orderFecha <= fechaFin

  const matchesProducto =
    productoFiltro === 'Todos' || order.producto === productoFiltro

  const matchesMetodoPago =
    metodoPagoFiltro === 'Todos' || order.metodo_pago === metodoPagoFiltro

  return (
    matchesSearch &&
    matchesFechaInicio &&
    matchesFechaFin &&
    matchesProducto &&
    matchesMetodoPago
  )
})

const ventasFiltradas = filteredOrders.length

const totalFiltrado = filteredOrders.reduce((acc, order) => {
  return acc + Number(order.monto_pago || 0)
}, 0)

const ticketPromedioFiltrado =
  ventasFiltradas > 0 ? totalFiltrado / ventasFiltradas : 0

const metodoMasUsado = (() => {
  const conteo = {}

  filteredOrders.forEach((order) => {
    const metodo = order.metodo_pago || 'Sin método'
    conteo[metodo] = (conteo[metodo] || 0) + 1
  })

  const top = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0]

  return top ? top[0] : 'Sin datos'
})()

function exportToCSV() {
  const headers = [
    'ID',
    'Fecha',
    'Cliente',
    'WhatsApp',
    'Email',
    'Producto',
    'Sucursal',
    'Vendedor',
    'Metodo de Pago',
    'Total',
    'Cupon',
    'Tipo de Descuento',
    'Descuento',
    'Observaciones',
  ]

  const rows = filteredOrders.map((order) => [
    formatOrderId(order),
    order.fecha || order.created_at?.split('T')[0] || '',
    order.cliente || 'Walk-in',
    order.whatsapp || '',
    order.email || '',
    order.producto || '',
    order.tipo_pedido || order.sucursal || 'Punto de Venta',
    order.vendedor || '',
    order.metodo_pago || '',
    Number(order.monto_pago || 0).toFixed(2),
    order.cupon || '',
    order.tipo_descuento || 'Sin descuento',
    Number(order.descuento || 0).toFixed(2),
    order.observaciones || '',
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
    `registro-pedidos-${new Date().toISOString().split('T')[0]}.csv`
  )
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function exportToExcel() {
  const headers = [
    'ID',
    'Fecha',
    'Cliente',
    'WhatsApp',
    'Email',
    'Producto',
    'Sucursal',
    'Vendedor',
    'Metodo de Pago',
    'Total',
    'Cupon',
    'Tipo de Descuento',
    'Descuento',
    'Observaciones',
  ]

  const rows = filteredOrders.map((order) => [
    formatOrderId(order),
    order.fecha || order.created_at?.split('T')[0] || '',
    order.cliente || 'Walk-in',
    order.whatsapp || '',
    order.email || '',
    order.producto || '',
    order.tipo_pedido || order.sucursal || 'Punto de Venta',
    order.vendedor || '',
    order.metodo_pago || '',
    Number(order.monto_pago || 0).toFixed(2),
    order.cupon || '',
    order.tipo_descuento || 'Sin descuento',
    Number(order.descuento || 0).toFixed(2),
    order.observaciones || '',
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
  link.download = `registro-pedidos-${new Date().toISOString().split('T')[0]}.xls`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}


function handleChange(e) {
  const { name, value } = e.target

  setForm((prev) => ({
    ...prev,
    [name]: value,
  }))
}

function openEditOrder(order) {
  setEditingOrder(order)

  setForm({
    cliente: order.cliente || '',
    whatsapp: order.whatsapp || '',
    email: order.email || '',
    producto: order.producto || '',
    tipo_pedido: order.tipo_pedido || 'Northside Galleries',
    sucursal: order.vendedor || 'Nathalie',
    metodo_pago: order.metodo_pago || 'Efectivo',
    fecha: order.fecha || getTodayDate(),
    cupon: order.cupon || '',
    tipo_descuento: order.tipo_descuento || 'Sin descuento',
    descuento: order.descuento || '',
    observaciones: order.observaciones || '',
    notas: order.observaciones || '',
    monto_pago: Number(order.monto_pago || 0),
  })

  setSelectedOrder(null)
  setShowModal(true)
}

function handleProductChange(e) {
  const selectedProductName = e.target.value

  const selectedProduct = products.find(
    (product) => product.nombre === selectedProductName
  )

  setForm((prev) => ({
    ...prev,
    producto: selectedProductName,
    monto_pago: selectedProduct ? Number(selectedProduct.precio || 0) : 0,
  }))
}

async function descontarInventarioPorVenta(productoNombre, ventaId) {
  if (!productoNombre) return

  // 1. Buscar el producto en la tabla productos
  const { data: producto, error: productoError } = await supabase
    .from('productos')
    .select('id, nombre')
    .eq('nombre', productoNombre)
    .single()

  if (productoError || !producto) {
    console.warn('No se encontró producto para descontar inventario:', productoNombre)
    return
  }

  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
  <div className="bg-white border border-[#f3dede] rounded-2xl p-5">
    <p className="text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
      Ventas filtradas
    </p>
    <p className="text-3xl ivy text-[#8c0303]">
      {ventasFiltradas}
    </p>
  </div>

  <div className="bg-white border border-[#f3dede] rounded-2xl p-5">
    <p className="text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
      Total vendido
    </p>
    <p className="text-3xl ivy text-[#8c0303]">
      ${totalFiltrado.toFixed(2)}
    </p>
  </div>
</div>

  // 2. Buscar la receta de ese producto
  const { data: recipeItems, error: recipeError } = await supabase
    .from('recipes')
    .select(`
      id,
      cantidad,
      unidad,
      inventario_id,
      inventario (
        id,
        nombre,
        stock_actual,
        unidad
      )
    `)
    .eq('producto_id', producto.id)

  if (recipeError) {
    console.error('Error buscando receta:', recipeError)
    return
  }

  if (!recipeItems || recipeItems.length === 0) {
    console.warn('Este producto no tiene receta registrada:', productoNombre)
    return
  }

  // 3. Descontar cada insumo
  for (const item of recipeItems) {
    const stockActual = Number(item.inventario?.stock_actual || 0)
    const cantidadUsada = Number(item.cantidad || 0)
    const nuevoStock = stockActual - cantidadUsada

const { data: updatedInventario, error: updateError } = await supabase
  .from('inventario')
  .update({
    stock_actual: nuevoStock,
  })
  .eq('id', item.inventario_id)
  .select('id, nombre, stock_actual')

    if (updateError) {
      console.error('Error descontando inventario:', updateError)
      continue
    }

    // 4. Registrar movimiento de salida
    const { error: movimientoError } = await supabase
      .from('inventario_movimientos')
      .insert([
        {
          inventario_id: item.inventario_id,
          tipo: 'salida',
          cantidad: cantidadUsada,
          motivo: 'Venta',
          referencia: ventaId ? `Venta ${ventaId}` : productoNombre,
        },
      ])

    if (movimientoError) {
      console.error('Error registrando salida de inventario:', movimientoError)
    }
  }
}

async function recalcularInventarioDeVenta(venta) {
  if (!venta?.id || !venta?.producto) {
    alert('No se encontró la información de esta venta.')
    return
  }

  const confirmar = confirm(
    `¿Deseas recalcular el inventario de esta venta?\n\nProducto: ${venta.producto}\n\nEsto revertirá el descuento anterior y aplicará la receta actual.`
  )

  if (!confirmar) return

  const referencia = `Venta ${venta.id}`

  // 1. Buscar movimientos anteriores de esa venta
  const { data: movimientosAnteriores, error: movimientosError } = await supabase
    .from('inventario_movimientos')
    .select(`
      id,
      inventario_id,
      cantidad,
      tipo,
      inventario (
        id,
        nombre,
        stock_actual
      )
    `)
    .eq('referencia', referencia)
    .eq('tipo', 'salida')

  if (movimientosError) {
    console.error('Error buscando movimientos anteriores:', movimientosError)
    alert('No se pudieron buscar los movimientos anteriores.')
    return
  }

  // 2. Devolver al inventario lo descontado anteriormente
  for (const movimiento of movimientosAnteriores || []) {
    const stockActual = Number(movimiento.inventario?.stock_actual || 0)
    const cantidadDevuelta = Number(movimiento.cantidad || 0)
    const stockCorregido = stockActual + cantidadDevuelta

    const { error: updateError } = await supabase
      .from('inventario')
      .update({
        stock_actual: stockCorregido,
      })
      .eq('id', movimiento.inventario_id)

    if (updateError) {
      console.error('Error devolviendo inventario:', updateError)
      alert('Hubo un error devolviendo inventario. Revisa la consola.')
      return
    }
  }

  // 3. Eliminar movimientos anteriores
  if (movimientosAnteriores && movimientosAnteriores.length > 0) {
    const ids = movimientosAnteriores.map((movimiento) => movimiento.id)

    const { error: deleteError } = await supabase
      .from('inventario_movimientos')
      .delete()
      .in('id', ids)

    if (deleteError) {
      console.error('Error eliminando movimientos anteriores:', deleteError)
      alert('No se pudieron eliminar los movimientos anteriores.')
      return
    }
  }

  // 4. Aplicar receta actual
  await descontarInventarioPorVenta(venta.producto, venta.id)

  alert('Inventario recalculado correctamente.')
  fetchOrders()
}

async function eliminarVenta(venta) {
  if (!venta?.id) {
    alert('No se encontró la venta para eliminar.')
    return
  }

  const confirmar = confirm(
    `¿Deseas eliminar esta venta?\n\nVenta #${venta.id}\nProducto: ${venta.producto}\n\nEsto también devolverá al inventario los insumos descontados.`
  )

  if (!confirmar) return

  const referencia = `Venta ${venta.id}`

  // 1. Buscar movimientos de inventario asociados a esta venta
  const { data: movimientos, error: movimientosError } = await supabase
    .from('inventario_movimientos')
    .select(`
      id,
      inventario_id,
      cantidad,
      tipo,
      inventario (
        id,
        nombre,
        stock_actual
      )
    `)
    .eq('referencia', referencia)
    .eq('tipo', 'salida')

  if (movimientosError) {
    console.error('Error buscando movimientos de inventario:', movimientosError)
    alert('No se pudieron buscar los movimientos de inventario.')
    return
  }

  // 2. Devolver inventario
  for (const movimiento of movimientos || []) {
    const stockActual = Number(movimiento.inventario?.stock_actual || 0)
    const cantidadDevuelta = Number(movimiento.cantidad || 0)
    const nuevoStock = stockActual + cantidadDevuelta

    const { error: updateError } = await supabase
      .from('inventario')
      .update({
        stock_actual: nuevoStock,
      })
      .eq('id', movimiento.inventario_id)

    if (updateError) {
      console.error('Error devolviendo inventario:', updateError)
      alert('Hubo un error devolviendo inventario. Revisa la consola.')
      return
    }
  }

  // 3. Eliminar movimientos asociados
  if (movimientos && movimientos.length > 0) {
    const ids = movimientos.map((movimiento) => movimiento.id)

    const { error: deleteMovimientosError } = await supabase
      .from('inventario_movimientos')
      .delete()
      .in('id', ids)

    if (deleteMovimientosError) {
      console.error('Error eliminando movimientos:', deleteMovimientosError)
      alert('No se pudieron eliminar los movimientos de inventario.')
      return
    }
  }

  // 4. Eliminar venta
  const { error: ventaError } = await supabase
    .from('ventas')
    .delete()
    .eq('id', venta.id)

  if (ventaError) {
    console.error('Error eliminando venta:', ventaError)
    alert('No se pudo eliminar la venta.')
    return
  }

  alert('Venta eliminada correctamente.')

  setSelectedOrder(null)
  fetchOrders()
}

async function guardarPedido() {
if (!form.producto || !form.monto_pago) {
  alert('Debes seleccionar un producto y agregar el precio.')
  return
}

  setSaving(true)

  if (editingOrder) {
  const { error: updateError } = await supabase
    .from('ventas')
    .update({
      fecha: form.fecha || new Date().toISOString().split('T')[0],
      cliente: form.cliente || 'Walk-in',
      whatsapp: form.whatsapp || null,
      email: form.email || null,
      producto: form.producto,
      tipo_pedido: form.tipo_pedido || 'Northside Galleries',
      metodo_pago: form.metodo_pago || 'Efectivo',
      vendedor: form.sucursal || 'Nathalie',
      monto_pago: Number(form.monto_pago || 0),
      cupon: form.cupon || null,
      tipo_descuento: form.tipo_descuento || 'Sin descuento',
      descuento: Number(form.descuento || 0),
      observaciones: form.notas || null,
      status: 'Pagado',
      editado_por: 'Nathalie',
      editado_en: new Date().toISOString(),
    })
    .eq('id', editingOrder.id)

  if (updateError) {
    console.error('Error editando venta:', updateError)
    alert('No se pudo actualizar la venta.')
    setSaving(false)
    return
  }

  alert('Venta actualizada correctamente.')

  setShowModal(false)
  setEditingOrder(null)
  setSelectedOrder(null)

  setForm({
    cliente: '',
    whatsapp: '',
    email: '',
    producto: '',
    tipo_pedido: 'Northside Galleries',
    sucursal: 'Nathalie',
    metodo_pago: 'Efectivo',
    fecha: getTodayDate(),
    cupon: '',
    tipo_descuento: 'Sin descuento',
    descuento: '',
    observaciones: '',
    notas: '',
    monto_pago: '',
  })

  await fetchOrders()
  setSaving(false)
  return
}

const { data, error } = await supabase
    .from('ventas')
    .insert([
      {
        fecha: form.fecha || new Date().toISOString().split('T')[0],
        cliente: form.cliente || 'Walk-in',
        whatsapp: form.whatsapp || null,
        email: form.email || null,
        producto: form.producto,
        tipo_pedido: form.tipo_pedido || 'Northside Galleries',
        metodo_pago: form.metodo_pago || 'Efectivo',
        vendedor: form.sucursal || 'Nathalie',
        cantidad: 1,
        monto_pago: Number(form.monto_pago || 0),
        cupon: form.cupon || null,
        tipo_descuento: form.tipo_descuento || 'Sin descuento',
        descuento: Number(form.descuento || 0),
        observaciones: form.notas || null,
        status: 'Pagado',
      },
  ])
  .select()
  .single()

if (error) {
  console.error('ERROR GUARDANDO VENTA:', error)
  alert('No se pudo guardar la venta. Revisa la consola.')
  setSaving(false)
  return
}

await descontarInventarioPorVenta(form.producto, data?.id)

  await fetchOrders()

  setForm({
    cliente: '',
    whatsapp: '',
    email: '',
    producto: '',
    tipo_pedido: 'Northside Galleries',
    sucursal: 'Nathalie',
    metodo_pago: 'Efectivo',
    fecha: getTodayDate(),  
    cupon: '',
    tipo_descuento: 'Sin descuento',
    descuento: '',
    observaciones: '',
    notas: '',
    monto_pago: 0,
  })

  setShowModal(false)
  setSaving(false)
}

const inputClass =
  'w-full px-3 py-2.5 rounded-xl border border-[#efcccc] bg-[#fff7f7] outline-none text-sm'

function formatOrderId(order) {
  const rawId = order.operacion || order.id || ''
  const numberPart = String(rawId).replace(/\D/g, '').slice(-4)

  if (numberPart) {
    return `#OP-${numberPart.padStart(4, '0')}`
  }

  return '#OP-0000'
}
  return (
    <main className="min-h-screen bg-[#fcf8f8] w-full">
      <section className="w-full min-h-screen">
        <div className="bg-white border-b border-[#f1dede] px-10 h-[90px] flex items-center justify-between sticky top-0 z-20">
          <h1 className="text-[28px] font-medium text-[#8c0303]">
            Registro de Ventas
          </h1>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#fff3f3] px-4 py-3 rounded-2xl border border-[#f3dede]">
              <Search size={18} className="text-[#9b8a8a]" />
              <input
                placeholder="Buscar..."
                className="bg-transparent outline-none text-sm w-[180px]"
              />
            </div>

            <button className="bg-[#ffe1e1] text-[#8c0303] px-5 py-3 rounded-2xl font-semibold text-sm">
              Northside Galleries
                         </button>
          </div>
        </div>

<div className="px-10 py-8">
  <div className="flex items-center justify-end mb-8">
    <div className="flex gap-3">
      <button
        type="button"
onClick={() => exportToCSV()}
        className="border border-[#efcaca] text-[#b07a7a] px-5 py-3 rounded-2xl flex items-center gap-2 hover:bg-[#fff5f5]"
      >
        <Download size={16} />
        CSV
      </button>

      <button
        type="button"
onClick={() => exportToExcel()}
        className="border border-[#efcaca] text-[#b07a7a] px-5 py-3 rounded-2xl flex items-center gap-2 hover:bg-[#fff5f5]"
      >
        <Download size={16} />
        Excel
      </button>

      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="bg-[#8c0303] text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2"
      >
        <Plus size={18} />
Registrar Venta
      </button>
    </div>
  </div>

<div className="bg-white border border-[#f3dede] rounded-[28px] p-5 space-y-4 mb-6">
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 items-end">
    <div>
      <label className="block text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
        Buscar
      </label>

      <div className="flex items-center gap-2 h-[46px] px-4 rounded-xl border border-[#efcccc] bg-white">
        <Search size={17} className="text-[#b07a7a]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cliente, ID o producto..."
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
        className="w-full h-[46px] px-4 rounded-xl border border-[#efcccc] bg-white outline-none text-sm"
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
        className="w-full h-[46px] px-4 rounded-xl border border-[#efcccc] bg-white outline-none text-sm"
      />
    </div>

    <div>
      <label className="block text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
        Producto
      </label>

      <select
        value={productoFiltro}
        onChange={(e) => setProductoFiltro(e.target.value)}
        className="w-full h-[46px] px-4 rounded-xl border border-[#efcccc] bg-white outline-none text-sm"
      >
        {productosFiltro.map((item) => (
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
        value={metodoPagoFiltro}
        onChange={(e) => setMetodoPagoFiltro(e.target.value)}
        className="w-full h-[46px] px-4 rounded-xl border border-[#efcccc] bg-white outline-none text-sm"
      >
        {metodosPagoFiltro.map((item) => (
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
      onClick={limpiarFiltrosPedidos}
      className="px-4 py-2 rounded-full bg-[#8c0303] text-white hover:bg-[#6f0202] text-sm"
    >
      Limpiar filtros
    </button>
  </div>
</div>

<div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
  <div className="bg-white border border-[#f3dede] rounded-2xl p-5">
    <p className="text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
      Ventas filtradas
    </p>
    <p className="text-3xl ivy text-[#8c0303]">
      {ventasFiltradas}
    </p>
  </div>

  <div className="bg-white border border-[#f3dede] rounded-2xl p-5">
    <p className="text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
      Total vendido
    </p>
    <p className="text-3xl ivy text-[#8c0303]">
      ${totalFiltrado.toFixed(2)}
    </p>
  </div>

  <div className="bg-white border border-[#f3dede] rounded-2xl p-5">
    <p className="text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
      Ticket promedio
    </p>
    <p className="text-3xl ivy text-[#8c0303]">
      ${ticketPromedioFiltrado.toFixed(2)}
    </p>
  </div>

  <div className="bg-white border border-[#f3dede] rounded-2xl p-5">
    <p className="text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
      Método más usado
    </p>
    <p className="text-2xl ivy text-[#8c0303] leading-tight">
      {metodoMasUsado}
    </p>
  </div>
</div>

          <div className="bg-white border border-[#f3dede] rounded-[24px] overflow-hidden">
            <table className="w-full text-sm">
<thead className="bg-[#f8eeee] text-[#a16f6f] uppercase text-[11px] tracking-[0.12em]">
<tr className="text-left border-b border-[#f3dede] text-[#b9a0a0] uppercase tracking-[0.15em] text-xs">
  <th className="py-4 px-5">ID</th>
  <th className="py-4 px-5">Fecha</th>
  <th className="py-4 px-5">Cliente</th>
  <th className="py-4 px-5">Producto</th>
  <th className="py-4 px-5">Sucursal</th>
  <th className="py-4 px-5">Vendedor</th>
  <th className="py-4 px-5">Pago</th>
  <th className="py-4 px-5">Total</th>
  <th className="py-4 px-5 text-right">Acciones</th>
</tr>
</thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-5 py-8 text-center text-gray-400">
                      Cargando pedidos...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-5 py-8 text-center text-gray-400">
                      No hay pedidos registrados.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
<tr
  key={order.id}
  onClick={() => setSelectedOrder(order)}
  className="border-b border-[#f3dede] hover:bg-[#fffafa] cursor-pointer"
>
  <td className="px-5 py-4 text-[#8c0303] font-medium">
    {formatOrderId(order)}
  </td>

  <td className="px-5 py-4">
    {order.fecha || order.created_at?.split('T')[0] || '—'}
  </td>

  <td className="px-5 py-4">
    {order.cliente || 'Walk-in'}
  </td>

  <td className="px-5 py-4">
    {order.producto || 'Sin producto'}
  </td>

  <td className="px-5 py-4">
    <span className="px-3 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
      {order.tipo_pedido || order.sucursal || 'Punto de Venta'}
    </span>
  </td>

  <td className="px-5 py-4">
    {order.vendedor || '—'}
  </td>

  <td className="px-5 py-4">
    {order.metodo_pago || '—'}
  </td>

  <td className="px-5 py-4 font-semibold">
    ${Number(order.monto_pago || 0).toFixed(2)}
  </td>

<td className="px-5 py-4">
  <div className="flex items-center justify-end gap-2">
    <button
      type="button"
      title="Ver detalle"
      onClick={(e) => {
        e.stopPropagation()
        setSelectedOrder(order)
      }}
      className="w-9 h-9 rounded-xl border border-[#efcccc] text-[#8c0303] hover:bg-[#fff5f5] flex items-center justify-center transition"
    >
      <Eye size={16} />
    </button>

    <button
      type="button"
      title="Editar venta"
      onClick={(e) => {
        e.stopPropagation()
        openEditOrder(order)
      }}
      className="w-9 h-9 rounded-xl border border-[#efcccc] text-[#8c0303] hover:bg-[#fff5f5] flex items-center justify-center transition"
    >
      <Pencil size={16} />
    </button>

    <button
      type="button"
      title="Recalcular inventario"
      onClick={(e) => {
        e.stopPropagation()
        recalcularInventarioDeVenta(order)
      }}
      className="w-9 h-9 rounded-xl border border-[#efcccc] text-[#8c0303] hover:bg-[#fff5f5] flex items-center justify-center transition"
    >
      <RefreshCw size={16} />
    </button>

    <button
      type="button"
      title="Eliminar venta"
      onClick={(e) => {
        e.stopPropagation()
        eliminarVenta(order)
      }}
      className="w-9 h-9 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center transition"
    >
      <Trash2 size={16} />
    </button>
  </div>
</td>
</tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto">
<div className="bg-white rounded-[20px] w-[980px] max-w-[95%] border border-[#f3dede]">
<div className="flex items-center justify-between px-6 py-3 border-b border-[#f3dede]">
              <h2 className="text-[20px] font-medium">
{editingOrder ? 'Editar Venta' : 'Registrar Venta'}
              </h2>

<button
  onClick={() => {
    setShowModal(false)
    setEditingOrder(null)
  }}
>
                <X className="text-[#9b6f6f]" />
              </button>
            </div>

<div className="p-5 space-y-3">
              <div className="border border-[#f3dede] rounded-2xl p-5">
                <p className="text-xs uppercase text-[#8c0303] mb-4">
                  Información del Cliente
                </p>

<div className="grid grid-cols-3 gap-4">
                    <div>
 <label className="text-sm">Nombre del Cliente</label>
                    <input
                      name="cliente"
                      value={form.cliente}
                      onChange={handleChange}
                      placeholder="Ej. Valentina Torres"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="text-sm">WhatsApp</label>
                    <input
                      name="whatsapp"
                      value={form.whatsapp}
                      onChange={handleChange}
                      placeholder="5512345678"
                      className={inputClass}
                    />
                  </div>

<div>
  <label className="text-sm">Email</label>
  <input
    name="email"
    type="email"
    value={form.email}
    onChange={handleChange}
    placeholder="cliente@email.com"
    className={inputClass}
  />
</div>
                </div>
              </div>

<div className="border border-[#f3dede] rounded-2xl p-4">
  <p className="text-xs uppercase text-[#8c0303] mb-3">
    Producto
  </p>

  <div>
    <label className="text-sm">Producto</label>
<select
  name="producto"
  value={form.producto}
  onChange={handleProductChange}
  className={inputClass}
    >
      <option value="">Seleccionar producto...</option>
      {products.map((product) => (
        <option key={product.id} value={product.nombre}>
          {product.nombre}
        </option>
      ))}
    </select>
  </div>
</div>

              <div className="border border-[#f3dede] rounded-2xl p-4">
                <p className="text-xs uppercase text-[#8c0303] mb-4">
                  Detalles del Pedido
                </p>

<div className="grid grid-cols-5 gap-4 items-end">
  <div>
    <label className="text-sm">Sucursal</label>
    <select
      name="tipo_pedido"
      value={form.tipo_pedido}
      onChange={handleChange}
      className={inputClass}
    >
      <option>Northside Galleries</option>
      <option>Signature Plaza</option>
      <option>Evento Corporativo</option>
      <option>Evento Privado</option>
    </select>
  </div>

  <div>
    <label className="text-sm">Vendedor</label>
    <select
      name="sucursal"
      value={form.sucursal}
      onChange={handleChange}
      className={inputClass}
    >
      <option value="Nathalie">Nathalie</option>
      <option value="Sugelys">Sugelys</option>
    </select>
  </div>

  <div>
    <label className="text-sm">Método de Pago</label>
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
  </div>

  <div>
    <label className="text-sm">Fecha</label>
    <input
      type="date"
      name="fecha"
      value={form.fecha}
      onChange={handleChange}
      className={inputClass}
    />
  </div>

  <div>
    <label className="text-sm">Precio</label>
    <input
      type="number"
      step="0.01"
      name="monto_pago"
      value={form.monto_pago}
      onChange={handleChange}
      className={inputClass}
    />
  </div>
</div>
              </div>

              <div className="border border-[#f3dede] rounded-2xl p-5">
                <p className="text-xs uppercase text-[#8c0303] mb-4">
                  Cupón y Descuento
                </p>

                <div className="grid grid-cols-3 gap-4">
                  <input
                    name="cupon"
                    value={form.cupon}
                    onChange={handleChange}
                    placeholder="FRESA10"
                    className={inputClass}
                  />

                  <select
                    name="tipo_descuento"
                    value={form.tipo_descuento}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option>Sin descuento</option>
                    <option>Porcentaje</option>
                    <option>Monto fijo</option>
                  </select>

                  <input
                    name="descuento"
                    value={form.descuento}
                    onChange={handleChange}
                    placeholder="—"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm">Notas del Pedido</label>
                <textarea
                  name="notas"
                  value={form.notas}
                  onChange={handleChange}
                  placeholder="Ej. Sin azúcar en la crema, entregar en portería..."
                  rows={2}
                  className={`${inputClass} resize-none`}
                />
              </div>

<div className="flex justify-end gap-2 pt-1">
  <button
    onClick={() => setShowModal(false)}
    className="px-5 py-2.5 border border-[#efcccc] rounded-xl"
  >
    Cancelar
  </button>

  {selectedOrder && (
    <button
      type="button"
      onClick={() => recalcularInventarioDeVenta(selectedOrder)}
      className="px-5 py-2.5 border border-[#efcccc] text-[#8c0303] rounded-xl font-semibold hover:bg-[#fff5f5]"
    >
      Recalcular inventario
    </button>
  )}

  <button
    onClick={guardarPedido}
    disabled={saving}
    className="px-5 py-2.5 bg-[#8c0303] text-white rounded-xl font-semibold disabled:opacity-50"
  >
{saving
  ? editingOrder
    ? 'Guardando cambios...'
    : 'Registrando...'
  : editingOrder
    ? 'Guardar cambios'
    : 'Registrar Venta'}
  </button>
</div>
            </div>
          </div>
        </div>
      )}
      {selectedOrder && (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
    <div className="bg-white rounded-[28px] w-full max-w-2xl shadow-2xl overflow-hidden">
      
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#f3dede]">
        <div>
          <h2 className="text-[20px] text-[#8c0303] ivy leading-none">
            Detalle de Venta
          </h2>

          <p className="text-sm text-[#b07a7a] mt-1">
            #{selectedOrder.operacion || selectedOrder.id}
          </p>
        </div>

        <button onClick={() => setSelectedOrder(null)}>
          <X className="text-[#9b6f6f]" />
        </button>
      </div>

      <div className="p-4 space-y-2.5">
        <div className="grid grid-cols-2 gap-3">
          <DetailItem
            label="Fecha"
            value={selectedOrder.fecha || selectedOrder.created_at?.split('T')[0] || 'Sin fecha'}
          />

          <DetailItem
            label="Cliente"
            value={selectedOrder.cliente || 'Walk-in'}
          />

          <DetailItem
            label="WhatsApp"
            value={selectedOrder.whatsapp || 'No registrado'}
          />

          <DetailItem
            label="Email"
            value={selectedOrder.email || 'No registrado'}
          />

          <DetailItem
            label="Producto"
            value={selectedOrder.producto || 'Sin producto'}
          />

          <DetailItem
            label="Sucursal"
            value={selectedOrder.tipo_pedido || 'Punto de Venta'}
          />

          <DetailItem
            label="Vendedor"
            value={selectedOrder.vendedor || 'Sin vendedor'}
          />

          <DetailItem
            label="Método de Pago"
            value={selectedOrder.metodo_pago || 'Sin método'}
          />

          <DetailItem
            label="Precio"
            value={`$${Number(selectedOrder.monto_pago || 0).toFixed(2)}`}
          />

          <DetailItem
            label="Status"
            value={selectedOrder.status || 'Pagado'}
          />

          <DetailItem
            label="Cupón"
            value={selectedOrder.cupon || 'Sin cupón'}
          />

          <DetailItem
            label="Descuento"
            value={
              selectedOrder.descuento
                ? `$${Number(selectedOrder.descuento || 0).toFixed(2)}`
                : 'Sin descuento'
            }
          />
        </div>

        <div className="border border-[#f3dede] rounded-2xl px-3 py-2 bg-[#fffafa]">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#b07a7a] mb-1">
            Observaciones
          </p>

          <p className="text-[13px] text-[#2e2e2e] leading-tight">
            {selectedOrder.observaciones || 'Sin observaciones registradas.'}
          </p>
        </div>

        <div className="border border-[#f3dede] rounded-2xl px-3 py-2 bg-[#fffafa]">
  <p className="text-[10px] uppercase tracking-[0.14em] text-[#b07a7a] mb-1">
    Última edición
  </p>

  <p className="text-[13px] text-[#2e2e2e] leading-tight">
    {selectedOrder.editado_en
      ? `${new Date(selectedOrder.editado_en).toLocaleString('es-PA')} por ${
          selectedOrder.editado_por || 'No registrado'
        }`
      : 'Sin ediciones registradas'}
  </p>
</div>

<div className="flex justify-end gap-2 pt-1">
  <button
    type="button"
    onClick={() => setSelectedOrder(null)}
    className="px-5 py-2.5 border border-[#efcccc] rounded-xl text-[#8c0303] hover:bg-[#fff5f5]"
  >
    Cerrar
  </button>

  {selectedOrder && (
    <button
      type="button"
      onClick={() => recalcularInventarioDeVenta(selectedOrder)}
      className="px-5 py-2.5 border border-[#efcccc] text-[#8c0303] rounded-xl font-semibold hover:bg-[#fff5f5]"
    >
      Recalcular inventario
    </button>
  )}

  {selectedOrder && (
    <button
      type="button"
      onClick={() => eliminarVenta(selectedOrder)}
      className="px-5 py-2.5 border border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-50"
    >
      Eliminar Venta
    </button>
  )}

  <button
    type="button"
    onClick={() => openEditOrder(selectedOrder)}
    className="px-5 py-2.5 bg-[#8c0303] text-white rounded-xl font-semibold"
  >
    Editar Venta
  </button>
</div>
      </div>
    </div>
  </div>
)}
    </main>
  )
  
function DetailItem({ label, value }) {
  return (
    <div className="border border-[#f3dede] rounded-2xl px-3 py-2 bg-[#fffafa]">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#b07a7a] mb-1">
        {label}
      </p>

      <p className="text-sm text-[#2e2e2e] font-medium">
        {value}
      </p>
    </div>
  )
}
}
export default function PedidosPage() {
  return <PedidosContent />
}