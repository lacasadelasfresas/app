'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  LayoutList,
  Lightbulb,
  ListChecks,
  RefreshCw,
  Send,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

const ESTADOS = [
  'Idea',
  'En producción',
  'Listo para publicar',
  'Programado',
  'Publicado',
]

const COLUMNAS = [
  {
    estado: 'Idea',
    icon: Lightbulb,
    description: 'Ideas por desarrollar',
  },
  {
    estado: 'En producción',
    icon: Sparkles,
    description: 'Diseño, video o copy',
  },
  {
    estado: 'Listo para publicar',
    icon: Send,
    description: 'Todo listo',
  },
  {
    estado: 'Programado',
    icon: CalendarDays,
    description: 'Con fecha asignada',
  },
  {
    estado: 'Publicado',
    icon: Trophy,
    description: 'Contenido activo',
  },
]

function formatDate(value) {
  if (!value) return 'Sin fecha'

  return new Intl.DateTimeFormat('es-PA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatShortDate(value) {
  if (!value) return 'Sin fecha'

  return new Intl.DateTimeFormat('es-PA', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value))
}

function formatMonth(date) {
  return new Intl.DateTimeFormat('es-PA', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function getPriorityStyle(priority) {
  const styles = {
    Alta: 'bg-red-50 text-red-600',
    Media: 'bg-amber-50 text-amber-700',
    Baja: 'bg-emerald-50 text-emerald-700',
  }

  return styles[priority] || 'bg-[#fff1f1] text-[#8c0303]'
}

function getStatusStyle(status) {
  const styles = {
    Idea: 'bg-[#fff4db] text-[#9c6500]',
    'En producción': 'bg-[#fff1f1] text-[#8c0303]',
    'Listo para publicar': 'bg-[#edf9f3] text-[#17724e]',
    Programado: 'bg-[#eef7ff] text-[#1f6ea4]',
    Publicado: 'bg-[#eaf9f0] text-[#157347]',
  }

  return styles[status] || 'bg-[#f4f4f4] text-[#666]'
}

function getDateKey(value) {
  if (!value) return ''

  const date = new Date(value)

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(date.getDate()).padStart(2, '0')}`
}

function getMonthDays(currentMonth) {
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const mondayIndex = (firstDay.getDay() + 6) % 7
  const totalDays = lastDay.getDate()

  const days = []

  for (let index = 0; index < mondayIndex; index += 1) {
    days.push(null)
  }

  for (let day = 1; day <= totalDays; day += 1) {
    days.push(new Date(year, month, day))
  }

  while (days.length % 7 !== 0) {
    days.push(null)
  }

  return days
}

export default function KanbanContenidoPage() {
  const [contenido, setContenido] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [platformFilter, setPlatformFilter] = useState('Todos')
  const [activeView, setActiveView] = useState('kanban')
  const [currentMonth, setCurrentMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  )
  const [openMobileStates, setOpenMobileStates] = useState({
    Idea: true,
    'En producción': true,
    'Listo para publicar': true,
    Programado: true,
    Publicado: true,
  })

  useEffect(() => {
    fetchContenido()
  }, [])

  async function fetchContenido() {
    setLoading(true)

    const { data, error } = await supabase
      .from('contenido')
      .select('*')
      .neq('estado', 'Archivado')
      .order('fecha_programada', {
        ascending: true,
        nullsFirst: false,
      })

    if (error) {
      console.error('Error cargando contenido:', error)
      alert('No se pudo cargar el contenido.')
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
      alert('No se pudo actualizar el estado del contenido.')
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

  function toggleMobileState(estado) {
    setOpenMobileStates((previous) => ({
      ...previous,
      [estado]: !previous[estado],
    }))
  }

  const plataformas = useMemo(() => {
    const allPlatforms = contenido.flatMap(
      (item) => item.plataformas || []
    )

    return ['Todos', ...new Set(allPlatforms)]
  }, [contenido])

  const contenidoFiltrado = useMemo(() => {
    if (platformFilter === 'Todos') return contenido

    return contenido.filter((item) =>
      item.plataformas?.includes(platformFilter)
    )
  }, [contenido, platformFilter])

  function getItemsByStatus(estado) {
    return contenidoFiltrado.filter((item) => item.estado === estado)
  }

  const contenidoDelMes = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    return contenidoFiltrado
      .filter((item) => {
        if (!item.fecha_programada) return false

        const fecha = new Date(item.fecha_programada)

        return fecha.getFullYear() === year && fecha.getMonth() === month
      })
      .sort(
        (a, b) =>
          new Date(a.fecha_programada) - new Date(b.fecha_programada)
      )
  }, [contenidoFiltrado, currentMonth])

  const monthDays = useMemo(
    () => getMonthDays(currentMonth),
    [currentMonth]
  )

  const itemsByDate = useMemo(() => {
    return contenidoDelMes.reduce((accumulator, item) => {
      const key = getDateKey(item.fecha_programada)

      if (!accumulator[key]) {
        accumulator[key] = []
      }

      accumulator[key].push(item)

      return accumulator
    }, {})
  }, [contenidoDelMes])

  function previousMonth() {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        1
      )
    )
  }

  function nextMonth() {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1
      )
    )
  }

  const viewButtonClass = (view) =>
    `h-10 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition ${
      activeView === view
        ? 'bg-[#8c0303] text-white border border-[#8c0303]'
        : 'bg-white border border-[#efcccc] text-[#8c0303] hover:bg-[#fff5f5]'
    }`

  return (
    <main className="min-h-screen bg-[#fcf8f8]">
      <header className="bg-white border-b border-[#f1dede] px-5 md:px-8 py-3 md:h-[82px] md:py-0 md:flex md:items-center">
        <div className="w-full max-w-none">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
                Marketing y contenido
              </p>

              <h1 className="mt-1 text-[21px] md:text-[23px] font-bold text-[#7a0000] leading-tight">
                Organización de contenido
              </h1>

              <p className="mt-1 text-xs md:text-sm text-[#b07a7a]">
                Visualiza y organiza cada pieza según su etapa de trabajo.
              </p>
            </div>

            <div className="flex flex-col gap-2 w-full xl:w-auto">
              <div className="grid grid-cols-3 gap-2 w-full sm:flex sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveView('kanban')}
                  className={`${viewButtonClass('kanban')} w-full sm:w-auto`}
                >
                  <FolderKanban size={16} />
                  Kanban
                </button>

                <button
                  type="button"
                  onClick={() => setActiveView('calendar')}
                  className={`${viewButtonClass('calendar')} w-full sm:w-auto`}
                >
                  <CalendarDays size={16} />
                  Calendario
                </button>

                <button
                  type="button"
                  onClick={() => setActiveView('list')}
                  className={`${viewButtonClass('list')} w-full sm:w-auto`}
                >
                  <LayoutList size={16} />
                  Lista
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
                <Link
                  href="/centro-de-contenido"
                  className="w-full sm:w-auto h-10 px-4 rounded-xl border border-[#efcccc] bg-white text-[#8c0303] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#fff5f5]"
                >
                  <ArrowLeft size={16} />
                  Dashboard
                </Link>

                <Link
                  href="/centro-de-contenido/biblioteca"
                  className="w-full sm:w-auto h-10 px-4 rounded-xl bg-[#8c0303] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#720000]"
                >
                  <ListChecks size={16} />
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
        </div>
      </header>

      <section className="max-w-[1800px] mx-auto px-4 md:px-8 py-5 md:py-7">
        <section className="bg-white border border-[#f3dede] rounded-[26px] p-5 md:p-6 mb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
                Filtro activo
              </p>

              <h2 className="mt-1 text-[20px] font-bold text-[#7a0000]">
                {activeView === 'kanban' && 'Organiza el contenido por etapa'}
                {activeView === 'calendar' &&
                  'Planifica el contenido por fecha'}
                {activeView === 'list' &&
                  'Consulta todo el contenido registrado'}
              </h2>

              <p className="mt-1 text-sm text-[#b07a7a]">
                {activeView === 'kanban' &&
                  'En móvil, cada etapa se muestra verticalmente para evitar desplazamiento horizontal.'}
                {activeView === 'calendar' &&
                  'Usa las flechas para revisar los contenidos programados por mes.'}
                {activeView === 'list' &&
                  'Revisa títulos, plataformas, formatos, fechas y estados en una sola vista.'}
              </p>
            </div>

            <select
              value={platformFilter}
              onChange={(event) => setPlatformFilter(event.target.value)}
              className="w-full lg:w-[260px] h-11 rounded-xl border border-[#efcccc] bg-white px-4 text-sm text-[#2e2e2e] outline-none focus:border-[#8c0303]"
            >
              {plataformas.map((platform) => (
                <option key={platform} value={platform}>
                  {platform === 'Todos'
                    ? 'Todas las plataformas'
                    : platform}
                </option>
              ))}
            </select>
          </div>
        </section>

        {loading ? (
          <div className="py-16 text-center text-sm text-[#b07a7a]">
            Cargando contenido...
          </div>
        ) : (
          <>
            {activeView === 'kanban' && (
              <>
                <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-5 gap-4">
                  {COLUMNAS.map((column) => (
                    <KanbanColumn
                      key={column.estado}
                      column={column}
                      items={getItemsByStatus(column.estado)}
                      updatingId={updatingId}
                      cambiarEstado={cambiarEstado}
                    />
                  ))}
                </div>

                <div className="md:hidden space-y-4">
                  {COLUMNAS.map((column) => {
                    const Icon = column.icon
                    const items = getItemsByStatus(column.estado)
                    const isOpen = openMobileStates[column.estado]

                    return (
                      <section
                        key={column.estado}
                        className="bg-white border border-[#f3dede] rounded-[24px] overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => toggleMobileState(column.estado)}
                          className="w-full p-5 flex items-center justify-between gap-4 text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-[#fff1f1] text-[#8c0303] flex items-center justify-center shrink-0">
                              <Icon size={19} />
                            </div>

                            <div>
                              <h3 className="text-[19px] font-bold text-[#7a0000]">
                                {column.estado}
                              </h3>

                              <p className="mt-1 text-sm text-[#b07a7a]">
                                {column.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="min-w-8 h-8 rounded-full bg-[#fff1f1] text-[#8c0303] text-xs font-bold flex items-center justify-center">
                              {items.length}
                            </span>

                            <ChevronDown
                              size={18}
                              className={`text-[#8c0303] transition-transform ${
                                isOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>

                        {isOpen && (
                          <div className="border-t border-[#f3dede] p-4 space-y-3">
                            {items.length === 0 ? (
                              <div className="rounded-2xl border border-dashed border-[#efcccc] bg-[#fffafa] px-4 py-7 text-center text-sm text-[#b07a7a]">
                                No hay contenido en esta etapa.
                              </div>
                            ) : (
                              items.map((item) => (
                                <ContentCard
                                  key={item.id}
                                  item={item}
                                  updatingId={updatingId}
                                  cambiarEstado={cambiarEstado}
                                />
                              ))
                            )}
                          </div>
                        )}
                      </section>
                    )
                  })}
                </div>
              </>
            )}

            {activeView === 'list' && (
              <section className="bg-white border border-[#f3dede] rounded-[26px] overflow-hidden">
                <div className="p-5 md:p-6 border-b border-[#f3dede]">
                  <h2 className="text-[20px] font-bold text-[#7a0000]">
                    Lista de contenidos
                  </h2>

                  <p className="mt-1 text-sm text-[#b07a7a]">
                    {contenidoFiltrado.length} contenido(s) visibles.
                  </p>
                </div>

                <div className="md:hidden divide-y divide-[#f3dede]">
                  {contenidoFiltrado.length === 0 ? (
                    <EmptyState text="No hay contenidos registrados con este filtro." />
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
                          <InfoCell
                            label="Fecha"
                            value={
                              item.fecha_programada
                                ? formatDate(item.fecha_programada)
                                : 'Sin fecha'
                            }
                          />

                          <InfoCell
                            label="Prioridad"
                            value={item.prioridad || 'Media'}
                            badgeClass={getPriorityStyle(item.prioridad)}
                          />
                        </div>

                        <div className="mt-4">
                          <select
                            value={item.estado}
                            onChange={(event) =>
                              cambiarEstado(item.id, event.target.value)
                            }
                            disabled={updatingId === item.id}
                            className="w-full h-11 rounded-xl border border-[#efcccc] bg-white px-4 text-sm text-[#2e2e2e] outline-none disabled:opacity-60"
                          >
                            {ESTADOS.map((status) => (
                              <option key={status} value={status}>
                                Mover a: {status}
                              </option>
                            ))}
                          </select>
                        </div>
                      </article>
                    ))
                  )}
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-[1020px] w-full text-sm">
                    <thead className="bg-[#f8eeee] text-[#b07a7a] uppercase text-[11px] tracking-[0.14em]">
                      <tr>
                        <th className="py-4 px-5 text-left">Contenido</th>
                        <th className="py-4 px-5 text-left">Plataforma</th>
                        <th className="py-4 px-5 text-left">Formato</th>
                        <th className="py-4 px-5 text-left">Fecha</th>
                        <th className="py-4 px-5 text-left">Estado</th>
                        <th className="py-4 px-5 text-left">Mover</th>
                      </tr>
                    </thead>

                    <tbody>
                      {contenidoFiltrado.length === 0 ? (
                        <tr>
                          <td
                            colSpan="6"
                            className="py-10 text-center text-[#b07a7a]"
                          >
                            No hay contenidos registrados con este filtro.
                          </td>
                        </tr>
                      ) : (
                        contenidoFiltrado.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-[#f3dede] hover:bg-[#fffafa]"
                          >
                            <td className="py-4 px-5">
                              <p className="font-semibold text-[#2e2e2e]">
                                {item.titulo}
                              </p>

                              <p className="mt-1 text-xs text-[#b07a7a]">
                                {item.producto_relacionado ||
                                  item.campana_relacionada ||
                                  item.pilar ||
                                  'Sin relación comercial'}
                              </p>
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
                              <select
                                value={item.estado}
                                onChange={(event) =>
                                  cambiarEstado(item.id, event.target.value)
                                }
                                disabled={updatingId === item.id}
                                className="h-10 rounded-xl border border-[#efcccc] bg-white px-3 text-xs text-[#2e2e2e] outline-none disabled:opacity-60"
                              >
                                {ESTADOS.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeView === 'calendar' && (
              <section className="bg-white border border-[#f3dede] rounded-[26px] overflow-hidden">
                <div className="p-5 md:p-6 border-b border-[#f3dede]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
                        Planificación mensual
                      </p>

                      <h2 className="mt-1 text-[21px] font-bold text-[#7a0000] capitalize">
                        {formatMonth(currentMonth)}
                      </h2>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={previousMonth}
                        className="w-10 h-10 rounded-xl border border-[#efcccc] text-[#8c0303] flex items-center justify-center hover:bg-[#fff5f5]"
                        aria-label="Mes anterior"
                      >
                        <ChevronLeft size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setCurrentMonth(
                            new Date(
                              new Date().getFullYear(),
                              new Date().getMonth(),
                              1
                            )
                          )
                        }
                        className="px-4 h-10 rounded-xl border border-[#efcccc] text-[#8c0303] text-sm font-semibold hover:bg-[#fff5f5]"
                      >
                        Hoy
                      </button>

                      <button
                        type="button"
                        onClick={nextMonth}
                        className="w-10 h-10 rounded-xl border border-[#efcccc] text-[#8c0303] flex items-center justify-center hover:bg-[#fff5f5]"
                        aria-label="Mes siguiente"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="md:hidden divide-y divide-[#f3dede]">
                  {contenidoDelMes.length === 0 ? (
                    <EmptyState text="No hay publicaciones programadas para este mes." />
                  ) : (
                    contenidoDelMes.map((item) => (
                      <article key={item.id} className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-[#fff1f1] text-[#8c0303] flex flex-col items-center justify-center shrink-0">
                            <span className="text-[18px] font-bold leading-none">
                              {new Date(item.fecha_programada).getDate()}
                            </span>

                            <span className="text-[9px] uppercase tracking-[0.1em]">
                              {new Intl.DateTimeFormat('es-PA', {
                                month: 'short',
                              }).format(new Date(item.fecha_programada))}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <p className="font-bold text-[#7a0000] break-words">
                                {item.titulo}
                              </p>

                              <span
                                className={`${getStatusStyle(
                                  item.estado
                                )} px-3 py-1 rounded-full text-xs font-semibold shrink-0`}
                              >
                                {item.estado}
                              </span>
                            </div>

                            <p className="mt-1 text-sm text-[#b07a7a] break-words">
                              {item.plataformas?.join(' · ') ||
                                'Sin plataforma'}
                              {item.formato ? ` · ${item.formato}` : ''}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>

                <div className="hidden md:block p-5 md:p-6 overflow-x-auto">
                  <div className="min-w-[960px]">
                    <div className="grid grid-cols-7 border-l border-t border-[#f3dede]">
                      {[
                        'Lun',
                        'Mar',
                        'Mié',
                        'Jue',
                        'Vie',
                        'Sáb',
                        'Dom',
                      ].map((day) => (
                        <div
                          key={day}
                          className="bg-[#f8eeee] border-r border-b border-[#f3dede] px-3 py-3 text-[11px] uppercase tracking-[0.14em] text-[#b07a7a]"
                        >
                          {day}
                        </div>
                      ))}

                      {monthDays.map((day, index) => {
                        if (!day) {
                          return (
                            <div
                              key={`empty-${index}`}
                              className="min-h-[150px] border-r border-b border-[#f3dede] bg-[#fffafa]/40"
                            />
                          )
                        }

                        const dateKey = getDateKey(day)
                        const items = itemsByDate[dateKey] || []
                        const isToday =
                          getDateKey(day) === getDateKey(new Date())

                        return (
                          <div
                            key={dateKey}
                            className="min-h-[150px] border-r border-b border-[#f3dede] p-2"
                          >
                            <div className="flex justify-between items-center">
                              <span
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                  isToday
                                    ? 'bg-[#8c0303] text-white'
                                    : 'text-[#7a0000]'
                                }`}
                              >
                                {day.getDate()}
                              </span>

                              {items.length > 0 && (
                                <span className="text-[10px] text-[#b07a7a]">
                                  {items.length}
                                </span>
                              )}
                            </div>

                            <div className="mt-2 space-y-1.5">
                              {items.slice(0, 3).map((item) => (
                                <div
                                  key={item.id}
                                  className="rounded-lg border border-[#f3dede] bg-[#fffafa] px-2 py-1.5"
                                >
                                  <p className="text-[10px] font-semibold text-[#7a0000] truncate">
                                    {item.titulo}
                                  </p>

                                  <span
                                    className={`${getStatusStyle(
                                      item.estado
                                    )} inline-flex mt-1 px-2 py-0.5 rounded-full text-[9px] font-semibold`}
                                  >
                                    {item.estado}
                                  </span>
                                </div>
                              ))}

                              {items.length > 3 && (
                                <p className="text-[10px] text-[#b07a7a] px-1">
                                  +{items.length - 3} más
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </section>
    </main>
  )
}

function KanbanColumn({ column, items, updatingId, cambiarEstado }) {
  const Icon = column.icon

  return (
    <section className="min-w-0">
      <div className="bg-white border border-[#f3dede] rounded-[24px] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#fff1f1] text-[#8c0303] flex items-center justify-center shrink-0">
              <Icon size={18} />
            </div>

            <div>
              <h3 className="font-bold text-[#7a0000]">
                {column.estado}
              </h3>

              <p className="mt-1 text-xs text-[#b07a7a]">
                {column.description}
              </p>
            </div>
          </div>

          <span className="min-w-7 h-7 rounded-full bg-[#fff1f1] text-[#8c0303] text-xs font-bold flex items-center justify-center">
            {items.length}
          </span>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {items.length === 0 ? (
          <div className="border border-dashed border-[#efcccc] rounded-[20px] bg-white/60 px-4 py-8 text-center text-xs text-[#b07a7a]">
            No hay contenido en esta etapa.
          </div>
        ) : (
          items.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              updatingId={updatingId}
              cambiarEstado={cambiarEstado}
            />
          ))
        )}
      </div>
    </section>
  )
}

function ContentCard({ item, updatingId, cambiarEstado }) {
  return (
    <article className="bg-white border border-[#f3dede] rounded-[20px] p-4 shadow-[0_4px_20px_rgba(122,0,0,0.03)]">
      <div className="flex items-start justify-between gap-3">
        <span
          className={`${getPriorityStyle(
            item.prioridad
          )} px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0`}
        >
          {item.prioridad || 'Media'}
        </span>

        {item.fecha_programada && (
          <span className="text-[10px] text-[#b07a7a] text-right">
            {formatShortDate(item.fecha_programada)}
          </span>
        )}
      </div>

      <h4 className="mt-3 text-[16px] font-bold text-[#7a0000] leading-snug break-words">
        {item.titulo}
      </h4>

      <p className="mt-2 text-xs text-[#b07a7a] break-words">
        {item.plataformas?.join(' · ') || 'Sin plataforma'}
        {item.formato ? ` · ${item.formato}` : ''}
      </p>

      {(item.producto_relacionado || item.campana_relacionada) && (
        <div className="mt-3 rounded-xl bg-[#fffafa] border border-[#f3dede] px-3 py-2">
          <p className="text-[10px] text-[#b07a7a] break-words">
            {item.producto_relacionado || item.campana_relacionada}
          </p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-[#f3dede]">
        <label className="block text-[10px] uppercase tracking-[0.12em] text-[#b9a0a0] mb-2">
          Mover a
        </label>

        <select
          value={item.estado}
          onChange={(event) =>
            cambiarEstado(item.id, event.target.value)
          }
          disabled={updatingId === item.id}
          className="w-full h-10 rounded-xl border border-[#efcccc] bg-white px-3 text-xs text-[#2e2e2e] outline-none focus:border-[#8c0303] disabled:opacity-60"
        >
          {ESTADOS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>
    </article>
  )
}

function InfoCell({ label, value, badgeClass }) {
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