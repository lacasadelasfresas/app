'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  CalendarDays,
  ChevronDown,
  Download,
  Eye,
  Filter,
  ListPlus,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Trash2,
  X,
  Zap,
} from 'lucide-react'

const SUCURSALES = [
  'Northside Galleries',
  'Signature Plaza',
  'Evento Corporativo',
  'Evento Privado',
  'Delivery',
  'Pickup',
]

const METODOS_PAGO = ['Efectivo', 'Yappy', 'Tarjeta', 'Transferencia']

const VENDEDORES = ['Nathalie', 'Sugelys']

function getTodayDate() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`
}

function formatOrderId(order) {
  const rawId = order.operacion || order.id || ''
  const numberPart = String(rawId).replace(/\D/g, '').slice(-4)

  return numberPart ? `#OP-${numberPart.padStart(4, '0')}` : '#OP-0000'
}

function createCompleteForm() {
  return {
    cliente: '',
    whatsapp: '',
    email: '',
    producto: '',
    monto_pago: '',
    fecha: getTodayDate(),
    metodo_pago: 'Efectivo',
    tipo_pedido: 'Northside Galleries',
    vendedor: 'Nathalie',
    cupon: '',
    tipo_descuento: 'Sin descuento',
    descuento: '',
    observaciones: '',
  }
}

function createQuickForm() {
  return {
    producto: '',
    monto_pago: '',
    fecha: getTodayDate(),
    metodo_pago: 'Efectivo',
    tipo_pedido: 'Northside Galleries',
    vendedor: 'Nathalie',
  }
}

function createBulkCommon() {
  return {
    fecha: getTodayDate(),
    metodo_pago: 'Efectivo',
    tipo_pedido: 'Northside Galleries',
    vendedor: 'Nathalie',
  }
}

function createBulkRow(mode = 'complete') {
  return {
    id: crypto.randomUUID(),
    cliente: mode === 'quick' ? 'Walk-in' : '',
    whatsapp: '',
    email: '',
    producto: '',
    monto_pago: '',
    cupon: '',
    tipo_descuento: 'Sin descuento',
    descuento: '',
    observaciones: '',
  }
}

function Field({ label, children }) {
  return (
    <label className="block min-w-0 max-w-full">
      <span className="block text-sm font-medium text-[#2e2e2e]">
        {label}
      </span>
      {children}
    </label>
  )
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#f3dede] bg-[#fffafa] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#b07a7a]">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-[#2e2e2e] break-words">
        {value || '—'}
      </p>
    </div>
  )
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <article className="rounded-[24px] border border-[#f3dede] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#b9a0a0]">
            {label}
          </p>

          <p className="mt-3 text-[26px] font-bold text-[#7a0000]">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff1f1] text-[#8c0303]">
          <Icon size={18} />
        </div>
      </div>
    </article>
  )
}

