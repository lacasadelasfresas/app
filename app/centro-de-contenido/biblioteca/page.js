'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardPenLine,
  Eye,
  FileText,
  Film,
  FolderOpen,
  Link2,
  MessageCircle,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

const ESTADOS = [
  'Idea',
  'Planificado',
  'En producción',
  'Pendiente de aprobación',
  'Listo para publicar',
  'Programado',
  'Publicado',
  'Archivado',
]

const PRIORIDADES = ['Alta', 'Media', 'Baja']

const PLATAFORMAS = [
  'Instagram',
  'TikTok',
  'Facebook',
  'WhatsApp',
  'PedidosYa',
]

const FORMATOS = [
  'Reel',
  'Historia',
  'Carrusel',
  'Post estático',
  'Foto',
  'Video',
  'Promoción',
  'Testimonio',
  'Live',
  'Otro',
]

const PILARES = [
  'Producto',
  'Promoción',
  'Educación',
  'Detrás de cámaras',
  'Eventos y bazares',
  'Clientes y testimonios',
  'Marca',
  'Temporada',
  'Ventas',
]

function createEmptyForm() {
  return {
    titulo: '',
    descripcion: '',
    plataformas: [],
    formato: '',
    pilar: '',
    estado: 'Idea',
    prioridad: 'Media',
    fecha_programada: '',
    fecha_publicada: '',
    copy: '',
    cta: '',
    producto_relacionado: '',
    campana_relacionada: '',
    evento_relacionado: '',
    canal_venta: '',
    enlace_canva: '',
    enlace_drive: '',
    enlace_publicado: '',
    responsable: '',
    notas: '',
    alcance: '',
    reproducciones: '',
    likes: '',
    comentarios: '',
    guardados: '',
    compartidos: '',
    mensajes_recibidos: '',
    pedidos_generados: '',
    ingresos_generados: '',
  }
}

function toInputDateTime(value) {
  if (!value) return ''

  const date = new Date(value)
  const timezoneOffset = date.getTimezoneOffset() * 60000

  return new Date(date.getTime() - timezoneOffset)
    .toISOString()
    .slice(0, 16)
}

