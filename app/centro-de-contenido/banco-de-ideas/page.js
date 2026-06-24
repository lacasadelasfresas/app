'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  Archive,
  ArrowLeft,
  Check,
  ChevronRight,
  FileText,
  FolderOpen,
  Lightbulb,
  Link2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  WandSparkles,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

const FORMATOS = ['Historia', 'Carrusel', 'Reel', 'Estático']

const PILARES = [
  'Educativo',
  'Emocional',
  'Estratégico',
  'Promocional',
  'Inspiracional',
  'Venta directa',
]

const PLATAFORMAS = [
  'Instagram',
  'TikTok',
  'Facebook',
  'WhatsApp',
  'PedidosYa',
]

const ESTADOS = ['Idea', 'Convertida', 'Archivada']

function createEmptyForm() {
  return {
    titulo: '',
    descripcion: '',
    pilar: '',
    formato: '',
    plataformas: [],
    referencia_url: '',
    fuente: '',
  }
}

function formatDate(value) {
  if (!value) return 'Sin fecha'

  return new Intl.DateTimeFormat('es-PA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function getEstadoStyle(estado) {
  const styles = {
    Idea: 'bg-[#fff4db] text-[#9c6500]',
    Convertida: 'bg-[#eaf9f0] text-[#157347]',
    Archivada: 'bg-[#f2f2f2] text-[#707070]',
  }

  return styles[estado] || 'bg-[#f4f4f4] text-[#666]'
}

export default function BancoDeIdeasPage() {
  const [ideas, setIdeas] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(createEmptyForm())

  const [search, setSearch] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('Todos')
  const [pilarFiltro, setPilarFiltro] = useState('Todos')

  const inputClass =
    'w-full min-w-0 max-w-full rounded-xl border border-[#efcaca] bg-white px-4 py-3 text-sm text-[#2e2e2e] outline-none transition focus:border-[#8c0303] focus:ring-2 focus:ring-[#fff1f1]'

  useEffect(() => {
    fetchIdeas()
  }, [])

  async function fetchIdeas() {
    setLoading(true)

    const { data, error } = await supabase
      .from('banco_ideas')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error cargando banco de ideas:', error)
      alert('No se pudo cargar el Banco de Ideas.')
      setLoading(false)
      return
    }

    setIdeas(data || [])
    setLoading(false)
  }

  function abrirNuevaIdea() {
    setEditingId(null)
    setForm(createEmptyForm())
    setFormOpen(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function cerrarFormulario() {
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

  function editarIdea(idea) {
    setEditingId(idea.id)

    setForm({
      titulo: idea.titulo || '',
      descripcion: idea.descripcion || '',
      pilar: idea.pilar || '',
      formato: idea.formato || '',
      plataformas: idea.plataformas || [],
      referencia_url: idea.referencia_url || '',
      fuente: idea.fuente || '',
    })

    setFormOpen(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  async function guardarIdea() {
    if (!form.titulo.trim()) {
      alert('Debes escribir un título para la idea.')
      return
    }

    setSaving(true)

    const payload = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim() || null,
      pilar: form.pilar || null,
      formato: form.formato || null,
      plataformas: form.plataformas,
      referencia_url: form.referencia_url.trim() || null,
      fuente: form.fuente.trim() || null,
      updated_at: new Date().toISOString(),
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('banco_ideas')
          .update(payload)
          .eq('id', editingId)

        if (error) throw error

        alert('Idea actualizada correctamente.')
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        const { error } = await supabase.from('banco_ideas').insert([
          {
            ...payload,
            estado: 'Idea',
            creado_por: user?.id || null,
          },
        ])

        if (error) throw error

        alert('Idea guardada correctamente.')
      }

      await fetchIdeas()
      cerrarFormulario()
    } catch (error) {
      console.error('Error guardando idea:', error)
      alert('No se pudo guardar la idea.')
    } finally {
      setSaving(false)
    }
  }

  async function archivarIdea(idea) {
    const nuevoEstado =
      idea.estado === 'Archivada' ? 'Idea' : 'Archivada'

    const confirmacion = confirm(
      nuevoEstado === 'Archivada'
        ? `¿Deseas archivar "${idea.titulo}"?`
        : `¿Deseas restaurar "${idea.titulo}" al banco de ideas?`
    )

    if (!confirmacion) return

    const { error } = await supabase
      .from('banco_ideas')
      .update({
        estado: nuevoEstado,
        updated_at: new Date().toISOString(),
      })
      .eq('id', idea.id)

    if (error) {
      console.error('Error actualizando estado:', error)
      alert('No se pudo actualizar la idea.')
      return
    }

    await fetchIdeas()
  }

  async function eliminarIdea(idea) {
    const confirmacion = confirm(
      `¿Deseas eliminar "${idea.titulo}"? Esta acción no se puede deshacer.`
    )

    if (!confirmacion) return

    setDeletingId(idea.id)

    const { error } = await supabase
      .from('banco_ideas')
      .delete()
      .eq('id', idea.id)

    if (error) {
      console.error('Error eliminando idea:', error)
      alert('No se pudo eliminar la idea.')
      setDeletingId(null)
      return
    }

    await fetchIdeas()
    setDeletingId(null)
  }

  function convertirEnContenido(idea) {
    const params = new URLSearchParams({
      nuevo: '1',
      idea: idea.id,
    })

    window.location.href = `/centro-de-contenido/biblioteca?${params.toString()}`
  }

  function convertirEnContenido(idea) {
  const params = new URLSearchParams({
    nuevo: '1',
    idea: idea.id,
  })

  window.location.href = `/centro-de-contenido/biblioteca?${params.toString()}`
}

function abrirContenidoCreado(idea) {
  if (!idea.contenido_id) {
    alert(
      'Esta idea figura como convertida, pero no tiene un contenido vinculado todavía.'
    )
    return
  }

  window.location.href = `/centro-de-contenido/biblioteca?editar=${idea.contenido_id}`
}

  const ideasFiltradas = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return ideas.filter((idea) => {
      const text = `
        ${idea.titulo || ''}
        ${idea.descripcion || ''}
        ${idea.pilar || ''}
        ${idea.formato || ''}
        ${idea.fuente || ''}
      `.toLowerCase()

      const matchesSearch =
        !normalizedSearch || text.includes(normalizedSearch)

      const matchesEstado =
        estadoFiltro === 'Todos' || idea.estado === estadoFiltro

      const matchesPilar =
        pilarFiltro === 'Todos' || idea.pilar === pilarFiltro

      return matchesSearch && matchesEstado && matchesPilar
    })
  }, [ideas, search, estadoFiltro, pilarFiltro])

  const resumen = useMemo(() => {
    return {
      total: ideas.length,
      activas: ideas.filter((idea) => idea.estado === 'Idea').length,
      convertidas: ideas.filter((idea) => idea.estado === 'Convertida').length,
      archivadas: ideas.filter((idea) => idea.estado === 'Archivada').length,
    }
  }, [ideas])

  return (
    <main className="min-h-screen bg-[#fcf8f8]">
      <header className="bg-white border-b border-[#f1dede] px-5 py-3 md:flex md:h-[82px] md:items-center md:px-8 md:py-0">
        <div className="w-full max-w-none">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
                Marketing y contenido
              </p>

              <h1 className="mt-1 text-[21px] font-bold leading-tight text-[#7a0000] md:text-[23px]">
                Banco de Ideas
              </h1>

              <p className="mt-1 text-xs text-[#b07a7a] md:text-sm">
                Captura conceptos, tendencias, promociones y contenido para desarrollar después.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
              <Link
                href="/centro-de-contenido"
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#efcccc] bg-white px-4 text-sm font-semibold text-[#8c0303] hover:bg-[#fff5f5] sm:w-auto"
              >
                <ArrowLeft size={16} />
                Centro de Contenido
              </Link>

              <button
                type="button"
                onClick={abrirNuevaIdea}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#8c0303] px-4 text-sm font-semibold text-white hover:bg-[#720000] sm:w-auto"
              >
                <Plus size={16} />
                Nueva idea
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] space-y-5 px-4 py-5 md:px-8 md:py-7">
        {formOpen && (
          <section className="rounded-[26px] border border-[#f3dede] bg-white p-5 md:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff1f1] text-[#8c0303]">
                  <Lightbulb size={19} />
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
                    {editingId ? 'Editar idea' : 'Captura rápida'}
                  </p>

                  <h2 className="mt-1 text-[20px] font-bold text-[#7a0000]">
                    {editingId
                      ? 'Actualiza esta idea'
                      : 'Registra una nueva idea de contenido'}
                  </h2>

                  <p className="mt-1 text-sm text-[#b07a7a]">
                    No necesitas tener todo resuelto. Guarda la idea antes de perderla.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={cerrarFormulario}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#efcccc] px-4 text-sm font-semibold text-[#8c0303] hover:bg-[#fff5f5] sm:w-auto"
              >
                <X size={16} />
                Cerrar
              </button>
            </div>

            <div className="mt-7">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#fff1f1] text-[#8c0303]">
                  <Sparkles size={17} />
                </div>

                <div>
                  <h3 className="text-[18px] font-bold text-[#7a0000]">
                    Información de la idea
                  </h3>

                  <p className="mt-1 text-sm text-[#b07a7a]">
                    Agrega solamente lo necesario para poder retomarla después.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field label="Título o idea principal *">
                  <input
                    name="titulo"
                    value={form.titulo}
                    onChange={handleChange}
                    placeholder="Ej. Reel: cómo hacemos nuestra crema"
                    className={inputClass}
                  />
                </Field>

                <Field label="Formato sugerido">
                  <select
                    name="formato"
                    value={form.formato}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="">Seleccionar formato...</option>

                    {FORMATOS.map((formato) => (
                      <option key={formato} value={formato}>
                        {formato}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Pilar sugerido">
                  <select
                    name="pilar"
                    value={form.pilar}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="">Seleccionar pilar...</option>

                    {PILARES.map((pilar) => (
                      <option key={pilar} value={pilar}>
                        {pilar}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="md:col-span-2 xl:col-span-3">
                  <Field label="Descripción, hook o enfoque">
                    <textarea
                      name="descripcion"
                      value={form.descripcion}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Ej. Mostrar que la crema es artesanal, ligera y preparada con ingredientes frescos."
                      className={`${inputClass} resize-none`}
                    />
                  </Field>
                </div>

                <Field label="Fuente o inspiración">
                  <input
                    name="fuente"
                    value={form.fuente}
                    onChange={handleChange}
                    placeholder="Ej. Tendencia TikTok, clienta, competencia..."
                    className={inputClass}
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field label="Enlace de referencia">
                    <div className="relative">
                      <Link2
                        size={16}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b07a7a]"
                      />

                      <input
                        name="referencia_url"
                        value={form.referencia_url}
                        onChange={handleChange}
                        placeholder="https://instagram.com/... o https://tiktok.com/..."
                        className={`${inputClass} pl-11`}
                      />
                    </div>
                  </Field>
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-2 text-xs font-medium text-[#b07a7a]">
                  Plataformas sugeridas
                </p>

                <div className="flex flex-wrap gap-2">
                  {PLATAFORMAS.map((platform) => {
                    const selected = form.plataformas.includes(platform)

                    return (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => togglePlatform(platform)}
                        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                          selected
                            ? 'border-[#8c0303] bg-[#8c0303] text-white'
                            : 'border-[#efcccc] bg-white text-[#8c0303] hover:bg-[#fff5f5]'
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

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#f3dede] pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cerrarFormulario}
                disabled={saving}
                className="w-full rounded-xl border border-[#efcccc] px-5 py-3 text-sm font-semibold text-[#8c0303] hover:bg-[#fff5f5] disabled:opacity-60 sm:w-auto"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={guardarIdea}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#8c0303] px-5 py-3 text-sm font-semibold text-white hover:bg-[#720000] disabled:opacity-60 sm:w-auto"
              >
                <WandSparkles size={17} />

                {saving
                  ? 'Guardando...'
                  : editingId
                    ? 'Guardar cambios'
                    : 'Guardar idea'}
              </button>
            </div>
          </section>
        )}

        <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <SummaryCard
            label="Total de ideas"
            value={resumen.total}
            icon={<Lightbulb size={19} />}
          />

          <SummaryCard
            label="Ideas activas"
            value={resumen.activas}
            icon={<Sparkles size={19} />}
          />

          <SummaryCard
            label="Convertidas"
            value={resumen.convertidas}
            icon={<Check size={19} />}
          />

          <SummaryCard
            label="Archivadas"
            value={resumen.archivadas}
            icon={<Archive size={19} />}
          />
        </section>

        <section className="overflow-hidden rounded-[26px] border border-[#f3dede] bg-white">
          <div className="border-b border-[#f3dede] p-5 md:p-6">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
                    Ideas registradas
                  </p>

                  <h2 className="mt-1 text-[20px] font-bold text-[#7a0000] md:text-[23px]">
                    Tu biblioteca de inspiración
                  </h2>

                  <p className="mt-1 text-sm text-[#b07a7a]">
                    {ideasFiltradas.length} idea(s) visible(s) según los filtros actuales.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fetchIdeas}
                  disabled={loading}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#efcccc] bg-white px-4 text-sm font-semibold text-[#8c0303] hover:bg-[#fff5f5] disabled:opacity-60 lg:w-auto"
                >
                  <RefreshCw
                    size={16}
                    className={loading ? 'animate-spin' : ''}
                  />
                  Actualizar
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="flex h-11 items-center gap-2 rounded-xl border border-[#efcccc] bg-[#fffafa] px-4 focus-within:border-[#8c0303] focus-within:ring-2 focus-within:ring-[#fff1f1]">
                  <Search size={17} className="shrink-0 text-[#b07a7a]" />

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar idea, pilar o fuente..."
                    className="w-full bg-transparent text-sm text-[#2e2e2e] outline-none"
                  />
                </div>

                <select
                  value={estadoFiltro}
                  onChange={(event) => setEstadoFiltro(event.target.value)}
                  className={inputClass}
                >
                  <option value="Todos">Todos los estados</option>

                  {ESTADOS.map((estado) => (
                    <option key={estado} value={estado}>
                      {estado}
                    </option>
                  ))}
                </select>

                <select
                  value={pilarFiltro}
                  onChange={(event) => setPilarFiltro(event.target.value)}
                  className={inputClass}
                >
                  <option value="Todos">Todos los pilares</option>

                  {PILARES.map((pilar) => (
                    <option key={pilar} value={pilar}>
                      {pilar}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="px-5 py-12 text-center text-sm text-[#b07a7a]">
              Cargando ideas...
            </div>
          ) : ideasFiltradas.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <Lightbulb size={31} className="mx-auto text-[#b07a7a]" />

              <p className="mt-4 text-sm font-semibold text-[#7a0000]">
                No hay ideas para mostrar.
              </p>

              <p className="mt-1 text-sm text-[#b07a7a]">
                Registra una idea rápida para empezar tu banco de inspiración.
              </p>

              <button
                type="button"
                onClick={abrirNuevaIdea}
                className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#8c0303] px-4 text-sm font-semibold text-white hover:bg-[#720000]"
              >
                <Plus size={16} />
                Registrar primera idea
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3 md:p-6">
              {ideasFiltradas.map((idea) => (
<IdeaCard
  key={idea.id}
  idea={idea}
  onEdit={() => editarIdea(idea)}
  onArchive={() => archivarIdea(idea)}
  onDelete={() => eliminarIdea(idea)}
  onConvert={() => convertirEnContenido(idea)}
  onOpenContent={() => abrirContenidoCreado(idea)}
  deleting={deletingId === idea.id}
/>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

function Field({ label, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-xs font-medium text-[#b07a7a]">
        {label}
      </span>

      {children}
    </label>
  )
}

function SummaryCard({ label, value, icon }) {
  return (
    <article className="rounded-[24px] border border-[#f3dede] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#b9a0a0]">
            {label}
          </p>

          <p className="mt-3 text-[30px] font-bold leading-none text-[#7a0000]">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#fff1f1] text-[#8c0303]">
          {icon}
        </div>
      </div>
    </article>
  )
}

function IdeaCard({
  idea,
  onEdit,
  onArchive,
  onDelete,
  onConvert,
  onOpenContent,
  deleting,
}) {
  return (
    <article className="flex min-w-0 flex-col rounded-[24px] border border-[#f3dede] bg-[#fffafa] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#8c0303]">
            <Lightbulb size={18} />
          </div>

          <div className="min-w-0">
            <p className="break-words text-[17px] font-bold leading-snug text-[#7a0000]">
              {idea.titulo}
            </p>

            <p className="mt-1 text-xs text-[#b07a7a]">
              Registrada {formatDate(idea.created_at)}
            </p>
          </div>
        </div>

        <span
          className={`${getEstadoStyle(
            idea.estado
          )} shrink-0 rounded-full px-3 py-1 text-[10px] font-bold`}
        >
          {idea.estado}
        </span>
      </div>

      {idea.descripcion && (
        <p className="mt-4 line-clamp-3 break-words text-sm leading-relaxed text-[#755c5c]">
          {idea.descripcion}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {idea.formato && (
          <span className="rounded-full border border-[#efcccc] bg-white px-3 py-1 text-xs font-semibold text-[#8c0303]">
            {idea.formato}
          </span>
        )}

        {idea.pilar && (
          <span className="rounded-full border border-[#f0dfc7] bg-[#fff8ea] px-3 py-1 text-xs font-semibold text-[#9c6500]">
            {idea.pilar}
          </span>
        )}
      </div>

      {idea.plataformas?.length > 0 && (
        <p className="mt-3 break-words text-xs text-[#b07a7a]">
          {idea.plataformas.join(' · ')}
        </p>
      )}

      {(idea.fuente || idea.referencia_url) && (
        <div className="mt-4 rounded-2xl border border-[#f3dede] bg-white p-3">
          {idea.fuente && (
            <p className="break-words text-xs font-semibold text-[#7a0000]">
              {idea.fuente}
            </p>
          )}

          {idea.referencia_url && (
            <a
              href={idea.referencia_url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 break-all text-xs font-semibold text-[#8c0303] hover:underline"
            >
              <Link2 size={13} />
              Ver referencia
            </a>
          )}
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2 border-t border-[#f3dede] pt-4">
        {idea.estado === 'Idea' ? (
          <button
            type="button"
            onClick={onConvert}
            className="col-span-2 flex h-10 items-center justify-center gap-2 rounded-xl bg-[#8c0303] px-3 text-sm font-semibold text-white hover:bg-[#720000]"
          >
            <WandSparkles size={16} />
            Convertir en contenido
          </button>
) : (
  <button
    type="button"
    onClick={onOpenContent}
    className="col-span-2 flex h-10 items-center justify-center gap-2 rounded-xl border border-[#efcccc] bg-white px-3 text-sm font-semibold text-[#8c0303] hover:bg-[#fff5f5]"
  >
    <FolderOpen size={16} />
    Ver contenido creado
  </button>
)}

        <button
          type="button"
          onClick={onEdit}
          className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#efcccc] bg-white text-sm font-semibold text-[#8c0303] hover:bg-[#fff5f5]"
        >
          <Pencil size={15} />
          Editar
        </button>

        <button
          type="button"
          onClick={onArchive}
          className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#efcccc] bg-white text-sm font-semibold text-[#8c0303] hover:bg-[#fff5f5]"
        >
          <Archive size={15} />
          {idea.estado === 'Archivada' ? 'Restaurar' : 'Archivar'}
        </button>

        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="col-span-2 flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 size={15} />
          {deleting ? 'Eliminando...' : 'Eliminar idea'}
        </button>
      </div>
    </article>
  )
}