export default function PedidosPage() {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [showFilters, setShowFilters] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [editingOrder, setEditingOrder] = useState(null)

  const [saleMode, setSaleMode] = useState('complete')
  const [entryMode, setEntryMode] = useState('single')

  const [form, setForm] = useState(createCompleteForm())
  const [quickForm, setQuickForm] = useState(createQuickForm())

  const [bulkCommon, setBulkCommon] = useState(createBulkCommon())
  const [bulkRows, setBulkRows] = useState([createBulkRow('complete')])

  const [search, setSearch] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [productoFiltro, setProductoFiltro] = useState('Todos')
  const [metodoPagoFiltro, setMetodoPagoFiltro] = useState('Todos')

const inputClass =
  'mt-2 block w-full min-w-0 max-w-full appearance-none rounded-xl border border-[#efcccc] bg-white px-4 py-3 text-sm text-[#2e2e2e] outline-none focus:border-[#8c0303] focus:ring-2 focus:ring-[#fff1f1]'

useEffect(() => {
  fetchOrders()
  fetchProducts()

  const params = new URLSearchParams(window.location.search)

  if (params.get('new') === '1') {
    const mode =
      params.get('mode') === 'quick' ? 'quick' : 'complete'

    const entry =
      params.get('entry') === 'bulk' ? 'bulk' : 'single'

    setEditingOrder(null)
    setSaleMode(mode)
    setEntryMode(entry)
    setForm(createCompleteForm())
    setQuickForm(createQuickForm())
    setBulkCommon(createBulkCommon())
    setBulkRows([createBulkRow(mode)])
    setShowModal(true)

    window.history.replaceState({}, '', '/pedidos')
  }
}, [])

  async function fetchOrders() {
    setLoading(true)

    const { data, error } = await supabase
      .from('ventas')
      .select('*')
      .order('fecha', { ascending: false })

    if (error) {
      console.error('Error cargando ventas:', error)
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
      console.error('Error cargando productos:', error)
      return
    }

    setProducts(data || [])
  }

  function resetSaleStates() {
    setEditingOrder(null)
    setSaleMode('complete')
    setEntryMode('single')
    setForm(createCompleteForm())
    setQuickForm(createQuickForm())
    setBulkCommon(createBulkCommon())
    setBulkRows([createBulkRow('complete')])
  }

  function openCreateModal(mode = 'complete') {
    resetSaleStates()
    setSaleMode(mode)
    setBulkRows([createBulkRow(mode)])
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    resetSaleStates()
  }

  function openEditOrder(order) {
    setEditingOrder(order)
    setSaleMode('complete')
    setEntryMode('single')

    setForm({
      cliente: order.cliente || '',
      whatsapp: order.whatsapp || '',
      email: order.email || '',
      producto: order.producto || '',
      monto_pago: Number(order.monto_pago || 0),
      fecha: order.fecha || getTodayDate(),
      metodo_pago: order.metodo_pago || 'Efectivo',
      tipo_pedido: order.tipo_pedido || 'Northside Galleries',
      vendedor: order.vendedor || 'Nathalie',
      cupon: order.cupon || '',
      tipo_descuento: order.tipo_descuento || 'Sin descuento',
      descuento: order.descuento || '',
      observaciones: order.observaciones || '',
    })

    setSelectedOrder(null)
    setShowModal(true)
  }

  function handleChange(event) {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  function handleQuickChange(event) {
    const { name, value } = event.target

    setQuickForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  function handleBulkCommonChange(event) {
    const { name, value } = event.target

    setBulkCommon((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  function handleProductChange(event) {
    const productName = event.target.value
    const product = products.find((item) => item.nombre === productName)

    setForm((previous) => ({
      ...previous,
      producto: productName,
      monto_pago: product ? Number(product.precio || 0) : '',
    }))
  }

  function handleQuickProductChange(event) {
    const productName = event.target.value
    const product = products.find((item) => item.nombre === productName)

    setQuickForm((previous) => ({
      ...previous,
      producto: productName,
      monto_pago: product ? Number(product.precio || 0) : '',
    }))
  }

  function updateBulkRow(rowId, field, value) {
    setBulkRows((previous) =>
      previous.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row
      )
    )
  }

  function handleBulkProductChange(rowId, productName) {
    const product = products.find((item) => item.nombre === productName)

    setBulkRows((previous) =>
      previous.map((row) =>
        row.id === rowId
          ? {
              ...row,
              producto: productName,
              monto_pago: product ? Number(product.precio || 0) : '',
            }
          : row
      )
    )
  }

  function addBulkRow() {
    setBulkRows((previous) => [...previous, createBulkRow(saleMode)])
  }

  function removeBulkRow(rowId) {
    setBulkRows((previous) => {
      if (previous.length === 1) return previous
      return previous.filter((row) => row.id !== rowId)
    })
  }

  function setNewSaleMode(mode) {
    if (editingOrder) return

    setSaleMode(mode)
    setEntryMode('single')
    setQuickForm(createQuickForm())
    setBulkCommon(createBulkCommon())
    setBulkRows([createBulkRow(mode)])
  }

  function setNewEntryMode(mode) {
    if (editingOrder) return

    setEntryMode(mode)

    if (mode === 'bulk') {
      setBulkCommon(createBulkCommon())
      setBulkRows([createBulkRow(saleMode)])
    }
  }

  function buildVentaPayload(values) {
    return {
      fecha: values.fecha || getTodayDate(),
      cliente: values.cliente?.trim() || 'Walk-in',
      whatsapp: values.whatsapp?.trim() || null,
      email: values.email?.trim() || null,
      producto: values.producto,
      monto_pago: Number(values.monto_pago || 0),
      metodo_pago: values.metodo_pago || 'Efectivo',
      tipo_pedido: values.tipo_pedido || 'Northside Galleries',
      vendedor: values.vendedor || 'Nathalie',
      cupon: values.cupon?.trim() || null,
      tipo_descuento: values.tipo_descuento || 'Sin descuento',
      descuento: Number(values.descuento || 0),
      observaciones: values.observaciones?.trim() || null,
      status: 'Pagado',
      cantidad: 1,
    }
  }

  async function descontarInventarioPorVenta(productoNombre, ventaId) {
    if (!productoNombre) return

    const { data: producto, error: productoError } = await supabase
      .from('productos')
      .select('id, nombre')
      .eq('nombre', productoNombre)
      .single()

    if (productoError || !producto) {
      console.warn('Producto no encontrado para inventario:', productoNombre)
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
      console.error('Error buscando receta:', recipeError)
      return
    }

    if (!recipeItems?.length) {
      console.warn('Este producto no tiene receta:', productoNombre)
      return
    }

    for (const item of recipeItems) {
      const stockActual = Number(item.inventario?.stock_actual || 0)
      const cantidadUsada = Number(item.cantidad || 0)
      const nuevoStock = stockActual - cantidadUsada

      const { error: stockError } = await supabase
        .from('inventario')
        .update({ stock_actual: nuevoStock })
        .eq('id', item.inventario_id)

      if (stockError) {
        console.error('Error descontando inventario:', stockError)
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
            referencia: ventaId ? `Venta ${ventaId}` : productoNombre,
          },
        ])

      if (movimientoError) {
        console.error('Error creando movimiento de inventario:', movimientoError)
      }
    }
  }

  async function devolverInventarioDeVenta(venta) {
    const referencia = `Venta ${venta.id}`

    const { data: movimientos, error } = await supabase
      .from('inventario_movimientos')
      .select(`
        id,
        inventario_id,
        cantidad,
        tipo,
        inventario (
          id,
          stock_actual
        )
      `)
      .eq('referencia', referencia)
      .eq('tipo', 'salida')

    if (error) throw error

    for (const movimiento of movimientos || []) {
      const stockActual = Number(movimiento.inventario?.stock_actual || 0)
      const cantidadDevuelta = Number(movimiento.cantidad || 0)

      const { error: updateError } = await supabase
        .from('inventario')
        .update({
          stock_actual: stockActual + cantidadDevuelta,
        })
        .eq('id', movimiento.inventario_id)

      if (updateError) throw updateError
    }

    if (movimientos?.length) {
      const { error: deleteError } = await supabase
        .from('inventario_movimientos')
        .delete()
        .in(
          'id',
          movimientos.map((item) => item.id)
        )

      if (deleteError) throw deleteError
    }
  }

  async function insertarVentaConInventario(payload) {
    const { data, error } = await supabase
      .from('ventas')
      .insert([payload])
      .select()
      .single()

    if (error) throw error

    await descontarInventarioPorVenta(payload.producto, data.id)

    return data
  }

  async function guardarVentaCompleta() {
    if (!form.cliente.trim()) {
      alert('Debes colocar el nombre del cliente.')
      return
    }

    if (!form.producto || Number(form.monto_pago) <= 0) {
      alert('Debes seleccionar un producto y agregar el precio.')
      return
    }

    setSaving(true)

    try {
      const payload = buildVentaPayload(form)

      if (editingOrder) {
        const { error } = await supabase
          .from('ventas')
          .update({
            ...payload,
            editado_por: 'Nathalie',
            editado_en: new Date().toISOString(),
          })
          .eq('id', editingOrder.id)

        if (error) throw error

        alert('Venta actualizada correctamente.')
      } else {
        await insertarVentaConInventario(payload)
        alert('Venta registrada correctamente.')
      }

      await fetchOrders()
      closeModal()
    } catch (error) {
      console.error('Error guardando venta:', error)
      alert('No se pudo guardar la venta.')
    } finally {
      setSaving(false)
    }
  }

  async function guardarVentaRapida() {
    if (!quickForm.producto || Number(quickForm.monto_pago) <= 0) {
      alert('Debes seleccionar un producto y agregar el precio.')
      return
    }

    setSaving(true)

    try {
      await insertarVentaConInventario(
        buildVentaPayload({
          ...quickForm,
          cliente: 'Walk-in',
        })
      )

      await fetchOrders()
      closeModal()
      alert('Venta rápida registrada correctamente.')
    } catch (error) {
      console.error('Error guardando venta rápida:', error)
      alert('No se pudo guardar la venta rápida.')
    } finally {
      setSaving(false)
    }
  }

  async function guardarVentasBulk() {
    const rowsValidas = bulkRows.filter(
      (row) => row.producto && Number(row.monto_pago) > 0
    )

    if (!rowsValidas.length) {
      alert('Agrega al menos una venta con producto y precio.')
      return
    }

    if (rowsValidas.length !== bulkRows.length) {
      alert('Hay filas incompletas. Completa o elimina cada fila.')
      return
    }

    if (
      saleMode === 'complete' &&
      rowsValidas.some((row) => !row.cliente.trim())
    ) {
      alert('Cada venta completa debe tener nombre de cliente.')
      return
    }

    setSaving(true)

    const errors = []

    try {
      for (const row of rowsValidas) {
        const payload = buildVentaPayload({
          ...bulkCommon,
          ...row,
          cliente: saleMode === 'quick' ? 'Walk-in' : row.cliente,
        })

        try {
          await insertarVentaConInventario(payload)
        } catch (error) {
          console.error('Error en venta bulk:', error)
          errors.push(row.producto)
        }
      }

      await fetchOrders()

      if (errors.length) {
        alert(
          `Se registraron ${
            rowsValidas.length - errors.length
          } venta(s). Fallaron: ${errors.join(', ')}.`
        )
        return
      }

      closeModal()
      alert(`${rowsValidas.length} venta(s) registradas correctamente.`)
    } finally {
      setSaving(false)
    }
  }

  async function recalcularInventarioDeVenta(venta) {
    const confirmacion = confirm(
      `¿Deseas recalcular el inventario de ${venta.producto}?`
    )

    if (!confirmacion) return

    try {
      await devolverInventarioDeVenta(venta)
      await descontarInventarioPorVenta(venta.producto, venta.id)

      await fetchOrders()
      alert('Inventario recalculado correctamente.')
    } catch (error) {
      console.error('Error recalculando inventario:', error)
      alert('No se pudo recalcular el inventario.')
    }
  }

  async function eliminarVenta(venta) {
    const confirmacion = confirm(
      `¿Deseas eliminar la venta ${formatOrderId(venta)}? Esto devolverá el inventario.`
    )

    if (!confirmacion) return

    try {
      await devolverInventarioDeVenta(venta)

      const { error } = await supabase
        .from('ventas')
        .delete()
        .eq('id', venta.id)

      if (error) throw error

      setSelectedOrder(null)
      await fetchOrders()

      alert('Venta eliminada correctamente.')
    } catch (error) {
      console.error('Error eliminando venta:', error)
      alert('No se pudo eliminar la venta.')
    }
  }

  function exportToCSV() {
    const headers = [
      'ID',
      'Fecha',
      'Cliente',
      'Producto',
      'Sucursal',
      'Vendedor',
      'Método de pago',
      'Total',
    ]

    const rows = filteredOrders.map((order) => [
      formatOrderId(order),
      order.fecha || '',
      order.cliente || 'Walk-in',
      order.producto || '',
      order.tipo_pedido || '',
      order.vendedor || '',
      order.metodo_pago || '',
      Number(order.monto_pago || 0).toFixed(2),
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `ventas-${getTodayDate()}.csv`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  function limpiarFiltros() {
    setSearch('')
    setFechaInicio('')
    setFechaFin('')
    setProductoFiltro('Todos')
    setMetodoPagoFiltro('Todos')
  }

  const validOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.fecha &&
          order.producto &&
          order.metodo_pago &&
          order.monto_pago !== null
      ),
    [orders]
  )

  const productosFiltro = useMemo(
    () => [
      'Todos',
      ...new Set(validOrders.map((order) => order.producto).filter(Boolean)),
    ],
    [validOrders]
  )

  const metodosFiltro = useMemo(
    () => [
      'Todos',
      ...new Set(
        validOrders.map((order) => order.metodo_pago).filter(Boolean)
      ),
    ],
    [validOrders]
  )

  const filteredOrders = useMemo(() => {
    return validOrders.filter((order) => {
      const text = `
        ${order.cliente || ''}
        ${order.producto || ''}
        ${order.metodo_pago || ''}
        ${order.tipo_pedido || ''}
        ${order.vendedor || ''}
        ${order.operacion || ''}
      `.toLowerCase()

      const matchesSearch = text.includes(search.toLowerCase())
      const orderDate = order.fecha || order.created_at?.split('T')[0] || ''

      const matchesStart = !fechaInicio || orderDate >= fechaInicio
      const matchesEnd = !fechaFin || orderDate <= fechaFin

      const matchesProduct =
        productoFiltro === 'Todos' || order.producto === productoFiltro

      const matchesPayment =
        metodoPagoFiltro === 'Todos' ||
        order.metodo_pago === metodoPagoFiltro

      return (
        matchesSearch &&
        matchesStart &&
        matchesEnd &&
        matchesProduct &&
        matchesPayment
      )
    })
  }, [
    validOrders,
    search,
    fechaInicio,
    fechaFin,
    productoFiltro,
    metodoPagoFiltro,
  ])

  const totalVendido = filteredOrders.reduce(
    (sum, item) => sum + Number(item.monto_pago || 0),
    0
  )

  const ticketPromedio = filteredOrders.length
    ? totalVendido / filteredOrders.length
    : 0

  const metodoMasUsado = useMemo(() => {
    const count = {}

    filteredOrders.forEach((order) => {
      const metodo = order.metodo_pago || 'Sin método'
      count[metodo] = (count[metodo] || 0) + 1
    })

    const top = Object.entries(count).sort((a, b) => b[1] - a[1])[0]

    return top?.[0] || 'Sin datos'
  }, [filteredOrders])

  return (
    <main className="min-h-screen bg-[#fcf8f8]">
      <header className="border-b border-[#f1dede] bg-white px-5 py-3 md:flex md:h-[82px] md:items-center md:px-8 md:py-0">
        <div className="w-full">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
                Operación comercial
              </p>

              <h1 className="mt-1 text-[21px] font-bold text-[#7a0000] md:text-[23px]">
                Registro de ventas
              </h1>

              <p className="mt-1 text-xs text-[#b07a7a] md:text-sm">
                Registra, consulta y administra las ventas del negocio.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={exportToCSV}
                className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#efcccc] bg-white px-4 text-sm font-semibold text-[#8c0303] hover:bg-[#fff5f5]"
              >
                <Download size={16} />
                CSV
              </button>

              <button
                type="button"
                onClick={() => openCreateModal('quick')}
                className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#efcccc] bg-white px-4 text-sm font-semibold text-[#8c0303] hover:bg-[#fff5f5]"
              >
                <Zap size={16} />
                Venta rápida
              </button>

              <button
                type="button"
                onClick={() => openCreateModal('complete')}
                className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#8c0303] px-4 text-sm font-semibold text-white hover:bg-[#720000]"
              >
                <Plus size={16} />
                Registrar venta
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1600px] space-y-5 px-4 py-5 md:px-8 md:py-7">
        <section className="overflow-hidden rounded-[26px] border border-[#f3dede] bg-white">
          <button
            type="button"
            onClick={() => setShowFilters((previous) => !previous)}
            className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff1f1] text-[#8c0303]">
                <Filter size={18} />
              </div>

              <div>
                <h2 className="text-[20px] font-bold text-[#7a0000]">
                  Filtros de ventas
                </h2>

                <p className="mt-1 text-sm text-[#b07a7a]">
                  Busca por cliente, producto, fecha o método de pago.
                </p>
              </div>
            </div>

            <ChevronDown
              size={20}
              className={`text-[#8c0303] transition ${
                showFilters ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showFilters && (
            <div className="border-t border-[#f3dede] px-5 py-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                <Field label="Buscar">
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#efcccc] px-4 py-3">
                    <Search size={17} className="text-[#b07a7a]" />

                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Cliente, producto o venta..."
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </div>
                </Field>

                <Field label="Desde">
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(event) => setFechaInicio(event.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Hasta">
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(event) => setFechaFin(event.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Producto">
                  <select
                    value={productoFiltro}
                    onChange={(event) => setProductoFiltro(event.target.value)}
                    className={inputClass}
                  >
                    {productosFiltro.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Método de pago">
                  <select
                    value={metodoPagoFiltro}
                    onChange={(event) =>
                      setMetodoPagoFiltro(event.target.value)
                    }
                    className={inputClass}
                  >
                    {metodosFiltro.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const today = getTodayDate()
                    setFechaInicio(today)
                    setFechaFin(today)
                  }}
                  className="rounded-full border border-[#efcccc] px-4 py-2 text-sm font-semibold text-[#8c0303]"
                >
                  Hoy
                </button>

                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="rounded-full bg-[#8c0303] px-4 py-2 text-sm font-semibold text-white"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard
            label="Ventas filtradas"
            value={filteredOrders.length}
            icon={ShoppingBag}
          />

          <StatCard
            label="Total vendido"
            value={formatCurrency(totalVendido)}
            icon={CalendarDays}
          />

          <StatCard
            label="Ticket promedio"
            value={formatCurrency(ticketPromedio)}
            icon={Zap}
          />

          <StatCard
            label="Método más usado"
            value={metodoMasUsado}
            icon={Filter}
          />
        </section>

        <section className="overflow-hidden rounded-[26px] border border-[#f3dede] bg-white">
          <div className="border-b border-[#f3dede] px-5 py-5">
            <h2 className="text-[20px] font-bold text-[#7a0000]">
              Ventas registradas
            </h2>

            <p className="mt-1 text-sm text-[#b07a7a]">
              Historial de ventas individuales registradas.
            </p>
          </div>

          <div className="divide-y divide-[#f3dede] md:hidden">
            {loading ? (
              <p className="px-5 py-10 text-center text-[#b07a7a]">
                Cargando ventas...
              </p>
            ) : filteredOrders.length === 0 ? (
              <p className="px-5 py-10 text-center text-[#b07a7a]">
                No hay ventas registradas.
              </p>
            ) : (
              filteredOrders.map((order) => (
                <article key={order.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#8c0303]">
                        {formatOrderId(order)}
                      </p>

                      <h3 className="mt-2 text-lg font-bold text-[#7a0000]">
                        {order.producto}
                      </h3>

                      <p className="mt-1 text-sm text-[#b07a7a]">
                        {order.cliente || 'Walk-in'} · {order.fecha}
                      </p>
                    </div>

                    <p className="text-lg font-bold text-[#8c0303]">
                      {formatCurrency(order.monto_pago)}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#fff1f1] px-3 py-1 text-xs text-[#8c0303]">
                      {order.metodo_pago}
                    </span>

                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-700">
                      {order.tipo_pedido}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="flex h-10 items-center justify-center rounded-xl border border-[#efcccc] text-[#8c0303]"
                    >
                      <Eye size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditOrder(order)}
                      className="flex h-10 items-center justify-center rounded-xl border border-[#efcccc] text-[#8c0303]"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => recalcularInventarioDeVenta(order)}
                      className="flex h-10 items-center justify-center rounded-xl border border-[#efcccc] text-[#8c0303]"
                    >
                      <RefreshCw size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => eliminarVenta(order)}
                      className="flex h-10 items-center justify-center rounded-xl border border-red-200 text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[1050px] w-full text-sm">
              <thead className="bg-[#f8eeee] text-left text-[11px] uppercase tracking-[0.12em] text-[#a16f6f]">
                <tr>
                  <th className="px-5 py-4">ID</th>
                  <th className="px-5 py-4">Fecha</th>
                  <th className="px-5 py-4">Cliente</th>
                  <th className="px-5 py-4">Producto</th>
                  <th className="px-5 py-4">Sucursal</th>
                  <th className="px-5 py-4">Vendedor</th>
                  <th className="px-5 py-4">Pago</th>
                  <th className="px-5 py-4">Total</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-5 py-10 text-center text-[#b07a7a]"
                    >
                      Cargando ventas...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-5 py-10 text-center text-[#b07a7a]"
                    >
                      No hay ventas registradas.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-t border-[#f3dede] hover:bg-[#fffafa]"
                    >
                      <td className="px-5 py-4 font-medium text-[#8c0303]">
                        {formatOrderId(order)}
                      </td>

                      <td className="px-5 py-4">{order.fecha}</td>

                      <td className="px-5 py-4">
                        {order.cliente || 'Walk-in'}
                      </td>

                      <td className="px-5 py-4">{order.producto}</td>

                      <td className="px-5 py-4">{order.tipo_pedido}</td>

                      <td className="px-5 py-4">{order.vendedor}</td>

                      <td className="px-5 py-4">{order.metodo_pago}</td>

                      <td className="px-5 py-4 font-semibold">
                        {formatCurrency(order.monto_pago)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#efcccc] text-[#8c0303]"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditOrder(order)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#efcccc] text-[#8c0303]"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => recalcularInventarioDeVenta(order)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#efcccc] text-[#8c0303]"
                          >
                            <RefreshCw size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => eliminarVenta(order)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 text-red-600"
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
        </section>
      </section>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 md:items-center">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-t-[30px] border border-[#f3dede] bg-white md:rounded-[30px]">
            <div className="sticky top-0 z-20 flex items-start justify-between gap-4 border-b border-[#f3dede] bg-white px-5 py-5 md:px-7">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
                  Operación comercial
                </p>

                <h2 className="mt-1 text-[25px] font-bold text-[#7a0000]">
                  {editingOrder
                    ? 'Editar venta'
                    : saleMode === 'quick'
                      ? 'Registrar venta rápida'
                      : 'Registrar venta completa'}
                </h2>

                <p className="mt-1 text-sm text-[#b07a7a]">
                  {editingOrder
                    ? 'Actualiza la información de esta venta.'
                    : entryMode === 'bulk'
                      ? 'Cada fila se guarda como una venta independiente.'
                      : 'Registra una venta individual.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#efcccc] text-[#8c0303]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-5 md:p-7">
              {!editingOrder && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[#f3dede] bg-[#fff7f7] p-2">
                    <button
                      type="button"
                      onClick={() => setNewSaleMode('complete')}
                      className={`h-11 rounded-xl text-sm font-semibold ${
                        saleMode === 'complete'
                          ? 'bg-[#8c0303] text-white'
                          : 'text-[#8c0303]'
                      }`}
                    >
                      Venta completa
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewSaleMode('quick')}
                      className={`h-11 rounded-xl text-sm font-semibold ${
                        saleMode === 'quick'
                          ? 'bg-[#8c0303] text-white'
                          : 'text-[#8c0303]'
                      }`}
                    >
                      Venta rápida
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setNewEntryMode('single')}
                      className={`flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold ${
                        entryMode === 'single'
                          ? 'border-[#8c0303] bg-[#fff1f1] text-[#8c0303]'
                          : 'border-[#efcccc] text-[#8c0303]'
                      }`}
                    >
                      <Plus size={15} />
                      Venta individual
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewEntryMode('bulk')}
                      className={`flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold ${
                        entryMode === 'bulk'
                          ? 'border-[#8c0303] bg-[#fff1f1] text-[#8c0303]'
                          : 'border-[#efcccc] text-[#8c0303]'
                      }`}
                    >
                      <ListPlus size={15} />
                      Carga en bloque
                    </button>
                  </div>
                </div>
              )}

              {(editingOrder ||
                (saleMode === 'complete' && entryMode === 'single')) && (
                <>
                  <section className="rounded-2xl border border-[#f3dede] p-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#8c0303]">
                      Información del cliente
                    </p>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                      <Field label="Nombre del cliente">
                        <input
                          name="cliente"
                          value={form.cliente}
                          onChange={handleChange}
                          placeholder="Ej. Valentina Torres"
                          className={inputClass}
                        />
                      </Field>

                      <Field label="WhatsApp">
                        <input
                          name="whatsapp"
                          value={form.whatsapp}
                          onChange={handleChange}
                          placeholder="5512345678"
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Email">
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="cliente@email.com"
                          className={inputClass}
                        />
                      </Field>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-[#f3dede] p-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#8c0303]">
                      Producto y pago
                    </p>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field label="Producto">
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
                      </Field>

                      <Field label="Precio">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          name="monto_pago"
                          value={form.monto_pago}
                          onChange={handleChange}
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
                          {METODOS_PAGO.map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Fecha">
                        <input
                          type="date"
                          name="fecha"
                          value={form.fecha}
                          onChange={handleChange}
                          className={inputClass}
                        />
                      </Field>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-[#f3dede] p-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#8c0303]">
                      Detalles de operación
                    </p>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field label="Sucursal">
                        <select
                          name="tipo_pedido"
                          value={form.tipo_pedido}
                          onChange={handleChange}
                          className={inputClass}
                        >
                          {SUCURSALES.map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Vendedor">
                        <select
                          name="vendedor"
                          value={form.vendedor}
                          onChange={handleChange}
                          className={inputClass}
                        >
                          {VENDEDORES.map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-[#f3dede] p-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#8c0303]">
                      Cupón y descuento
                    </p>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
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
                        type="number"
                        min="0"
                        step="0.01"
                        name="descuento"
                        value={form.descuento}
                        onChange={handleChange}
                        placeholder="Monto descuento"
                        className={inputClass}
                      />
                    </div>
                  </section>

                  <Field label="Notas del pedido">
                    <textarea
                      name="observaciones"
                      value={form.observaciones}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Ej. Entregar en portería..."
                      className={`${inputClass} resize-none`}
                    />
                  </Field>

                  <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="rounded-xl border border-[#efcccc] px-5 py-3 font-semibold text-[#8c0303]"
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      onClick={guardarVentaCompleta}
                      disabled={saving}
                      className="rounded-xl bg-[#8c0303] px-5 py-3 font-semibold text-white disabled:opacity-50"
                    >
                      {saving
                        ? 'Guardando...'
                        : editingOrder
                          ? 'Guardar cambios'
                          : 'Registrar venta'}
                    </button>
                  </div>
                </>
              )}

              {!editingOrder &&
                saleMode === 'quick' &&
                entryMode === 'single' && (
                  <>
                    <section className="rounded-2xl border border-[#f3dede] bg-[#fffafa] p-5">
                      <p className="text-sm font-semibold text-[#7a0000]">
                        Registrar venta rápida
                      </p>

                      <p className="mt-1 text-sm text-[#b07a7a]">
                        Se guardará como venta individual con cliente Walk-in.
                      </p>

                      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <Field label="Fecha">
                          <input
                            type="date"
                            name="fecha"
                            value={quickForm.fecha}
                            onChange={handleQuickChange}
                            className={inputClass}
                          />
                        </Field>

                        <Field label="Producto">
                          <select
                            name="producto"
                            value={quickForm.producto}
                            onChange={handleQuickProductChange}
                            className={inputClass}
                          >
                            <option value="">Seleccionar producto...</option>

                            {products.map((product) => (
                              <option key={product.id} value={product.nombre}>
                                {product.nombre}
                              </option>
                            ))}
                          </select>
                        </Field>

                        <Field label="Precio">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            name="monto_pago"
                            value={quickForm.monto_pago}
                            onChange={handleQuickChange}
                            className={inputClass}
                          />
                        </Field>

                        <Field label="Método de pago">
                          <select
                            name="metodo_pago"
                            value={quickForm.metodo_pago}
                            onChange={handleQuickChange}
                            className={inputClass}
                          >
                            {METODOS_PAGO.map((item) => (
                              <option key={item}>{item}</option>
                            ))}
                          </select>
                        </Field>

                        <Field label="Sucursal">
                          <select
                            name="tipo_pedido"
                            value={quickForm.tipo_pedido}
                            onChange={handleQuickChange}
                            className={inputClass}
                          >
                            {SUCURSALES.map((item) => (
                              <option key={item}>{item}</option>
                            ))}
                          </select>
                        </Field>

                        <Field label="Vendedor">
                          <select
                            name="vendedor"
                            value={quickForm.vendedor}
                            onChange={handleQuickChange}
                            className={inputClass}
                          >
                            {VENDEDORES.map((item) => (
                              <option key={item}>{item}</option>
                            ))}
                          </select>
                        </Field>
                      </div>
                    </section>

                    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="rounded-xl border border-[#efcccc] px-5 py-3 font-semibold text-[#8c0303]"
                      >
                        Cancelar
                      </button>

                      <button
                        type="button"
                        onClick={guardarVentaRapida}
                        disabled={saving}
                        className="rounded-xl bg-[#8c0303] px-5 py-3 font-semibold text-white disabled:opacity-50"
                      >
                        {saving ? 'Guardando...' : 'Guardar venta rápida'}
                      </button>
                    </div>
                  </>
                )}

              {!editingOrder && entryMode === 'bulk' && (
                <>
                  <section className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-[#f3dede] bg-[#fffafa] p-5">
                    <p className="text-sm font-semibold text-[#7a0000]">
                      Información General
                    </p>

                   <div className="mt-5 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <Field label="Fecha">
                        <input
                          type="date"
                          name="fecha"
                          value={bulkCommon.fecha}
                          onChange={handleBulkCommonChange}
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Método de pago">
                        <select
                          name="metodo_pago"
                          value={bulkCommon.metodo_pago}
                          onChange={handleBulkCommonChange}
                          className={inputClass}
                        >
                          {METODOS_PAGO.map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Sucursal">
                        <select
                          name="tipo_pedido"
                          value={bulkCommon.tipo_pedido}
                          onChange={handleBulkCommonChange}
                          className={inputClass}
                        >
                          {SUCURSALES.map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Vendedor">
                        <select
                          name="vendedor"
                          value={bulkCommon.vendedor}
                          onChange={handleBulkCommonChange}
                          className={inputClass}
                        >
                          {VENDEDORES.map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </section>

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#7a0000]">
                        Ventas por registrar
                      </h3>

                      <p className="mt-1 text-sm text-[#b07a7a]">
                        Cada fila crea una venta independiente.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addBulkRow}
                      className="flex h-10 items-center gap-2 rounded-xl bg-[#8c0303] px-4 text-sm font-semibold text-white"
                    >
                      <Plus size={16} />
                      Agregar venta
                    </button>
                  </div>

                  <div className="space-y-4">
                    {bulkRows.map((row, index) => (
                      <article
                        key={row.id}
                        className="rounded-2xl border border-[#f3dede] bg-white p-5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-bold text-[#7a0000]">
                            Venta #{index + 1}
                          </p>

                          <button
                            type="button"
                            onClick={() => removeBulkRow(row.id)}
                            disabled={bulkRows.length === 1}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 text-red-600 disabled:opacity-40"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {saleMode === 'complete' && (
                            <>
                              <Field label="Cliente *">
                                <input
                                  value={row.cliente}
                                  onChange={(event) =>
                                    updateBulkRow(
                                      row.id,
                                      'cliente',
                                      event.target.value
                                    )
                                  }
                                  placeholder="Nombre del cliente"
                                  className={inputClass}
                                />
                              </Field>

                              <Field label="WhatsApp">
                                <input
                                  value={row.whatsapp}
                                  onChange={(event) =>
                                    updateBulkRow(
                                      row.id,
                                      'whatsapp',
                                      event.target.value
                                    )
                                  }
                                  placeholder="5512345678"
                                  className={inputClass}
                                />
                              </Field>

                              <Field label="Email">
                                <input
                                  type="email"
                                  value={row.email}
                                  onChange={(event) =>
                                    updateBulkRow(
                                      row.id,
                                      'email',
                                      event.target.value
                                    )
                                  }
                                  placeholder="cliente@email.com"
                                  className={inputClass}
                                />
                              </Field>
                            </>
                          )}

                          <Field label="Producto *">
                            <select
                              value={row.producto}
                              onChange={(event) =>
                                handleBulkProductChange(
                                  row.id,
                                  event.target.value
                                )
                              }
                              className={inputClass}
                            >
                              <option value="">Seleccionar producto...</option>

                              {products.map((product) => (
                                <option key={product.id} value={product.nombre}>
                                  {product.nombre}
                                </option>
                              ))}
                            </select>
                          </Field>

                          <Field label="Precio *">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={row.monto_pago}
                              onChange={(event) =>
                                updateBulkRow(
                                  row.id,
                                  'monto_pago',
                                  event.target.value
                                )
                              }
                              className={inputClass}
                            />
                          </Field>

                          {saleMode === 'complete' && (
                            <>
                              <Field label="Cupón">
                                <input
                                  value={row.cupon}
                                  onChange={(event) =>
                                    updateBulkRow(
                                      row.id,
                                      'cupon',
                                      event.target.value
                                    )
                                  }
                                  placeholder="Opcional"
                                  className={inputClass}
                                />
                              </Field>

                              <Field label="Tipo de descuento">
                                <select
                                  value={row.tipo_descuento}
                                  onChange={(event) =>
                                    updateBulkRow(
                                      row.id,
                                      'tipo_descuento',
                                      event.target.value
                                    )
                                  }
                                  className={inputClass}
                                >
                                  <option>Sin descuento</option>
                                  <option>Porcentaje</option>
                                  <option>Monto fijo</option>
                                </select>
                              </Field>

                              <Field label="Descuento">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={row.descuento}
                                  onChange={(event) =>
                                    updateBulkRow(
                                      row.id,
                                      'descuento',
                                      event.target.value
                                    )
                                  }
                                  className={inputClass}
                                />
                              </Field>

                              <div className="md:col-span-2 xl:col-span-3">
                                <Field label="Notas">
                                  <input
                                    value={row.observaciones}
                                    onChange={(event) =>
                                      updateBulkRow(
                                        row.id,
                                        'observaciones',
                                        event.target.value
                                      )
                                    }
                                    placeholder="Opcional"
                                    className={inputClass}
                                  />
                                </Field>
                              </div>
                            </>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="rounded-xl border border-[#efcccc] px-5 py-3 font-semibold text-[#8c0303]"
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      onClick={guardarVentasBulk}
                      disabled={saving}
                      className="rounded-xl bg-[#8c0303] px-5 py-3 font-semibold text-white disabled:opacity-50"
                    >
                      {saving
                        ? 'Registrando ventas...'
                        : `Guardar ${bulkRows.length} venta(s)`}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/40 md:items-center">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[30px] bg-white md:rounded-[30px]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#f3dede] bg-white px-5 py-5">
              <div>
                <h2 className="text-xl font-bold text-[#7a0000]">
                  Detalle de venta
                </h2>

                <p className="mt-1 text-sm text-[#b07a7a]">
                  {formatOrderId(selectedOrder)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#efcccc] text-[#8c0303]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailItem label="Fecha" value={selectedOrder.fecha} />
                <DetailItem
                  label="Cliente"
                  value={selectedOrder.cliente || 'Walk-in'}
                />
                <DetailItem label="WhatsApp" value={selectedOrder.whatsapp} />
                <DetailItem label="Email" value={selectedOrder.email} />
                <DetailItem label="Producto" value={selectedOrder.producto} />
                <DetailItem
                  label="Sucursal"
                  value={selectedOrder.tipo_pedido}
                />
                <DetailItem label="Vendedor" value={selectedOrder.vendedor} />
                <DetailItem
                  label="Método de pago"
                  value={selectedOrder.metodo_pago}
                />
                <DetailItem
                  label="Total"
                  value={formatCurrency(selectedOrder.monto_pago)}
                />
                <DetailItem label="Estado" value={selectedOrder.status} />
                <DetailItem label="Cupón" value={selectedOrder.cupon} />
                <DetailItem
                  label="Descuento"
                  value={
                    selectedOrder.descuento
                      ? formatCurrency(selectedOrder.descuento)
                      : 'Sin descuento'
                  }
                />
              </div>

              <div className="rounded-2xl border border-[#f3dede] bg-[#fffafa] p-4">
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#b07a7a]">
                  Observaciones
                </p>

                <p className="mt-2 text-sm text-[#2e2e2e]">
                  {selectedOrder.observaciones ||
                    'Sin observaciones registradas.'}
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-xl border border-[#efcccc] px-5 py-3 font-semibold text-[#8c0303]"
                >
                  Cerrar
                </button>

                <button
                  type="button"
                  onClick={() => recalcularInventarioDeVenta(selectedOrder)}
                  className="rounded-xl border border-[#efcccc] px-5 py-3 font-semibold text-[#8c0303]"
                >
                  Recalcular inventario
                </button>

                <button
                  type="button"
                  onClick={() => eliminarVenta(selectedOrder)}
                  className="rounded-xl border border-red-200 px-5 py-3 font-semibold text-red-600"
                >
                  Eliminar venta
                </button>

                <button
                  type="button"
                  onClick={() => openEditOrder(selectedOrder)}
                  className="rounded-xl bg-[#8c0303] px-5 py-3 font-semibold text-white"
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