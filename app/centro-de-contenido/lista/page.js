'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Eye,
  FileText,
  FolderOpen,
  LayoutList,
  Pencil,
  RefreshCw,
  Search,
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

const FORMATOS = [
  'Todos',
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

  return styles[priority] || 'bg-[#fff1f1] text-[#8c0303]'
}

export default function ListaContenidoPage() {
  const [contenido, setContenido] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)

  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState('Todos')
  const [filterPlataforma, setFilterPlataforma] = useState('Todos')
  const [filterFormato, setFilterFormato] = useState('Todos')

  useEffect(() => {
    fetchContenido()
  }, [])

  async function fetchContenido() {
    setLoading(true)

    const { data, error } = await supabase
      .from('contenido')
      .select('*')
      .order('fecha_programada', {
        ascending: true,
        nullsFirst: false,
      })

    if (error) {
      console.error('Error cargando lista de contenido:', error)
      alert('No se pudo cargar la lista de contenido.')
      setLoading(false)
      return
    }

    setContenido(data || [])
    setLoading(false)
  }

  async function cambiarEstado(id, estado) {
    setUpdatingId(id)

    const payload = {
      estado,
      updated_at: new Date().toISOString(),
    }

    if (estado === 'Publicado') {
      payload.fecha_publicada = new Date().toISOString()
    }

    const { error } = await supabase
      .from('contenido')
      .update(payload)
      .eq('id', id)

    if (error) {
      console.error('Error actualizando estado:', error)
      alert('No se pudo actualizar el estado.')
      setUpdatingId(null)
      return
    }

    setContenido((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              ...payload,
            }
          : item
      )
    )

    setUpdatingId(null)
  }

  function limpiarFiltros() {
    setSearch('')
    setFilterEstado('Todos')
    setFilterPlataforma('Todos')
    setFilterFormato('Todos')
  }

  const plataformas = useMemo(() => {
    const allPlatforms = contenido.flatMap(
      (item) => item.plataformas || []
    )

    return ['Todos', ...new Set(allPlatforms)]
  }, [contenido])

  const contenidoFiltrado = useMemo(() => {
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

  const resumen = useMemo(() => {
    return {
      total: contenidoFiltrado.length,
      pendientes: contenidoFiltrado.filter(
        (item) =>
          !['Publicado', 'Archivado'].includes(item.estado)
      ).length,
      publicados: contenidoFiltrado.filter(
        (item) => item.estado === 'Publicado'
      ).length,
    }
  }, [contenidoFiltrado])

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
                Lista de Contenido
              </h1>

              <p className="mt-1 text-xs md:text-sm text-[#b07a7a]">
                Revisa y organiza todas las piezas de contenido desde una sola vista.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <Link
                href="/centro-de-contenido"
                className="w-full sm:w-auto h-10 px-4 rounded-xl border border-[#efcccc] bg-white text-[#8c0303] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#fff5f5]"
              >
                <ArrowLeft size={16} />
                Centro de Contenido
              </Link>

              <Link
                href="/centro-de-contenido/biblioteca"
                className="w-full sm:w-auto h-10 px-4 rounded-xl bg-[#8c0303] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#720000]"
              >
                <FolderOpen size={16} />
                Biblioteca
              </Link>

              <button
                type="button"
                onClick={fetchContenido}
                disabled={loading}
                className="w-full sm:w-auto h-10 px-4 rounded-xl border border-[#efcccc] bg-white text-[#8c0303] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#fff5f5] disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={loading ? 'animate-spin' : ''}
                />
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="max-w-[1600px] mx-auto px-4 md:px-8 py-5 md:py-7 space-y-5">
        <section className="bg-white border border-[#f3dede] rounded-[26px] p-5 md:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
                  Biblioteca operativa
                </p>

                <h2 className="mt-1 text-[20px] font-bold text-[#7a0000]">
                  Filtra y organiza tu contenido
                </h2>

                <p className="mt-1 text-sm text-[#b07a7a]">
                  Busca publicaciones por formato, plataforma, estado o tema.
                </p>
              </div>

              <button
                type="button"
                onClick={limpiarFiltros}
                className="w-full lg:w-auto h-10 px-4 rounded-xl border border-[#efcccc] bg-white text-[#8c0303] text-sm font-semibold hover:bg-[#fff5f5]"
              >
                Limpiar filtros
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="h-11 flex items-center gap-2 border border-[#efcccc] rounded-xl px-4 bg-[#fffafa] focus-within:border-[#8c0303] focus-within:ring-2 focus-within:ring-[#fff1f1]">
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
                className="w-full h-11 rounded-xl border border-[#efcccc] bg-white px-4 text-sm text-[#2e2e2e] outline-none focus:border-[#8c0303]"
              >
                <option value="Todos">Todos los estados</option>

                {ESTADOS.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>

              <select
                value={filterPlataforma}
                onChange={(event) =>
                  setFilterPlataforma(event.target.value)
                }
                className="w-full h-11 rounded-xl border border-[#efcccc] bg-white px-4 text-sm text-[#2e2e2e] outline-none focus:border-[#8c0303]"
              >
                {plataformas.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform === 'Todos'
                      ? 'Todas las plataformas'
                      : platform}
                  </option>
                ))}
              </select>

              <select
                value={filterFormato}
                onChange={(event) => setFilterFormato(event.target.value)}
                className="w-full h-11 rounded-xl border border-[#efcccc] bg-white px-4 text-sm text-[#2e2e2e] outline-none focus:border-[#8c0303]"
              >
                {FORMATOS.map((formato) => (
                  <option key={formato} value={formato}>
                    {formato === 'Todos'
                      ? 'Todos los formatos'
                      : formato}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            label="Contenido visible"
            value={resumen.total}
            icon={<LayoutList size={19} />}
          />

          <SummaryCard
            label="Pendientes"
            value={resumen.pendientes}
            icon={<ClipboardList size={19} />}
          />

          <SummaryCard
            label="Publicados"
            value={resumen.publicados}
            icon={<CheckCircle2 size={19} />}
          />
        </section>

        <section className="bg-white border border-[#f3dede] rounded-[26px] overflow-hidden">
          <div className="p-5 md:p-6 border-b border-[#f3dede]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#fff1f1] text-[#8c0303] flex items-center justify-center">
                <FileText size={18} />
              </div>

              <div>
                <h2 className="text-[20px] font-bold text-[#7a0000]">
                  Todos los contenidos
                </h2>

                <p className="mt-1 text-sm text-[#b07a7a]">
                  {contenidoFiltrado.length} resultado(s) con los filtros actuales.
                </p>
              </div>
            </div>
          </div>

          <div className="md:hidden divide-y divide-[#f3dede]">
            {loading ? (
              <EmptyState text="Cargando contenido..." />
            ) : contenidoFiltrado.length === 0 ? (
              <EmptyState text="No se encontraron contenidos con estos filtros." />
            ) : (
              contenidoFiltrado.map((item) => (
                <article key={item.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[17px] font-bold text-[#7a0000] break-words">
                        {item.titulo}
                      </p>

                      <p className="mt-1 text-sm text-[#b07a7a] break-words">
                        {item.plataformas?.join(' · ') ||
                          'Sin plataforma'}
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
                    <InfoCard
                      label="Fecha"
                      value={
                        item.fecha_programada
                          ? formatDate(item.fecha_programada)
                          : 'Sin fecha'
                      }
                    />

                    <InfoCard
                      label="Prioridad"
                      value={item.prioridad || 'Media'}
                      badgeClass={getPriorityStyle(item.prioridad)}
                    />
                  </div>

                  {(item.producto_relacionado ||
                    item.campana_relacionada ||
                    item.pilar) && (
                    <div className="mt-3 rounded-2xl border border-[#f3dede] bg-[#fffafa] p-3">
                      <p className="text-[10px] uppercase tracking-[0.13em] text-[#b9a0a0]">
                        Relación comercial
                      </p>

                      <p className="mt-2 text-sm font-semibold text-[#7a0000] break-words">
                        {item.producto_relacionado ||
                          item.campana_relacionada ||
                          item.pilar}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 flex gap-3">
                    <select
                      value={item.estado}
                      onChange={(event) =>
                        cambiarEstado(item.id, event.target.value)
                      }
                      disabled={updatingId === item.id}
                      className="flex-1 h-11 rounded-xl border border-[#efcccc] bg-white px-3 text-sm text-[#2e2e2e] outline-none disabled:opacity-60"
                    >
                      {ESTADOS.map((estado) => (
                        <option key={estado} value={estado}>
                          Mover a: {estado}
                        </option>
                      ))}
                    </select>

                    <Link
                      href="/centro-de-contenido/biblioteca"
                      className="w-11 h-11 rounded-xl border border-[#efcccc] text-[#8c0303] flex items-center justify-center hover:bg-[#fff5f5]"
                      title="Abrir Biblioteca"
                    >
                      <Pencil size={16} />
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-[1180px] w-full text-sm">
              <thead className="bg-[#f8eeee] text-[#b07a7a] uppercase text-[11px] tracking-[0.14em]">
                <tr>
                  <th className="py-4 px-5 text-left">Contenido</th>
                  <th className="py-4 px-5 text-left">Plataforma</th>
                  <th className="py-4 px-5 text-left">Formato</th>
                  <th className="py-4 px-5 text-left">Fecha</th>
                  <th className="py-4 px-5 text-left">Estado</th>
                  <th className="py-4 px-5 text-left">Prioridad</th>
                  <th className="py-4 px-5 text-right">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="py-12 text-center text-[#b07a7a]"
                    >
                      Cargando contenido...
                    </td>
                  </tr>
                ) : contenidoFiltrado.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="py-12 text-center text-[#b07a7a]"
                    >
                      No se encontraron contenidos con estos filtros.
                    </td>
                  </tr>
                ) : (
                  contenidoFiltrado.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[#f3dede] hover:bg-[#fffafa]"
                    >
                      <td className="py-4 px-5">
                        <div className="min-w-[220px]">
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
                      </td>

                      <td className="py-4 px-5">
                        {item.plataformas?.join(' · ') || '—'}
                      </td>

                      <td className="py-4 px-5">
                        {item.formato || '—'}
                      </td>

                      <td className="py-4 px-5">
                        {item.fecha_programada
                          ? formatDate(item.fecha_programada)
                          : 'Sin fecha'}
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

                      <td className="py-4 px-5">
                        <span
                          className={`${getPriorityStyle(
                            item.prioridad
                          )} px-3 py-1 rounded-full text-xs font-semibold`}
                        >
                          {item.prioridad || 'Media'}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={item.estado}
                            onChange={(event) =>
                              cambiarEstado(item.id, event.target.value)
                            }
                            disabled={updatingId === item.id}
                            className="h-10 rounded-xl border border-[#efcccc] bg-white px-3 text-xs text-[#2e2e2e] outline-none disabled:opacity-60"
                          >
                            {ESTADOS.map((estado) => (
                              <option key={estado} value={estado}>
                                {estado}
                              </option>
                            ))}
                          </select>

                          <Link
                            href="/centro-de-contenido/biblioteca"
                            className="w-10 h-10 rounded-xl border border-[#efcccc] text-[#8c0303] flex items-center justify-center hover:bg-[#fff5f5]"
                            title="Abrir Biblioteca"
                          >
                            <ChevronRight size={17} />
                          </Link>
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

function SummaryCard({ label, value, icon }) {
  return (
    <article className="bg-white border border-[#f3dede] rounded-[24px] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#b9a0a0]">
            {label}
          </p>

          <p className="mt-3 text-[30px] font-bold text-[#7a0000] leading-none">
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

function InfoCard({ label, value, badgeClass }) {
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
    <div className="min-h-[170px] px-5 flex flex-col items-center justify-center text-center">
      <LayoutList size={30} className="text-[#b07a7a]" />

      <p className="mt-4 text-sm font-semibold text-[#7a0000]">
        No hay contenido para mostrar
      </p>

      <p className="mt-1 text-sm text-[#b07a7a]">{text}</p>
    </div>
  )
}