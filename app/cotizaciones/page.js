'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
Plus,
Search,
Filter,
X,
Trash2,
Mail,
MessageCircle,
Printer,
Eye,
ChevronDown,
FileText,
Send,
CheckCircle2,
Clock3,
XCircle,
RefreshCw,
DollarSign,
} from 'lucide-react'

function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}

function getDatePlusDays(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)

  return date.toISOString().split('T')[0]
}

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`
}

function formatDate(value) {
  if (!value) return 'Sin fecha'

  return new Date(`${value}T00:00:00`).toLocaleDateString('es-PA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function createQuoteNumber() {
  const now = new Date()

  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('')

  const time = [
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('')

  const random = Math.floor(1000 + Math.random() * 9000)

  return `COT-${date}-${time}-${random}`
}

function createEmptyItem() {
  return {
    descripcion: '',
    cantidad: 1,
    precio_unitario: '',
  }
}

function createEmptyQuote() {
  return {
    cliente_nombre: '',
    cliente_email: '',
    cliente_whatsapp: '',
    fecha: getTodayDate(),
    valida_hasta: getDatePlusDays(7),
    descuento: '',
    impuesto: '',
    notas: '',
    items: [createEmptyItem()],
  }
}

function getStatusStyles(status) {
  const styles = {
    borrador: 'bg-[#fff1f1] text-[#8c0303]',
    enviada: 'bg-blue-50 text-blue-700',
    aceptada: 'bg-emerald-50 text-emerald-700',
    rechazada: 'bg-red-50 text-red-700',
    vencida: 'bg-amber-50 text-amber-700',
  }

  return styles[status] || styles.borrador
}

function getStatusLabel(status) {
  const labels = {
    borrador: 'Borrador',
    enviada: 'Enviada',
    aceptada: 'Aceptada',
    rechazada: 'Rechazada',
    vencida: 'Vencida',
  }

  return labels[status] || 'Borrador'
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="bg-white border border-[#f3dede] rounded-2xl p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
            {label}
          </p>

          <p className="text-[27px] md:text-3xl ivy text-[#8c0303] leading-none mt-3">
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

export default function CotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState(null)

  const [search, setSearch] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('Todos')
  const [form, setForm] = useState(createEmptyQuote())

  useEffect(() => {
    fetchCotizaciones()
  }, [])

  async function fetchCotizaciones() {
    setLoading(true)

    const { data, error } = await supabase
      .from('cotizaciones')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error cargando cotizaciones:', error)
      setLoading(false)
      return
    }

    setCotizaciones(data || [])
    setLoading(false)
  }

  const cotizacionesFiltradas = useMemo(() => {
    const texto = search.trim().toLowerCase()

    return cotizaciones.filter((cotizacion) => {
      const contenido = `
        ${cotizacion.numero || ''}
        ${cotizacion.cliente_nombre || ''}
        ${cotizacion.cliente_email || ''}
        ${cotizacion.cliente_whatsapp || ''}
        ${cotizacion.estado || ''}
      `.toLowerCase()

      const coincideBusqueda =
        !texto || contenido.includes(texto)

      const coincideEstado =
        estadoFiltro === 'Todos' ||
        cotizacion.estado === estadoFiltro

      return coincideBusqueda && coincideEstado
    })
  }, [cotizaciones, search, estadoFiltro])

  const subtotal = form.items.reduce((sum, item) => {
    return (
      sum +
      Number(item.cantidad || 0) *
        Number(item.precio_unitario || 0)
    )
  }, 0)

  const descuento = Number(form.descuento || 0)
  const impuesto = Number(form.impuesto || 0)
  const total = Math.max(0, subtotal - descuento + impuesto)

  const totalEnviadas = cotizaciones.filter(
    (item) => item.estado === 'enviada'
  ).length

  const totalAceptadas = cotizaciones.filter(
    (item) => item.estado === 'aceptada'
  ).length

  const montoCotizado = cotizaciones.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  )

  function openCreateForm() {
    setForm(createEmptyQuote())
    setShowForm(true)
  }

  function closeCreateForm() {
    setShowForm(false)
    setForm(createEmptyQuote())
  }

  function updateForm(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  function updateItem(index, field, value) {
    setForm((previous) => ({
      ...previous,
      items: previous.items.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value }
          : item
      ),
    }))
  }

  function addItem() {
    setForm((previous) => ({
      ...previous,
      items: [...previous.items, createEmptyItem()],
    }))
  }

  function removeItem(index) {
    setForm((previous) => ({
      ...previous,
      items:
        previous.items.length === 1
          ? previous.items
          : previous.items.filter(
              (_, itemIndex) => itemIndex !== index
            ),
    }))
  }

  async function guardarCotizacion() {
    const itemsValidos = form.items.filter(
      (item) =>
        item.descripcion.trim() &&
        Number(item.cantidad) > 0 &&
        Number(item.precio_unitario) > 0
    )

    if (!form.cliente_nombre.trim()) {
      alert('Ingresa el nombre del cliente.')
      return
    }

    if (itemsValidos.length === 0) {
      alert('Agrega al menos un servicio o producto válido.')
      return
    }

    setSaving(true)

    const { data: authData } = await supabase.auth.getUser()

    const payload = {
      numero: createQuoteNumber(),
      cliente_nombre: form.cliente_nombre.trim(),
      cliente_email: form.cliente_email.trim() || null,
      cliente_whatsapp: form.cliente_whatsapp.trim() || null,
      fecha: form.fecha,
      valida_hasta: form.valida_hasta || null,
      estado: 'borrador',
      items: itemsValidos.map((item) => ({
        descripcion: item.descripcion.trim(),
        cantidad: Number(item.cantidad),
        precio_unitario: Number(item.precio_unitario),
      })),
      subtotal,
      descuento,
      impuesto,
      total,
      notas: form.notas.trim() || null,
      creado_por: authData?.user?.id || null,
    }

    const { data, error } = await supabase
      .from('cotizaciones')
      .insert([payload])
      .select()
      .single()

    if (error) {
      console.error('Error guardando cotización:', error)
      alert('No se pudo guardar la cotización.')
      setSaving(false)
      return
    }

    await fetchCotizaciones()

    setSelectedQuote(data)
    closeCreateForm()
    setSaving(false)
  }

  async function actualizarEstado(cotizacion, estado) {
    const { data, error } = await supabase
      .from('cotizaciones')
      .update({ estado })
      .eq('id', cotizacion.id)
      .select()
      .single()

    if (error) {
      console.error('Error actualizando estado:', error)
      alert('No se pudo actualizar el estado.')
      return
    }

    setSelectedQuote(data)
    await fetchCotizaciones()
  }

  function limpiarFiltros() {
    setSearch('')
    setEstadoFiltro('Todos')
  }

  function normalizarWhatsapp(numero) {
    const limpio = String(numero || '').replace(/\D/g, '')

    if (!limpio) return ''

    if (limpio.length === 8) {
      return `507${limpio}`
    }

    return limpio
  }

  async function abrirWhatsApp(cotizacion) {
    const telefono = normalizarWhatsapp(
      cotizacion.cliente_whatsapp
    )

    if (!telefono) {
      alert('Esta cotización no tiene un número de WhatsApp.')
      return
    }

    const itemsTexto = (cotizacion.items || [])
      .map(
        (item) =>
          `• ${item.descripcion} x${item.cantidad} — ${formatCurrency(
            Number(item.cantidad) * Number(item.precio_unitario)
          )}`
      )
      .join('\n')

    const mensaje = `Hola ${cotizacion.cliente_nombre},