function formatDate(value) {
  if (!value) return 'Sin fecha'

  return new Intl.DateTimeFormat('es-PA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function getStatusStyle(status) {
  const styles = {
    Idea: 'bg-[#fff4db] text-[#9c6500]',
    Planificado: 'bg-[#edf5ff] text-[#2563a8]',
    'En producción': 'bg-[#fff1f1] text-[#8c0303]',
    'Pendiente de aprobación': 'bg-[#f5edff] text-[#7442a3]',
    'Listo para publicar': 'bg-[#edf9f3] text-[#17724e]',
    Programado: 'bg-[#eef7ff] text-[#1f6ea4]',
    Publicado: 'bg-[#eaf9f0] text-[#157347]',
    Archivado: 'bg-[#f2f2f2] text-[#707070]',
  }

  return styles[status] || 'bg-[#f4f4f4] text-[#666]'
}

function getPriorityStyle(priority) {
  const styles = {
    Alta: 'bg-red-50 text-red-600',
    Media: 'bg-amber-50 text-amber-700',
    Baja: 'bg-emerald-50 text-emerald-700',
  }

  return styles[priority] || 'bg-[#f4f4f4] text-[#666]'
}

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`
}

export default function BibliotecaContenidoPage() {
  const [contenido, setContenido] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [formOpen, setFormOpen] = useState(false)

  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState('Todos')
  const [filterPlataforma, setFilterPlataforma] = useState('Todos')
  const [filterFormato, setFilterFormato] = useState('Todos')

  const [form, setForm] = useState(createEmptyForm())

useEffect(() => {
  fetchContenido()

  const params = new URLSearchParams(window.location.search)

  if (params.get('nuevo') === '1') {
    setEditingId(null)
    setForm(createEmptyForm())
    setFormOpen(true)

    window.history.replaceState(
      {},
      '',
      '/centro-de-contenido/biblioteca'
    )
  }
}, [])

  async function fetchContenido() {
    setLoading(true)

    const { data, error } = await supabase
      .from('contenido')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error cargando contenido:', error)
      alert('No se pudo cargar la Biblioteca de Contenido.')
      setLoading(false)
      return
    }

    setContenido(data || [])
    setLoading(false)
  }

  function resetForm() {
    setEditingId(null)
    setForm(createEmptyForm())
    setFormOpen(false)
  }

  function handleChange(event) {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  function togglePlatform(platform) {
    setForm((previous) => {
      const exists = previous.plataformas.includes(platform)

      return {
        ...previous,
        plataformas: exists
          ? previous.plataformas.filter((item) => item !== platform)
          : [...previous.plataformas, platform],
      }
    })
  }

  function editarContenido(item) {
    setEditingId(item.id)

    setForm({
      titulo: item.titulo || '',
      descripcion: item.descripcion || '',
      plataformas: item.plataformas || [],
      formato: item.formato || '',
      pilar: item.pilar || '',
      estado: item.estado || 'Idea',
      prioridad: item.prioridad || 'Media',
      fecha_programada: toInputDateTime(item.fecha_programada),
      fecha_publicada: toInputDateTime(item.fecha_publicada),
      copy: item.copy || '',
      cta: item.cta || '',
      producto_relacionado: item.producto_relacionado || '',
      campana_relacionada: item.campana_relacionada || '',
      evento_relacionado: item.evento_relacionado || '',
      canal_venta: item.canal_venta || '',
      enlace_canva: item.enlace_canva || '',
      enlace_drive: item.enlace_drive || '',
      enlace_publicado: item.enlace_publicado || '',
      responsable: item.responsable || '',
      notas: item.notas || '',
      alcance: item.alcance ?? '',
      reproducciones: item.reproducciones ?? '',
      likes: item.likes ?? '',
      comentarios: item.comentarios ?? '',
      guardados: item.guardados ?? '',
      compartidos: item.compartidos ?? '',
      mensajes_recibidos: item.mensajes_recibidos ?? '',
      pedidos_generados: item.pedidos_generados ?? '',
      ingresos_generados: item.ingresos_generados ?? '',
    })

    setFormOpen(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  async function guardarContenido() {
    if (!form.titulo.trim()) {
      alert('El título interno es obligatorio.')
      return
    }

    setSaving(true)

    const payload = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim() || null,
      plataformas: form.plataformas,
      formato: form.formato || null,
      pilar: form.pilar || null,
      estado: form.estado,
      prioridad: form.prioridad,
      fecha_programada: form.fecha_programada
        ? new Date(form.fecha_programada).toISOString()
        : null,
      fecha_publicada: form.fecha_publicada
        ? new Date(form.fecha_publicada).toISOString()
        : null,
      copy: form.copy.trim() || null,
      cta: form.cta.trim() || null,
      producto_relacionado: form.producto_relacionado.trim() || null,
      campana_relacionada: form.campana_relacionada.trim() || null,
      evento_relacionado: form.evento_relacionado.trim() || null,
      canal_venta: form.canal_venta.trim() || null,
      enlace_canva: form.enlace_canva.trim() || null,
      enlace_drive: form.enlace_drive.trim() || null,
      enlace_publicado: form.enlace_publicado.trim() || null,
      responsable: form.responsable.trim() || null,
      notas: form.notas.trim() || null,
      alcance: Number(form.alcance || 0),
      reproducciones: Number(form.reproducciones || 0),
      likes: Number(form.likes || 0),
      comentarios: Number(form.comentarios || 0),
      guardados: Number(form.guardados || 0),
      compartidos: Number(form.compartidos || 0),
      mensajes_recibidos: Number(form.mensajes_recibidos || 0),
      pedidos_generados: Number(form.pedidos_generados || 0),
      ingresos_generados: Number(form.ingresos_generados || 0),
      updated_at: new Date().toISOString(),
    }

    const { error } = editingId
      ? await supabase
          .from('contenido')
          .update(payload)
          .eq('id', editingId)
      : await supabase.from('contenido').insert([payload])

    if (error) {
      console.error('Error guardando contenido:', error)
      alert('No se pudo guardar el contenido.')
      setSaving(false)
      return
    }

    await fetchContenido()
    resetForm()
    setSaving(false)

    alert(
      editingId
        ? 'Contenido actualizado correctamente.'
        : 'Contenido creado correctamente.'
    )
  }

  async function eliminarContenido(id, titulo) {
    const confirmar = confirm(
      `¿Deseas eliminar "${titulo}"? Esta acción no se puede deshacer.`
    )

    if (!confirmar) return

    setDeletingId(id)

    const { error } = await supabase
      .from('contenido')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error eliminando contenido:', error)
      alert('No se pudo eliminar el contenido.')
      setDeletingId(null)
      return
    }

    await fetchContenido()
    setDeletingId(null)
  }

  const filteredContent = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return contenido.filter((item) => {
      const text = `
        ${item.titulo || ''}
        ${item.descripcion || ''}
        ${item.formato || ''}
        ${item.pilar || ''}
        ${item.producto_relacionado || ''}
        ${item.campana_relacionada || ''}
        ${item.evento_relacionado || ''}
        ${item.responsable || ''}
      `.toLowerCase()

      const matchesSearch =
        !normalizedSearch || text.includes(normalizedSearch)

      const matchesEstado =
        filterEstado === 'Todos' || item.estado === filterEstado

      const matchesPlataforma =
        filterPlataforma === 'Todos' ||
        item.plataformas?.includes(filterPlataforma)

      const matchesFormato =
        filterFormato === 'Todos' || item.formato === filterFormato

      return (
        matchesSearch &&
        matchesEstado &&
        matchesPlataforma &&
        matchesFormato
      )
    })
  }, [
    contenido,
    search,
    filterEstado,
    filterPlataforma,
    filterFormato,
  ])

  const inputClass =
    'w-full rounded-xl border border-[#efcaca] bg-white px-4 py-3 text-sm text-[#2e2e2e] outline-none transition focus:border-[#8c0303] focus:ring-2 focus:ring-[#fff1f1]'

  return (
    <main className="min-h-screen bg-[#fcf8f8]">
      <header className="bg-white border-b border-[#f1dede] px-5 md:px-8 py-3 md:h-[82px] md:py-0 md:flex md:items-center">
        <div className="w-full max-w-none">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
                Marketing y contenido
              </p>

              <h1 className="mt-1 text-[21px] md:text-[23px] font-bold text-[#7a0000] leading-tight">
                Biblioteca de Contenido
              </h1>

              <p className="mt-1 text-xs md:text-sm text-[#b07a7a]">
                Crea, organiza y administra cada pieza de contenido de la marca.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <Link
                href="/centro-de-contenido"
                className="w-full sm:w-auto h-10 px-4 rounded-xl border border-[#efcccc] bg-white text-[#8c0303] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#fff5f5]"
              >
                <ArrowLeft size={16} />
                Dashboard
              </Link>

              <button
                type="button"
                onClick={() => {
                  setFormOpen(true)
                  setEditingId(null)
                  setForm(createEmptyForm())
                }}
                className="w-full sm:w-auto h-10 px-4 rounded-xl bg-[#8c0303] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#720000]"
              >
                <Plus size={16} />
                Nuevo contenido
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="max-w-[1500px] mx-auto px-4 md:px-8 py-5 md:py-7 space-y-5">
        {formOpen && (
          <section className="bg-white border border-[#f3dede] rounded-[26px] p-5 md:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#fff1f1] text-[#8c0303] flex items-center justify-center shrink-0">
                  <ClipboardPenLine size={19} />
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
                    {editingId ? 'Editar contenido' : 'Nueva pieza'}
                  </p>

                  <h2 className="mt-1 text-[20px] font-bold text-[#7a0000]">
                    {editingId
                      ? 'Actualiza la información de esta publicación'
                      : 'Registra una nueva idea o publicación'}
                  </h2>

                  <p className="mt-1 text-sm text-[#b07a7a]">
                    Completa solo los campos que necesites ahora. Podrás
                    actualizar el resto después.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="w-full sm:w-auto h-10 px-4 rounded-xl border border-[#efcccc] text-[#8c0303] text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#fff5f5]"
              >
                <X size={16} />
                Cerrar
              </button>
            </div>

            <div className="mt-7">
              <SectionTitle
                icon={<FileText size={17} />}
                title="Información principal"
                description="Define qué contenido es, para qué sirve y en qué etapa se encuentra."
              />

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
                <Field label="Título interno *">
                  <input
                    name="titulo"
                    value={form.titulo}
                    onChange={handleChange}
                    placeholder="Ej. Reel: fresas con brownie"
                    className={inputClass}
                  />
                </Field>

                <Field label="Formato">
                  <select
                    name="formato"
                    value={form.formato}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="">Seleccionar formato...</option>
                    {FORMATOS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Pilar de contenido">
                  <select
                    name="pilar"
                    value={form.pilar}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="">Seleccionar pilar...</option>
                    {PILARES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Estado">
                  <select
                    name="estado"
                    value={form.estado}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    {ESTADOS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Prioridad">
                  <select
                    name="prioridad"
                    value={form.prioridad}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    {PRIORIDADES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Responsable">
                  <input
                    name="responsable"
                    value={form.responsable}
                    onChange={handleChange}
                    placeholder="Ej. Nathalie"
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="mt-4">
                <Field label="Descripción o enfoque">
                  <textarea
                    name="descripcion"
                    value={form.descripcion}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Resume la idea, ángulo creativo o mensaje central."
                    className={`${inputClass} resize-none`}
                  />
                </Field>
              </div>

              <div className="mt-5">
                <p className="text-xs font-medium text-[#b07a7a] mb-2">
                  Plataformas
                </p>

                <div className="flex flex-wrap gap-2">
                  {PLATAFORMAS.map((platform) => {
                    const selected = form.plataformas.includes(platform)

                    return (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => togglePlatform(platform)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold border transition flex items-center gap-2 ${
                          selected
                            ? 'bg-[#8c0303] border-[#8c0303] text-white'
                            : 'bg-white border-[#efcccc] text-[#8c0303] hover:bg-[#fff5f5]'
                        }`}
                      >
                        {selected && <Check size={14} />}
                        {platform}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-7 border-t border-[#f3dede]">
              <SectionTitle
                icon={<CalendarDays size={17} />}
                title="Planificación comercial"
                description="Relaciona el contenido con el producto, campaña, evento o canal de venta."
              />

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
                <Field label="Fecha programada">
                  <input
                    type="datetime-local"
                    name="fecha_programada"
                    value={form.fecha_programada}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </Field>

                <Field label="Fecha publicada">
                  <input
                    type="datetime-local"
                    name="fecha_publicada"
                    value={form.fecha_publicada}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </Field>

                <Field label="Canal de venta">
                  <input
                    name="canal_venta"
                    value={form.canal_venta}
                    onChange={handleChange}
                    placeholder="Ej. WhatsApp, PedidosYa, delivery..."
                    className={inputClass}
                  />
                </Field>

                <Field label="Producto relacionado">
                  <input
                    name="producto_relacionado"
                    value={form.producto_relacionado}
                    onChange={handleChange}
                    placeholder="Ej. Fresas con crema"
                    className={inputClass}
                  />
                </Field>

                <Field label="Campaña relacionada">
                  <input
                    name="campana_relacionada"
                    value={form.campana_relacionada}
                    onChange={handleChange}
                    placeholder="Ej. Día del Padre"
                    className={inputClass}
                  />
                </Field>

                <Field label="Evento o bazar">
                  <input
                    name="evento_relacionado"
                    value={form.evento_relacionado}
                    onChange={handleChange}
                    placeholder="Ej. Northside Galleries"
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>

            <div className="mt-8 pt-7 border-t border-[#f3dede]">
              <SectionTitle
                icon={<Film size={17} />}
                title="Copy, CTA y recursos"
                description="Guarda la información que necesitas para producir o publicar sin buscarla después."
              />

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-5">
                <Field label="Copy o guion">
                  <textarea
                    name="copy"
                    value={form.copy}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Escribe aquí el copy, texto del carrusel, guion del reel o instrucciones para la pieza."
                    className={`${inputClass} resize-none`}
                  />
                </Field>

                <div className="space-y-4">
                  <Field label="CTA">
                    <input
                      name="cta"
                      value={form.cta}
                      onChange={handleChange}
                      placeholder="Ej. Ordena por WhatsApp"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Enlace de Canva">
                    <input
                      name="enlace_canva"
                      value={form.enlace_canva}
                      onChange={handleChange}
                      placeholder="https://www.canva.com/..."
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Enlace de Drive o archivos">
                    <input
                      name="enlace_drive"
                      value={form.enlace_drive}
                      onChange={handleChange}
                      placeholder="https://drive.google.com/..."
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Enlace publicado">
                    <input
                      name="enlace_publicado"
                      value={form.enlace_publicado}
                      onChange={handleChange}
                      placeholder="https://instagram.com/..."
                      className={inputClass}
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-4">
                <Field label="Notas internas">
                  <textarea
                    name="notas"
                    value={form.notas}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Comentarios de producción, pendientes, referencias, observaciones o aprendizajes."
                    className={`${inputClass} resize-none`}
                  />
                </Field>
              </div>
            </div>

            <div className="mt-8 pt-7 border-t border-[#f3dede]">
              <SectionTitle
                icon={<Eye size={17} />}
                title="Métricas y resultados"
                description="Completa estos datos después de publicar para identificar qué contenido genera ventas."
              />

              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mt-5">
                <MetricInput
                  label="Alcance"
                  name="alcance"
                  value={form.alcance}
                  onChange={handleChange}
                />

                <MetricInput
                  label="Reproducciones"
                  name="reproducciones"
                  value={form.reproducciones}
                  onChange={handleChange}
                />

                <MetricInput
                  label="Likes"
                  name="likes"
                  value={form.likes}
                  onChange={handleChange}
                />

                <MetricInput
                  label="Comentarios"
                  name="comentarios"
                  value={form.comentarios}
                  onChange={handleChange}
                />

                <MetricInput
                  label="Guardados"
                  name="guardados"
                  value={form.guardados}
                  onChange={handleChange}
                />

                <MetricInput
                  label="Compartidos"
                  name="compartidos"
                  value={form.compartidos}
                  onChange={handleChange}
                />

                <MetricInput
                  label="Mensajes"
                  name="mensajes_recibidos"
                  value={form.mensajes_recibidos}
                  onChange={handleChange}
                />

                <MetricInput
                  label="Pedidos"
                  name="pedidos_generados"
                  value={form.pedidos_generados}
                  onChange={handleChange}
                />

                <MetricInput
                  label="Ingresos generados"
                  name="ingresos_generados"
                  value={form.ingresos_generados}
                  onChange={handleChange}
                  step="0.01"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-8 pt-6 border-t border-[#f3dede]">
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-[#efcccc] text-[#8c0303] text-sm font-semibold hover:bg-[#fff5f5] disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={guardarContenido}
                disabled={saving}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#8c0303] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#720000] disabled:opacity-60"
              >
                <Save size={17} />
                {saving
                  ? 'Guardando...'
                  : editingId
                    ? 'Guardar cambios'
                    : 'Guardar contenido'}
              </button>
            </div>
          </section>
        )}

        <section className="bg-white border border-[#f3dede] rounded-[26px] overflow-hidden">
          <div className="p-5 md:p-6 border-b border-[#f3dede]">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
                    Biblioteca
                  </p>

                  <h2 className="mt-1 text-[20px] md:text-[23px] font-bold text-[#7a0000]">
                    Todo el contenido
                  </h2>

                  <p className="mt-1 text-sm text-[#b07a7a]">
                    {filteredContent.length} pieza(s) según los filtros actuales.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fetchContenido}
                  disabled={loading}
                  className="w-full lg:w-auto h-10 px-4 rounded-xl border border-[#efcccc] bg-white text-[#8c0303] text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#fff5f5] disabled:opacity-60"
                >
                  <RefreshCw
                    size={16}
                    className={loading ? 'animate-spin' : ''}
                  />
                  Actualizar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 h-[46px] border border-[#efcccc] rounded-xl px-4 bg-[#fffafa] focus-within:border-[#8c0303] focus-within:ring-2 focus-within:ring-[#fff1f1]">
                  <Search size={17} className="text-[#b07a7a] shrink-0" />

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar contenido..."
                    className="w-full bg-transparent outline-none text-sm text-[#2e2e2e]"
                  />
                </div>

                <select
                  value={filterEstado}
                  onChange={(event) => setFilterEstado(event.target.value)}
                  className={inputClass}
                >
                  <option value="Todos">Todos los estados</option>
                  {ESTADOS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <select
                  value={filterPlataforma}
                  onChange={(event) =>
                    setFilterPlataforma(event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="Todos">Todas las plataformas</option>
                  {PLATAFORMAS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <select
                  value={filterFormato}
                  onChange={(event) => setFilterFormato(event.target.value)}
                  className={inputClass}
                >
                  <option value="Todos">Todos los formatos</option>
                  {FORMATOS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="md:hidden divide-y divide-[#f3dede]">
            {loading ? (
              <EmptyState text="Cargando contenido..." />
            ) : filteredContent.length === 0 ? (
              <EmptyState text="No hay contenido registrado con estos filtros." />
            ) : (
              filteredContent.map((item) => (
                <article key={item.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[17px] font-bold text-[#7a0000] break-words">
                        {item.titulo}
                      </p>

                      <p className="mt-1 text-sm text-[#b07a7a] break-words">
                        {item.plataformas?.join(' · ') || 'Sin plataforma'}
                        {item.formato ? ` · ${item.formato}` : ''}
                      </p>
                    </div>

                    <span
                      className={`${getStatusStyle(
                        item.estado
                      )} px-3 py-1 rounded-full text-xs font-semibold shrink-0`}
                    >
                      {item.estado}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <SmallInfo
                      label="Prioridad"
                      value={item.prioridad || 'Media'}
                      badgeClass={getPriorityStyle(item.prioridad)}
                    />

                    <SmallInfo
                      label="Fecha"
                      value={
                        item.fecha_programada
                          ? formatDate(item.fecha_programada)
                          : 'Sin fecha'
                      }
                    />
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => editarContenido(item)}
                      className="flex-1 rounded-xl border border-[#efcccc] text-[#8c0303] py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#fff5f5]"
                    >
                      <Pencil size={16} />
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => eliminarContenido(item.id, item.titulo)}
                      disabled={deletingId === item.id}
                      className="w-12 rounded-xl border border-red-200 text-red-600 flex items-center justify-center hover:bg-red-50 disabled:opacity-50"
                      aria-label={`Eliminar ${item.titulo}`}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-[1120px] w-full text-sm">
              <thead className="bg-[#f8eeee] text-[#b07a7a] uppercase text-[11px] tracking-[0.14em]">
                <tr>
                  <th className="py-4 px-5 text-left">Contenido</th>
                  <th className="py-4 px-5 text-left">Plataforma</th>
                  <th className="py-4 px-5 text-left">Formato</th>
                  <th className="py-4 px-5 text-left">Estado</th>
                  <th className="py-4 px-5 text-left">Fecha</th>
                  <th className="py-4 px-5 text-right">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="py-10 text-center text-[#b07a7a]"
                    >
                      Cargando contenido...
                    </td>
                  </tr>
                ) : filteredContent.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="py-10 text-center text-[#b07a7a]"
                    >
                      No hay contenido registrado con estos filtros.
                    </td>
                  </tr>
                ) : (
                  filteredContent.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[#f3dede] hover:bg-[#fffafa]"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-[#fff1f1] text-[#8c0303] flex items-center justify-center shrink-0">
                            <FolderOpen size={17} />
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold text-[#2e2e2e]">
                              {item.titulo}
                            </p>

                            <p className="mt-1 text-xs text-[#b07a7a]">
                              {item.producto_relacionado ||
                                item.campana_relacionada ||
                                item.pilar ||
                                'Sin relación comercial'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5 text-[#2e2e2e]">
                        {item.plataformas?.join(' · ') || '—'}
                      </td>

                      <td className="py-4 px-5 text-[#2e2e2e]">
                        {item.formato || '—'}
                      </td>

                      <td className="py-4 px-5">
                        <span
                          className={`${getStatusStyle(
                            item.estado
                          )} px-3 py-1 rounded-full text-xs font-semibold`}
                        >
                          {item.estado}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-[#2e2e2e]">
                        {item.fecha_programada
                          ? formatDate(item.fecha_programada)
                          : 'Sin fecha'}
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => editarContenido(item)}
                            className="w-9 h-9 rounded-xl border border-[#efcccc] text-[#8c0303] flex items-center justify-center hover:bg-[#fff5f5]"
                            title="Editar contenido"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              eliminarContenido(item.id, item.titulo)
                            }
                            disabled={deletingId === item.id}
                            className="w-9 h-9 rounded-xl border border-red-200 text-red-600 flex items-center justify-center hover:bg-red-50 disabled:opacity-50"
                            title="Eliminar contenido"
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
    </main>
  )
}

function SectionTitle({ icon, title, description }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-2xl bg-[#fff1f1] text-[#8c0303] flex items-center justify-center shrink-0">
        {icon}
      </div>

      <div>
        <h3 className="text-[17px] font-bold text-[#7a0000]">{title}</h3>
        <p className="mt-1 text-sm text-[#b07a7a]">{description}</p>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#b07a7a] mb-2">
        {label}
      </label>
      {children}
    </div>
  )
}

function MetricInput({ label, name, value, onChange, step = '1' }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#b07a7a] mb-2">
        {label}
      </label>

      <input
        type="number"
        min="0"
        step={step}
        name={name}
        value={value}
        onChange={onChange}
        placeholder="0"
        className="w-full rounded-xl border border-[#efcaca] bg-white px-4 py-3 text-sm text-[#2e2e2e] outline-none transition focus:border-[#8c0303] focus:ring-2 focus:ring-[#fff1f1]"
      />
    </div>
  )
}

function SmallInfo({ label, value, badgeClass }) {
  return (
    <div className="rounded-2xl border border-[#f3dede] bg-[#fffafa] p-3">
      <p className="text-[10px] uppercase tracking-[0.13em] text-[#b9a0a0]">
        {label}
      </p>

      {badgeClass ? (
        <span
          className={`${badgeClass} inline-flex mt-2 px-3 py-1 rounded-full text-xs font-semibold`}
        >
          {value}
        </span>
      ) : (
        <p className="mt-2 text-sm font-semibold text-[#7a0000] break-words">
          {value}
        </p>
      )}
    </div>
  )
}

function EmptyState({ text }) {
  return (
    <div className="min-h-[150px] px-5 flex items-center justify-center text-center text-sm text-[#b07a7a]">
      {text}
    </div>
  )
}