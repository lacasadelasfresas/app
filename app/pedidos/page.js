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
  CalendarDays,
  Filter,
  ShoppingBag,
  DollarSign,
  CreditCard,
  ReceiptText,
} from 'lucide-react'

function getTodayDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`
}

function formatOrderId(order) {
  const rawId = order.operacion || order.id || ''
  const numberPart = String(rawId).replace(/\D/g, '').slice(-4)

  if (numberPart) {
    return `#OP-${numberPart.padStart(4, '0')}`
  }

  return '#OP-0000'
}

function createEmptyForm() {
  return {
    cliente: '',
    whatsapp: '',
    email: '',
    producto: '',
    tipo_pedido: 'Northside Galleries',
    vendedor: 'Nathalie',
    metodo_pago: 'Efectivo',
    fecha: getTodayDate(),
    cupon: '',
    tipo_descuento: 'Sin descuento',
    descuento: '',
    observaciones: '',
    monto_pago: '',
  }
}

function DetailItem({ label, value }) {
  return (
    <div className="border border-[#f3dede] rounded-2xl px-4 py-3 bg-[#fffafa]">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#b07a7a] mb-1">
        {label}
      </p>

      <p className="text-sm text-[#2e2e2e] font-medium break-words">
        {value || '—'}
      </p>
    </div>
  )
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="bg-white border border-[#f3dede] rounded-2xl p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
            {label}
          </p>

          <p className="text-[27px] md:text-3xl ivy text-[#8c0303] leading-none mt-3 break-words">
            {value}
          </p>
        </div>

        <div className="w-10 h-10 rounded-2xl bg-[#fff1f1] text-[#8c0303] flex items-center justify-center shrink-0">
          <Icon size={18} />
        </div>
      </div>
    </div>
  )
}