Te compartimos la cotización ${cotizacion.numero} de La Casa de las Fresas.

${itemsTexto}

Total: ${formatCurrency(cotizacion.total)}
Válida hasta: ${formatDate(cotizacion.valida_hasta)}

Quedamos atentos a cualquier consulta. 🍓`

    window.open(
      `https://wa.me/${telefono}?text=${encodeURIComponent(
        mensaje
      )}`,
      '_blank'
    )

    if (cotizacion.estado === 'borrador') {
      await actualizarEstado(cotizacion, 'enviada')
    }
  }

  async function enviarEmail(cotizacion) {
    if (!cotizacion.cliente_email) {
      alert('Esta cotización no tiene email de cliente.')
      return
    }

    const response = await fetch(
      '/api/cotizaciones/send-email',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cotizacion }),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      alert(result.error || 'No se pudo enviar el email.')
      return
    }

    alert('Cotización enviada por email correctamente.')

    if (cotizacion.estado === 'borrador') {
      await actualizarEstado(cotizacion, 'enviada')
    }
  }

  function imprimirCotizacion(cotizacion) {
    const itemsHtml = (cotizacion.items || [])
      .map(
        (item) => `
          <tr>
            <td>${item.descripcion}</td>
            <td>${item.cantidad}</td>
            <td>${formatCurrency(item.precio_unitario)}</td>
            <td>${formatCurrency(
              Number(item.cantidad) *
                Number(item.precio_unitario)
            )}</td>
          </tr>
        `
      )
      .join('')

    const popup = window.open('', '_blank')

    if (!popup) {
      alert('Permite ventanas emergentes para imprimir.')
      return
    }

    popup.document.write(`
      <html>
        <head>
          <title>${cotizacion.numero}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #2e2e2e;
              padding: 40px;
            }

            h1 {
              color: #7a0000;
              margin-bottom: 8px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 30px;
            }

            th, td {
              border-bottom: 1px solid #ead7d7;
              padding: 12px;
              text-align: left;
            }

            th {
              background: #f8eeee;
              color: #7a0000;
            }

            .totals {
              margin-top: 24px;
              margin-left: auto;
              width: 300px;
            }

            .totals p {
              display: flex;
              justify-content: space-between;
            }

            .total {
              color: #7a0000;
              font-size: 20px;
              font-weight: bold;
            }
          </style>
        </head>

        <body>
          <p style="letter-spacing:2px;color:#b07a7a;font-size:12px;">
            LA CASA DE LAS FRESAS
          </p>

          <h1>Cotización ${cotizacion.numero}</h1>

          <p><strong>Cliente:</strong> ${cotizacion.cliente_nombre}</p>
          <p><strong>Fecha:</strong> ${formatDate(cotizacion.fecha)}</p>
          <p><strong>Válida hasta:</strong> ${formatDate(
            cotizacion.valida_hasta
          )}</p>

          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals">
            <p><span>Subtotal</span><strong>${formatCurrency(
              cotizacion.subtotal
            )}</strong></p>
            <p><span>Descuento</span><strong>${formatCurrency(
              cotizacion.descuento
            )}</strong></p>
            <p><span>ITBMS</span><strong>${formatCurrency(
              cotizacion.impuesto
            )}</strong></p>
            <p class="total"><span>Total</span><strong>${formatCurrency(
              cotizacion.total
            )}</strong></p>
          </div>

          ${
            cotizacion.notas
              ? `<p style="margin-top:35px;"><strong>Notas:</strong><br/>${cotizacion.notas}</p>`
              : ''
          }

          <script>
            window.onload = () => window.print()
          </script>
        </body>
      </html>
    `)

    popup.document.close()
  }

  return (
    <main className="min-h-screen bg-[#fcf8f8] w-full">
<header className="bg-white border-b border-[#f1dede] px-5 md:px-8 py-3 md:py-3">
  <div className="max-w-[1500px] mx-auto">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="text-left">
        <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
          Operación comercial
        </p>

        <h1 className="mt-1 text-[21px] md:text-[23px] font-bold text-[#7a0000] leading-tight">
          Cotizaciones
        </h1>

        <p className="mt-1 text-xs md:text-sm text-[#b07a7a]">
          Crea propuestas, compártelas y gestiona su seguimiento.
        </p>
      </div>

      <div className="w-full lg:w-auto">
        <button
          type="button"
          onClick={openCreateForm}
          className="w-full sm:w-auto bg-[#8c0303] text-white px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm whitespace-nowrap shadow-sm"
        >
          <Plus size={16} />
          Nueva cotización
        </button>
      </div>
    </div>
  </div>
</header>

      <section className="px-4 md:px-8 py-5 md:py-7 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Total"
            value={cotizaciones.length}
            icon={FileText}
          />

          <StatCard
            label="Enviadas"
            value={totalEnviadas}
            icon={Send}
          />

          <StatCard
            label="Aceptadas"
            value={totalAceptadas}
            icon={CheckCircle2}
          />

          <StatCard
            label="Monto cotizado"
            value={formatCurrency(montoCotizado)}
            icon={DollarSign}
          />
        </div>

        <div className="mt-5 md:mt-6 bg-white border border-[#f3dede] rounded-[28px] overflow-hidden">
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
                  Buscar cotizaciones
                </p>

                <p className="text-sm text-[#b07a7a] mt-1">
                  {cotizacionesFiltradas.length} resultados visibles
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
            <div className="border-t border-[#f3dede] p-5 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
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
                      placeholder="Cliente, número o email..."
                      className="w-full bg-transparent outline-none text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
                    Estado
                  </label>

                  <select
                    value={estadoFiltro}
                    onChange={(event) =>
                      setEstadoFiltro(event.target.value)
                    }
                    className="w-full px-4 py-3 rounded-xl border border-[#efcccc] bg-white outline-none text-sm"
                  >
                    <option>Todos</option>
                    <option value="borrador">Borrador</option>
                    <option value="enviada">Enviada</option>
                    <option value="aceptada">Aceptada</option>
                    <option value="rechazada">Rechazada</option>
                    <option value="vencida">Vencida</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={limpiarFiltros}
                className="mt-4 px-4 py-2 rounded-full bg-[#8c0303] text-white text-sm font-semibold"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        <section className="mt-5 md:mt-6 bg-white border border-[#f3dede] rounded-[28px] overflow-hidden">
          <div className="px-5 md:px-6 py-5 border-b border-[#f3dede]">
            <h2 className="text-[28px] md:text-[32px] ivy text-[#7a0000] leading-none">
              Historial de cotizaciones
            </h2>

            <p className="text-sm text-[#b07a7a] mt-2">
              Consulta, comparte y actualiza el estado de cada propuesta.
            </p>
          </div>

          <div className="md:hidden divide-y divide-[#f3dede]">
            {loading ? (
              <div className="px-5 py-10 text-center text-[#b07a7a]">
                Cargando cotizaciones...
              </div>
            ) : cotizacionesFiltradas.length === 0 ? (
              <div className="px-5 py-10 text-center text-[#b07a7a]">
                No hay cotizaciones registradas.
              </div>
            ) : (
              cotizacionesFiltradas.map((cotizacion) => (
                <article key={cotizacion.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#8c0303]">
                        {cotizacion.numero}
                      </p>

                      <h3 className="text-[24px] ivy text-[#7a0000] mt-2 leading-tight break-words">
                        {cotizacion.cliente_nombre}
                      </h3>

                      <p className="text-sm text-[#b07a7a] mt-2">
                        {formatDate(cotizacion.fecha)}
                      </p>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${getStatusStyles(
                        cotizacion.estado
                      )}`}
                    >
                      {getStatusLabel(cotizacion.estado)}
                    </span>
                  </div>

                  <div className="mt-4 rounded-2xl bg-[#fffafa] p-4">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#b9a0a0]">
                      Total cotizado
                    </p>

                    <p className="text-[28px] ivy text-[#8c0303] mt-2">
                      {formatCurrency(cotizacion.total)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedQuote(cotizacion)}
                    className="w-full mt-4 py-3 rounded-xl border border-[#efcccc] text-[#8c0303] font-semibold flex items-center justify-center gap-2"
                  >
                    <Eye size={17} />
                    Ver cotización
                  </button>
                </article>
              ))
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-[1000px] w-full text-sm">
              <thead className="bg-[#f8eeee] text-[#b07a7a] uppercase text-[11px] tracking-[0.15em]">
                <tr>
                  <th className="py-4 px-5 text-left">Número</th>
                  <th className="py-4 px-5 text-left">Cliente</th>
                  <th className="py-4 px-5 text-left">Fecha</th>
                  <th className="py-4 px-5 text-left">Vigencia</th>
                  <th className="py-4 px-5 text-left">Estado</th>
                  <th className="py-4 px-5 text-right">Total</th>
                  <th className="py-4 px-5 text-right">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="py-10 text-center text-[#b07a7a]"
                    >
                      Cargando cotizaciones...
                    </td>
                  </tr>
                ) : cotizacionesFiltradas.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="py-10 text-center text-[#b07a7a]"
                    >
                      No hay cotizaciones registradas.
                    </td>
                  </tr>
                ) : (
                  cotizacionesFiltradas.map((cotizacion) => (
                    <tr
                      key={cotizacion.id}
                      className="border-t border-[#f3dede] hover:bg-[#fffafa]"
                    >
                      <td className="px-5 py-4 font-semibold text-[#8c0303]">
                        {cotizacion.numero}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#2e2e2e]">
                          {cotizacion.cliente_nombre}
                        </p>

                        <p className="text-xs text-[#b07a7a] mt-1">
                          {cotizacion.cliente_email ||
                            cotizacion.cliente_whatsapp ||
                            'Sin contacto'}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        {formatDate(cotizacion.fecha)}
                      </td>

                      <td className="px-5 py-4">
                        {formatDate(cotizacion.valida_hasta)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyles(
                            cotizacion.estado
                          )}`}
                        >
                          {getStatusLabel(cotizacion.estado)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right font-semibold text-[#8c0303]">
                        {formatCurrency(cotizacion.total)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedQuote(cotizacion)}
                          className="w-10 h-10 rounded-xl border border-[#efcccc] text-[#8c0303] hover:bg-[#fff5f5] inline-flex items-center justify-center"
                          title="Ver cotización"
                        >
                          <Eye size={17} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      {showForm && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-end md:items-center justify-center">
          <div className="bg-white w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-t-[30px] md:rounded-[30px] border border-[#f3dede]">
            <div className="sticky top-0 z-10 bg-white border-b border-[#f3dede] px-5 md:px-7 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-[30px] ivy text-[#7a0000] leading-none">
                  Nueva cotización
                </h2>

                <p className="text-sm text-[#b07a7a] mt-2">
                  Crea una propuesta lista para enviar a tu cliente.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateForm}
                className="w-11 h-11 rounded-full border border-[#efcccc] text-[#8c0303] flex items-center justify-center"
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
                  <input
                    value={form.cliente_nombre}
                    onChange={(event) =>
                      updateForm('cliente_nombre', event.target.value)
                    }
                    placeholder="Nombre del cliente"
                    className="w-full px-4 py-3 rounded-xl border border-[#efcccc] outline-none"
                  />

                  <input
                    type="email"
                    value={form.cliente_email}
                    onChange={(event) =>
                      updateForm('cliente_email', event.target.value)
                    }
                    placeholder="Email del cliente"
                    className="w-full px-4 py-3 rounded-xl border border-[#efcccc] outline-none"
                  />

                  <input
                    value={form.cliente_whatsapp}
                    onChange={(event) =>
                      updateForm(
                        'cliente_whatsapp',
                        event.target.value
                      )
                    }
                    placeholder="WhatsApp del cliente"
                    className="w-full px-4 py-3 rounded-xl border border-[#efcccc] outline-none"
                  />
                </div>
              </div>

              <div className="border border-[#f3dede] rounded-2xl p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#8c0303]">
                    Productos o servicios
                  </p>

                  <button
                    type="button"
                    onClick={addItem}
                    className="text-sm font-semibold text-[#8c0303]"
                  >
                    + Agregar línea
                  </button>
                </div>

                <div className="space-y-4">
                  {form.items.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 md:grid-cols-[1fr_110px_150px_44px] gap-3 items-end"
                    >
                      <div>
                        <label className="text-xs text-[#b07a7a]">
                          Descripción
                        </label>

                        <input
                          value={item.descripcion}
                          onChange={(event) =>
                            updateItem(
                              index,
                              'descripcion',
                              event.target.value
                            )
                          }
                          placeholder="Ej. Snack bar para 30 invitados"
                          className="w-full mt-2 px-4 py-3 rounded-xl border border-[#efcccc] outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-[#b07a7a]">
                          Cantidad
                        </label>

                        <input
                          type="number"
                          min="1"
                          value={item.cantidad}
                          onChange={(event) =>
                            updateItem(
                              index,
                              'cantidad',
                              event.target.value
                            )
                          }
                          className="w-full mt-2 px-4 py-3 rounded-xl border border-[#efcccc] outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-[#b07a7a]">
                          Precio unitario
                        </label>

                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.precio_unitario}
                          onChange={(event) =>
                            updateItem(
                              index,
                              'precio_unitario',
                              event.target.value
                            )
                          }
                          placeholder="0.00"
                          className="w-full mt-2 px-4 py-3 rounded-xl border border-[#efcccc] outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="h-[48px] rounded-xl border border-red-200 text-red-600 flex items-center justify-center"
                        aria-label="Eliminar línea"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="border border-[#f3dede] rounded-2xl p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#8c0303] mb-4">
                    Vigencia y notas
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-[#b07a7a]">
                        Fecha
                      </label>

                      <input
                        type="date"
                        value={form.fecha}
                        onChange={(event) =>
                          updateForm('fecha', event.target.value)
                        }
                        className="w-full mt-2 px-4 py-3 rounded-xl border border-[#efcccc] outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-[#b07a7a]">
                        Válida hasta
                      </label>

                      <input
                        type="date"
                        value={form.valida_hasta}
                        onChange={(event) =>
                          updateForm(
                            'valida_hasta',
                            event.target.value
                          )
                        }
                        className="w-full mt-2 px-4 py-3 rounded-xl border border-[#efcccc] outline-none"
                      />
                    </div>
                  </div>

                  <textarea
                    value={form.notas}
                    onChange={(event) =>
                      updateForm('notas', event.target.value)
                    }
                    placeholder="Notas, condiciones, métodos de pago o términos de la cotización..."
                    rows={5}
                    className="w-full mt-4 px-4 py-3 rounded-xl border border-[#efcccc] outline-none resize-none"
                  />
                </div>

                <div className="bg-[#fffafa] border border-[#f3dede] rounded-2xl p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#8c0303] mb-4">
                    Resumen de cotización
                  </p>

                  <div className="space-y-3">
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-[#b07a7a]">Subtotal</span>
                      <strong>{formatCurrency(subtotal)}</strong>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.descuento}
                        onChange={(event) =>
                          updateForm('descuento', event.target.value)
                        }
                        placeholder="Descuento"
                        className="w-full px-3 py-2 rounded-xl border border-[#efcccc] outline-none text-sm"
                      />

                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.impuesto}
                        onChange={(event) =>
                          updateForm('impuesto', event.target.value)
                        }
                        placeholder="ITBMS"
                        className="w-full px-3 py-2 rounded-xl border border-[#efcccc] outline-none text-sm"
                      />
                    </div>

                    <div className="pt-4 border-t border-[#f3dede] flex justify-between gap-4">
                      <span className="text-[#7a0000] font-semibold">
                        Total
                      </span>

                      <strong className="text-[28px] ivy text-[#7a0000]">
                        {formatCurrency(total)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={closeCreateForm}
                  className="px-5 py-3 border border-[#efcccc] rounded-xl text-[#8c0303] font-semibold"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={guardarCotizacion}
                  className="px-5 py-3 bg-[#8c0303] text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  {saving
                    ? 'Guardando...'
                    : 'Guardar cotización'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedQuote && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-end md:items-center justify-center">
          <div className="bg-white w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-t-[30px] md:rounded-[30px] shadow-2xl">
            <div className="sticky top-0 z-10 bg-white border-b border-[#f3dede] px-5 md:px-7 py-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#b9a0a0]">
                  Cotización
                </p>

                <h2 className="text-[30px] ivy text-[#7a0000] leading-none mt-2">
                  {selectedQuote.numero}
                </h2>

                <p className="text-sm text-[#b07a7a] mt-2">
                  {selectedQuote.cliente_nombre}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedQuote(null)}
                className="w-11 h-11 rounded-full border border-[#efcccc] text-[#8c0303] flex items-center justify-center shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 md:p-7 space-y-5">
              <div className="flex flex-wrap gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyles(
                    selectedQuote.estado
                  )}`}
                >
                  {getStatusLabel(selectedQuote.estado)}
                </span>

                <span className="px-3 py-1 rounded-full bg-[#fff1f1] text-[#8c0303] text-xs">
                  Válida hasta {formatDate(selectedQuote.valida_hasta)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#fffafa] border border-[#f3dede] p-4">
                  <p className="text-xs uppercase tracking-[0.15em] text-[#b9a0a0]">
                    Email
                  </p>

                  <p className="text-sm text-[#2e2e2e] mt-2 break-all">
                    {selectedQuote.cliente_email || 'No registrado'}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#fffafa] border border-[#f3dede] p-4">
                  <p className="text-xs uppercase tracking-[0.15em] text-[#b9a0a0]">
                    WhatsApp
                  </p>

                  <p className="text-sm text-[#2e2e2e] mt-2">
                    {selectedQuote.cliente_whatsapp || 'No registrado'}
                  </p>
                </div>
              </div>

              <div className="border border-[#f3dede] rounded-2xl overflow-hidden">
                <div className="hidden sm:grid grid-cols-[1fr_100px_130px_130px] gap-3 bg-[#f8eeee] px-4 py-3 text-[10px] uppercase tracking-[0.14em] text-[#b07a7a]">
                  <span>Descripción</span>
                  <span>Cantidad</span>
                  <span>Precio</span>
                  <span className="text-right">Total</span>
                </div>

                <div className="divide-y divide-[#f3dede]">
                  {(selectedQuote.items || []).map((item, index) => {
                    const itemTotal =
                      Number(item.cantidad || 0) *
                      Number(item.precio_unitario || 0)

                    return (
                      <div
                        key={index}
                        className="grid grid-cols-1 sm:grid-cols-[1fr_100px_130px_130px] gap-2 sm:gap-3 px-4 py-4"
                      >
                        <p className="font-semibold text-[#2e2e2e]">
                          {item.descripcion}
                        </p>

                        <p className="text-sm text-[#b07a7a]">
                          {item.cantidad} unidad(es)
                        </p>

                        <p className="text-sm text-[#2e2e2e]">
                          {formatCurrency(item.precio_unitario)}
                        </p>

                        <p className="font-semibold text-[#8c0303] sm:text-right">
                          {formatCurrency(itemTotal)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="ml-auto max-w-[320px] rounded-2xl bg-[#fffafa] border border-[#f3dede] p-5 space-y-3">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-[#b07a7a]">Subtotal</span>
                  <strong>
                    {formatCurrency(selectedQuote.subtotal)}
                  </strong>
                </div>

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-[#b07a7a]">Descuento</span>
                  <strong>
                    {formatCurrency(selectedQuote.descuento)}
                  </strong>
                </div>

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-[#b07a7a]">ITBMS</span>
                  <strong>
                    {formatCurrency(selectedQuote.impuesto)}
                  </strong>
                </div>

                <div className="pt-3 border-t border-[#f3dede] flex justify-between gap-4">
                  <span className="font-semibold text-[#7a0000]">
                    Total
                  </span>

                  <strong className="text-[28px] ivy text-[#7a0000]">
                    {formatCurrency(selectedQuote.total)}
                  </strong>
                </div>
              </div>

              {selectedQuote.notas && (
                <div className="rounded-2xl bg-[#fffafa] border border-[#f3dede] p-5">
                  <p className="text-xs uppercase tracking-[0.15em] text-[#b9a0a0]">
                    Notas
                  </p>

                  <p className="text-sm text-[#2e2e2e] leading-relaxed mt-2">
                    {selectedQuote.notas}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => enviarEmail(selectedQuote)}
                    className="py-3 rounded-xl border border-[#efcccc] text-[#8c0303] font-semibold flex items-center justify-center gap-2"
                  >
                    <Mail size={17} />
                    Email
                  </button>

                  <button
                    type="button"
                    onClick={() => abrirWhatsApp(selectedQuote)}
                    className="py-3 rounded-xl border border-[#efcccc] text-[#8c0303] font-semibold flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={17} />
                    WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={() => imprimirCotizacion(selectedQuote)}
                    className="py-3 rounded-xl border border-[#efcccc] text-[#8c0303] font-semibold flex items-center justify-center gap-2"
                  >
                    <Printer size={17} />
                    Imprimir
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedQuote(null)}
                    className="py-3 rounded-xl border border-[#efcccc] text-[#8c0303] font-semibold"
                  >
                    Cerrar
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      actualizarEstado(selectedQuote, 'borrador')
                    }
                    className="py-3 rounded-xl border border-[#efcccc] text-[#8c0303] text-sm font-semibold"
                  >
                    Borrador
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      actualizarEstado(selectedQuote, 'enviada')
                    }
                    className="py-3 rounded-xl border border-blue-200 text-blue-700 text-sm font-semibold"
                  >
                    Enviada
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      actualizarEstado(selectedQuote, 'aceptada')
                    }
                    className="py-3 rounded-xl border border-emerald-200 text-emerald-700 text-sm font-semibold"
                  >
                    Aceptada
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      actualizarEstado(selectedQuote, 'rechazada')
                    }
                    className="py-3 rounded-xl border border-red-200 text-red-700 text-sm font-semibold"
                  >
                    Rechazada
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}