export default function PedidosPage() {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [productoFiltro, setProductoFiltro] = useState('Todos')
  const [metodoPagoFiltro, setMetodoPagoFiltro] = useState('Todos')

  const [selectedOrder, setSelectedOrder] = useState(null)
  const [editingOrder, setEditingOrder] = useState(null)
  const [form, setForm] = useState(createEmptyForm())

  useEffect(() => {
    fetchOrders()
    fetchProducts()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    if (params.get('new') === '1') {
      openCreateModal()
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
      console.error('ERROR FETCH PRODUCTS:', error)
      return
    }

    setProducts(data || [])
  }

  function openCreateModal() {
    setEditingOrder(null)
    setSelectedOrder(null)
    setForm(createEmptyForm())
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingOrder(null)
    setForm(createEmptyForm())
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

  function handleChange(event) {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  function handleProductChange(event) {
    const selectedProductName = event.target.value

    const selectedProduct = products.find(
      (product) => product.nombre === selectedProductName
    )

    setForm((previous) => ({
      ...previous,
      producto: selectedProductName,
      monto_pago: selectedProduct
        ? Number(selectedProduct.precio || 0)
        : '',
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
      vendedor: order.vendedor || 'Nathalie',
      metodo_pago: order.metodo_pago || 'Efectivo',
      fecha: order.fecha || getTodayDate(),
      cupon: order.cupon || '',
      tipo_descuento: order.tipo_descuento || 'Sin descuento',
      descuento: order.descuento || '',
      observaciones: order.observaciones || '',
      monto_pago: Number(order.monto_pago || 0),
    })

    setSelectedOrder(null)
    setShowModal(true)
  }

  const validOrders = orders.filter(
    (order) =>
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
    ...new Set(
      validOrders.map((order) => order.metodo_pago).filter(Boolean)
    ),
  ]

  const filteredOrders = validOrders.filter((order) => {
    const text = `
      ${order.cliente || ''}
      ${order.producto || ''}
      ${order.metodo_pago || ''}
      ${order.tipo_pedido || ''}
      ${order.vendedor || ''}
      ${order.operacion || ''}
      ${formatOrderId(order)}
    `.toLowerCase()

    const matchesSearch = text.includes(search.toLowerCase())

    const orderFecha =
      order.fecha || order.created_at?.split('T')[0] || ''

    const matchesFechaInicio =
      !fechaInicio || orderFecha >= fechaInicio

    const matchesFechaFin =
      !fechaFin || orderFecha <= fechaFin

    const matchesProducto =
      productoFiltro === 'Todos' || order.producto === productoFiltro

    const matchesMetodoPago =
      metodoPagoFiltro === 'Todos' ||
      order.metodo_pago === metodoPagoFiltro

    return (
      matchesSearch &&
      matchesFechaInicio &&
      matchesFechaFin &&
      matchesProducto &&
      matchesMetodoPago
    )
  })

  const ventasFiltradas = filteredOrders.length

  const totalFiltrado = filteredOrders.reduce(
    (accumulator, order) =>
      accumulator + Number(order.monto_pago || 0),
    0
  )

  const ticketPromedioFiltrado =
    ventasFiltradas > 0
      ? totalFiltrado / ventasFiltradas
      : 0

  const metodoMasUsado = (() => {
    const conteo = {}

    filteredOrders.forEach((order) => {
      const metodo = order.metodo_pago || 'Sin método'

      conteo[metodo] = (conteo[metodo] || 0) + 1
    })

    const top = Object.entries(conteo).sort(
      (a, b) => b[1] - a[1]
    )[0]

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
      order.tipo_pedido || 'Punto de Venta',
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
      `registro-pedidos-${getTodayDate()}.csv`
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
      order.tipo_pedido || 'Punto de Venta',
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
    link.download = `registro-pedidos-${getTodayDate()}.xls`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  async function descontarInventarioPorVenta(productoNombre, ventaId) {
    if (!productoNombre) return

    const { data: producto, error: productoError } = await supabase
      .from('productos')
      .select('id, nombre')
      .eq('nombre', productoNombre)
      .single()

    if (productoError || !producto) {
      console.warn(
        'No se encontró producto para descontar inventario:',
        productoNombre
      )
      return
    }

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
      console.error('Error buscando recipe:', recipeError)
      return
    }

    if (!recipeItems || recipeItems.length === 0) {
      console.warn(
        'Este producto no tiene recipe registrada:',
        productoNombre
      )
      return
    }

    for (const item of recipeItems) {
      const stockActual = Number(
        item.inventario?.stock_actual || 0
      )

      const cantidadUsada = Number(item.cantidad || 0)
      const nuevoStock = stockActual - cantidadUsada

      const { error: updateError } = await supabase
        .from('inventario')
        .update({
          stock_actual: nuevoStock,
        })
        .eq('id', item.inventario_id)

      if (updateError) {
        console.error(
          'Error descontando inventario:',
          updateError
        )
        continue
      }

      const { error: movimientoError } = await supabase
        .from('inventario_movimientos')
        .insert([
          {
            inventario_id: item.inventario_id,
            tipo: 'salida',
            cantidad: cantidadUsada,
            motivo: 'Venta',
            referencia: ventaId
              ? `Venta ${ventaId}`
              : productoNombre,
          },
        ])

      if (movimientoError) {
        console.error(
          'Error registrando salida de inventario:',
          movimientoError
        )
      }
    }
  }

  async function recalcularInventarioDeVenta(venta) {
    if (!venta?.id || !venta?.producto) {
      alert('No se encontró la información de esta venta.')
      return
    }

    const confirmar = confirm(
      `¿Deseas recalcular el inventario de esta venta?\n\nProducto: ${venta.producto}\n\nEsto devolverá el descuento anterior y aplicará la recipe actual.`
    )

    if (!confirmar) return

    const referencia = `Venta ${venta.id}`

    const { data: movimientosAnteriores, error: movimientosError } =
      await supabase
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
      console.error(
        'Error buscando movimientos anteriores:',
        movimientosError
      )

      alert('No se pudieron buscar los movimientos anteriores.')
      return
    }

    for (const movimiento of movimientosAnteriores || []) {
      const stockActual = Number(
        movimiento.inventario?.stock_actual || 0
      )

      const cantidadDevuelta = Number(movimiento.cantidad || 0)

      const { error: updateError } = await supabase
        .from('inventario')
        .update({
          stock_actual: stockActual + cantidadDevuelta,
        })
        .eq('id', movimiento.inventario_id)

      if (updateError) {
        console.error(
          'Error devolviendo inventario:',
          updateError
        )

        alert(
          'Hubo un error devolviendo inventario. Revisa la consola.'
        )
        return
      }
    }

    if (movimientosAnteriores?.length > 0) {
      const ids = movimientosAnteriores.map(
        (movimiento) => movimiento.id
      )

      const { error: deleteError } = await supabase
        .from('inventario_movimientos')
        .delete()
        .in('id', ids)

      if (deleteError) {
        console.error(
          'Error eliminando movimientos anteriores:',
          deleteError
        )

        alert(
          'No se pudieron eliminar los movimientos anteriores.'
        )
        return
      }
    }

    await descontarInventarioPorVenta(
      venta.producto,
      venta.id
    )

    alert('Inventario recalculado correctamente.')
    fetchOrders()
  }

  async function eliminarVenta(venta) {
    if (!venta?.id) {
      alert('No se encontró la venta para eliminar.')
      return
    }

    const confirmar = confirm(
      `¿Deseas eliminar esta venta?\n\nVenta ${formatOrderId(
        venta
      )}\nProducto: ${
        venta.producto
      }\n\nEsto también devolverá al inventario los insumos descontados.`
    )

    if (!confirmar) return

    const referencia = `Venta ${venta.id}`

    const { data: movimientos, error: movimientosError } =
      await supabase
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
      console.error(
        'Error buscando movimientos de inventario:',
        movimientosError
      )

      alert(
        'No se pudieron buscar los movimientos de inventario.'
      )
      return
    }

    for (const movimiento of movimientos || []) {
      const stockActual = Number(
        movimiento.inventario?.stock_actual || 0
      )

      const cantidadDevuelta = Number(movimiento.cantidad || 0)

      const { error: updateError } = await supabase
        .from('inventario')
        .update({
          stock_actual: stockActual + cantidadDevuelta,
        })
        .eq('id', movimiento.inventario_id)

      if (updateError) {
        console.error(
          'Error devolviendo inventario:',
          updateError
        )

        alert(
          'Hubo un error devolviendo inventario. Revisa la consola.'
        )
        return
      }
    }

    if (movimientos?.length > 0) {
      const ids = movimientos.map((movimiento) => movimiento.id)

      const { error: deleteMovimientosError } = await supabase
        .from('inventario_movimientos')
        .delete()
        .in('id', ids)

      if (deleteMovimientosError) {
        console.error(
          'Error eliminando movimientos:',
          deleteMovimientosError
        )

        alert('No se pudieron eliminar los movimientos.')
        return
      }
    }

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

    const payload = {
      fecha: form.fecha || getTodayDate(),
      cliente: form.cliente || 'Walk-in',
      whatsapp: form.whatsapp || null,
      email: form.email || null,
      producto: form.producto,
      tipo_pedido: form.tipo_pedido || 'Northside Galleries',
      metodo_pago: form.metodo_pago || 'Efectivo',
      vendedor: form.vendedor || 'Nathalie',
      monto_pago: Number(form.monto_pago || 0),
      cupon: form.cupon || null,
      tipo_descuento: form.tipo_descuento || 'Sin descuento',
      descuento: Number(form.descuento || 0),
      observaciones: form.observaciones || null,
      status: 'Pagado',
    }

    if (editingOrder) {
      const { error } = await supabase
        .from('ventas')
        .update({
          ...payload,
          editado_por: 'Nathalie',
          editado_en: new Date().toISOString(),
        })
        .eq('id', editingOrder.id)

      if (error) {
        console.error('Error editando venta:', error)
        alert('No se pudo actualizar la venta.')
        setSaving(false)
        return
      }

      alert('Venta actualizada correctamente.')
      closeModal()
      await fetchOrders()
      setSaving(false)
      return
    }

    const { data, error } = await supabase
      .from('ventas')
      .insert([
        {
          ...payload,
          cantidad: 1,
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

    await descontarInventarioPorVenta(
      form.producto,
      data?.id
    )

    await fetchOrders()

    closeModal()
    setSaving(false)
  }

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-[#efcccc] bg-white outline-none text-sm text-[#2e2e2e] focus:border-[#8c0303]'

  return (
    <main className="min-h-screen bg-[#fcf8f8] w-full">
      <header className="bg-white border-b border-[#f1dede] px-5 md:px-8 py-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#b9a0a0] mb-2">
                Operación
              </p>

              <h1 className="text-[38px] md:text-[34px] ivy text-[#7a0000] leading-[0.95]">
                Registro de Ventas
              </h1>

              <p className="text-sm text-[#b07a7a] mt-3">
                Registra, consulta y administra las ventas del negocio.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={exportToCSV}
                className="flex-1 sm:flex-none border border-[#efcaca] text-[#8c0303] px-4 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold hover:bg-[#fff5f5]"
              >
                <Download size={17} />
                CSV
              </button>

              <button
                type="button"
                onClick={exportToExcel}
                className="flex-1 sm:flex-none border border-[#efcaca] text-[#8c0303] px-4 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold hover:bg-[#fff5f5]"
              >
                <Download size={17} />
                Excel
              </button>

              <button
                type="button"
                onClick={openCreateModal}
                className="w-full sm:w-auto bg-[#8c0303] text-white px-5 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 text-sm"
              >
                <Plus size={18} />
                Registrar venta
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="px-4 md:px-8 py-5 md:py-7 max-w-[1600px] mx-auto">
        <div className="bg-white border border-[#f3dede] rounded-[28px] overflow-hidden">
          <button
            type="button"
            onClick={() => setShowFilters((current) => !current)}
            className="w-full flex items-center justify-between gap-4 px-5 md:px-6 py-5 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#fff1f1] text-[#8c0303] flex items-center justify-center">
                <Filter size={18} />
              </div>

              <div>
                <p className="text-[22px] ivy text-[#7a0000] leading-none">
                  Filtros de ventas
                </p>

                <p className="text-sm text-[#b07a7a] mt-1">
                  Busca por fecha, producto, cliente o método de pago.
                </p>
              </div>
            </div>

            <ChevronDown
              size={21}
              className={`text-[#8c0303] transition-transform ${
                showFilters ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showFilters && (
            <div className="border-t border-[#f3dede] px-5 md:px-6 py-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                <div className="sm:col-span-2 xl:col-span-1">
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
                    onChange={(event) =>
                      setFechaInicio(event.target.value)
                    }
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
                    onChange={(event) =>
                      setFechaFin(event.target.value)
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
                    Producto
                  </label>

                  <select
                    value={productoFiltro}
                    onChange={(event) =>
                      setProductoFiltro(event.target.value)
                    }
                    className={inputClass}
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
                    onChange={(event) =>
                      setMetodoPagoFiltro(event.target.value)
                    }
                    className={inputClass}
                  >
                    {metodosPagoFiltro.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-5">
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
                  onClick={limpiarFiltrosPedidos}
                  className="px-4 py-2 rounded-full bg-[#8c0303] text-white hover:bg-[#6f0202] text-sm font-semibold"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mt-5 md:mt-6">
          <StatCard
            label="Ventas filtradas"
            value={ventasFiltradas}
            icon={ShoppingBag}
          />

          <StatCard
            label="Total vendido"
            value={formatCurrency(totalFiltrado)}
            icon={DollarSign}
          />

          <StatCard
            label="Ticket promedio"
            value={formatCurrency(ticketPromedioFiltrado)}
            icon={ReceiptText}
          />

          <StatCard
            label="Método más usado"
            value={metodoMasUsado}
            icon={CreditCard}
          />
        </div>

        <section className="mt-5 md:mt-6">
          <div className="bg-white border border-[#f3dede] rounded-[28px] overflow-hidden">
            <div className="px-5 md:px-6 py-5 border-b border-[#f3dede]">
              <h2 className="text-[28px] md:text-[32px] ivy text-[#7a0000] leading-none">
                Ventas registradas
              </h2>

              <p className="text-sm text-[#b07a7a] mt-2">
                Historial de ventas y pedidos registrados.
              </p>
            </div>

            <div className="md:hidden divide-y divide-[#f3dede]">
              {loading ? (
                <div className="px-5 py-10 text-center text-[#b07a7a]">
                  Cargando ventas...
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="px-5 py-10 text-center text-[#b07a7a]">
                  No hay ventas registradas.
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <article
                    key={order.id}
                    className="p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#8c0303]">
                          {formatOrderId(order)}
                        </p>

                        <h3 className="text-[22px] ivy text-[#7a0000] mt-2 leading-tight break-words">
                          {order.producto || 'Sin producto'}
                        </h3>

                        <p className="text-sm text-[#b07a7a] mt-2">
                          {order.cliente || 'Walk-in'} ·{' '}
                          {order.fecha ||
                            order.created_at?.split('T')[0] ||
                            'Sin fecha'}
                        </p>
                      </div>

                      <p className="text-xl ivy text-[#8c0303] shrink-0">
                        {formatCurrency(order.monto_pago)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      <span className="px-3 py-1 rounded-full bg-[#fff1f1] text-[#8c0303] text-xs">
                        {order.metodo_pago || 'Sin método'}
                      </span>

                      <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs">
                        {order.tipo_pedido || 'Punto de Venta'}
                      </span>

                      {order.vendedor && (
                        <span className="px-3 py-1 rounded-full bg-[#f7f3f3] text-[#7a0000] text-xs">
                          {order.vendedor}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-2 mt-5">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="h-11 rounded-xl border border-[#efcccc] text-[#8c0303] flex items-center justify-center"
                        aria-label="Ver detalle"
                      >
                        <Eye size={17} />
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditOrder(order)}
                        className="h-11 rounded-xl border border-[#efcccc] text-[#8c0303] flex items-center justify-center"
                        aria-label="Editar venta"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          recalcularInventarioDeVenta(order)
                        }
                        className="h-11 rounded-xl border border-[#efcccc] text-[#8c0303] flex items-center justify-center"
                        aria-label="Recalcular inventario"
                      >
                        <RefreshCw size={17} />
                      </button>

                      <button
                        type="button"
                        onClick={() => eliminarVenta(order)}
                        className="h-11 rounded-xl border border-red-200 text-red-600 flex items-center justify-center"
                        aria-label="Eliminar venta"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-[1050px] w-full text-sm">
                <thead className="bg-[#f8eeee] text-[#a16f6f] uppercase text-[11px] tracking-[0.12em]">
                  <tr className="text-left">
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
                      <td
                        colSpan="9"
                        className="px-5 py-10 text-center text-[#b07a7a]"
                      >
                        Cargando pedidos...
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan="9"
                        className="px-5 py-10 text-center text-[#b07a7a]"
                      >
                        No hay pedidos registrados.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-t border-[#f3dede] hover:bg-[#fffafa]"
                      >
                        <td className="px-5 py-4 text-[#8c0303] font-medium">
                          {formatOrderId(order)}
                        </td>

                        <td className="px-5 py-4">
                          {order.fecha ||
                            order.created_at?.split('T')[0] ||
                            '—'}
                        </td>

                        <td className="px-5 py-4">
                          {order.cliente || 'Walk-in'}
                        </td>

                        <td className="px-5 py-4">
                          {order.producto || 'Sin producto'}
                        </td>

                        <td className="px-5 py-4">
                          <span className="px-3 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                            {order.tipo_pedido ||
                              'Punto de Venta'}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {order.vendedor || '—'}
                        </td>

                        <td className="px-5 py-4">
                          {order.metodo_pago || '—'}
                        </td>

                        <td className="px-5 py-4 font-semibold">
                          {formatCurrency(order.monto_pago)}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              title="Ver detalle"
                              onClick={() =>
                                setSelectedOrder(order)
                              }
                              className="w-9 h-9 rounded-xl border border-[#efcccc] text-[#8c0303] hover:bg-[#fff5f5] flex items-center justify-center"
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              type="button"
                              title="Editar venta"
                              onClick={() =>
                                openEditOrder(order)
                              }
                              className="w-9 h-9 rounded-xl border border-[#efcccc] text-[#8c0303] hover:bg-[#fff5f5] flex items-center justify-center"
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              type="button"
                              title="Recalcular inventario"
                              onClick={() =>
                                recalcularInventarioDeVenta(
                                  order
                                )
                              }
                              className="w-9 h-9 rounded-xl border border-[#efcccc] text-[#8c0303] hover:bg-[#fff5f5] flex items-center justify-center"
                            >
                              <RefreshCw size={16} />
                            </button>

                            <button
                              type="button"
                              title="Eliminar venta"
                              onClick={() =>
                                eliminarVenta(order)
                              }
                              className="w-9 h-9 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center"
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
      </section>

      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-end md:items-center justify-center">
          <div className="bg-white w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-t-[30px] md:rounded-[30px] border border-[#f3dede]">
            <div className="sticky top-0 z-10 bg-white border-b border-[#f3dede] px-5 md:px-7 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-[30px] ivy text-[#7a0000] leading-none">
                  {editingOrder
                    ? 'Editar venta'
                    : 'Registrar venta'}
                </h2>

                <p className="text-sm text-[#b07a7a] mt-2">
                  {editingOrder
                    ? 'Actualiza los datos de esta venta.'
                    : 'Registra una nueva venta y descuenta inventario.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="w-11 h-11 rounded-full border border-[#efcccc] text-[#8c0303] flex items-center justify-center"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 md:p-7 space-y-5">
              <div className="border border-[#f3dede] rounded-2xl p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-[#8c0303] mb-4">
                  Información del cliente
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-[#2e2e2e]">
                      Nombre del cliente
                    </label>

                    <input
                      name="cliente"
                      value={form.cliente}
                      onChange={handleChange}
                      placeholder="Ej. Valentina Torres"
                      className={`${inputClass} mt-2`}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-[#2e2e2e]">
                      WhatsApp
                    </label>

                    <input
                      name="whatsapp"
                      value={form.whatsapp}
                      onChange={handleChange}
                      placeholder="5512345678"
                      className={`${inputClass} mt-2`}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-[#2e2e2e]">
                      Email
                    </label>

                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="cliente@email.com"
                      className={`${inputClass} mt-2`}
                    />
                  </div>
                </div>
              </div>

              <div className="border border-[#f3dede] rounded-2xl p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-[#8c0303] mb-4">
                  Producto y pago
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-[#2e2e2e]">
                      Producto
                    </label>

                    <select
                      name="producto"
                      value={form.producto}
                      onChange={handleProductChange}
                      className={`${inputClass} mt-2`}
                    >
                      <option value="">
                        Seleccionar producto...
                      </option>

                      {products.map((product) => (
                        <option
                          key={product.id}
                          value={product.nombre}
                        >
                          {product.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-[#2e2e2e]">
                      Precio
                    </label>

                    <input
                      type="number"
                      step="0.01"
                      name="monto_pago"
                      value={form.monto_pago}
                      onChange={handleChange}
                      className={`${inputClass} mt-2`}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-[#2e2e2e]">
                      Método de pago
                    </label>

                    <select
                      name="metodo_pago"
                      value={form.metodo_pago}
                      onChange={handleChange}
                      className={`${inputClass} mt-2`}
                    >
                      <option>Efectivo</option>
                      <option>Yappy</option>
                      <option>Tarjeta</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-[#2e2e2e]">
                      Fecha
                    </label>

                    <input
                      type="date"
                      name="fecha"
                      value={form.fecha}
                      onChange={handleChange}
                      className={`${inputClass} mt-2`}
                    />
                  </div>
                </div>
              </div>

              <div className="border border-[#f3dede] rounded-2xl p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-[#8c0303] mb-4">
                  Detalles de operación
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-[#2e2e2e]">
                      Sucursal / canal
                    </label>

                    <select
                      name="tipo_pedido"
                      value={form.tipo_pedido}
                      onChange={handleChange}
                      className={`${inputClass} mt-2`}
                    >
                      <option>Northside Galleries</option>
                      <option>Signature Plaza</option>
                      <option>Evento Corporativo</option>
                      <option>Evento Privado</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-[#2e2e2e]">
                      Vendedor
                    </label>

                    <select
                      name="vendedor"
                      value={form.vendedor}
                      onChange={handleChange}
                      className={`${inputClass} mt-2`}
                    >
                      <option value="Nathalie">Nathalie</option>
                      <option value="Sugelys">Sugelys</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border border-[#f3dede] rounded-2xl p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-[#8c0303] mb-4">
                  Cupón y descuento
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    name="cupon"
                    value={form.cupon}
                    onChange={handleChange}
                    placeholder="Código de cupón"
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
                    type="number"
                    step="0.01"
                    value={form.descuento}
                    onChange={handleChange}
                    placeholder="Monto descuento"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-[#2e2e2e]">
                  Notas del pedido
                </label>

                <textarea
                  name="observaciones"
                  value={form.observaciones}
                  onChange={handleChange}
                  placeholder="Ej. Sin azúcar en la crema, entregar en portería..."
                  rows={4}
                  className={`${inputClass} mt-2 resize-none`}
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-3 border border-[#efcccc] rounded-xl text-[#8c0303] font-semibold"
                >
                  Cancelar
                </button>

                {editingOrder && (
                  <button
                    type="button"
                    onClick={() =>
                      recalcularInventarioDeVenta(editingOrder)
                    }
                    className="px-5 py-3 border border-[#efcccc] text-[#8c0303] rounded-xl font-semibold hover:bg-[#fff5f5]"
                  >
                    Recalcular inventario
                  </button>
                )}

                <button
                  type="button"
                  onClick={guardarPedido}
                  disabled={saving}
                  className="px-5 py-3 bg-[#8c0303] text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  {saving
                    ? editingOrder
                      ? 'Guardando cambios...'
                      : 'Registrando...'
                    : editingOrder
                      ? 'Guardar cambios'
                      : 'Registrar venta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-end md:items-center justify-center">
          <div className="bg-white w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-[30px] md:rounded-[30px] shadow-2xl">
            <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-5 md:px-6 py-5 border-b border-[#f3dede]">
              <div>
                <h2 className="text-[30px] ivy text-[#7a0000] leading-none">
                  Detalle de venta
                </h2>

                <p className="text-sm text-[#b07a7a] mt-2">
                  {formatOrderId(selectedOrder)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-11 h-11 rounded-full border border-[#efcccc] text-[#8c0303] flex items-center justify-center"
                aria-label="Cerrar detalle"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 md:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DetailItem
                  label="Fecha"
                  value={
                    selectedOrder.fecha ||
                    selectedOrder.created_at?.split('T')[0] ||
                    'Sin fecha'
                  }
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
                  value={
                    selectedOrder.tipo_pedido || 'Punto de Venta'
                  }
                />

                <DetailItem
                  label="Vendedor"
                  value={selectedOrder.vendedor || 'No registrado'}
                />

                <DetailItem
                  label="Método de pago"
                  value={
                    selectedOrder.metodo_pago || 'No registrado'
                  }
                />

                <DetailItem
                  label="Total"
                  value={formatCurrency(selectedOrder.monto_pago)}
                />

                <DetailItem
                  label="Estado"
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
                      ? formatCurrency(selectedOrder.descuento)
                      : 'Sin descuento'
                  }
                />
              </div>

              <div className="border border-[#f3dede] rounded-2xl px-4 py-4 bg-[#fffafa]">
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#b07a7a] mb-2">
                  Observaciones
                </p>

                <p className="text-sm text-[#2e2e2e] leading-relaxed">
                  {selectedOrder.observaciones ||
                    'Sin observaciones registradas.'}
                </p>
              </div>

              <div className="border border-[#f3dede] rounded-2xl px-4 py-4 bg-[#fffafa]">
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#b07a7a] mb-2">
                  Última edición
                </p>

                <p className="text-sm text-[#2e2e2e] leading-relaxed">
                  {selectedOrder.editado_en
                    ? `${new Date(
                        selectedOrder.editado_en
                      ).toLocaleString('es-PA')} por ${
                        selectedOrder.editado_por || 'No registrado'
                      }`
                    : 'Sin ediciones registradas'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 py-3 border border-[#efcccc] rounded-xl text-[#8c0303] font-semibold"
                >
                  Cerrar
                </button>

                <button
                  type="button"
                  onClick={() =>
                    recalcularInventarioDeVenta(selectedOrder)
                  }
                  className="px-5 py-3 border border-[#efcccc] text-[#8c0303] rounded-xl font-semibold hover:bg-[#fff5f5]"
                >
                  Recalcular inventario
                </button>

                <button
                  type="button"
                  onClick={() => eliminarVenta(selectedOrder)}
                  className="px-5 py-3 border border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-50"
                >
                  Eliminar venta
                </button>

                <button
                  type="button"
                  onClick={() => openEditOrder(selectedOrder)}
                  className="px-5 py-3 bg-[#8c0303] text-white rounded-xl font-semibold"
                >
                  Editar venta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}