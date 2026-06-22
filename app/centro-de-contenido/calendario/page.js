'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  ListChecks,
  RefreshCw,
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

function formatMonth(date) {
  return new Intl.DateTimeFormat('es-PA', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatFullDate(value) {
  if (!value) return 'Sin fecha'

  return new Intl.DateTimeFormat('es-PA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(value))
}

function formatShortDate(value) {
  if (!value) return 'Sin fecha'

  return new Intl.DateTimeFormat('es-PA', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value))
}

function formatTime(value) {
  if (!value) return ''

  return new Intl.DateTimeFormat('es-PA', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
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

export default function CalendarioContenidoPage() {
  const [contenido, setContenido] = useState([])
  const [loading, setLoading] = useState(true)
  const [platformFilter, setPlatformFilter] = useState('Todos')

  const [currentMonth, setCurrentMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  )

  useEffect(() => {
    fetchContenido()
  }, [])

  async function fetchContenido() {
    setLoading(true)

    const { data, error } = await supabase
      .from('contenido')
      .select('*')
      .not('fecha_programada', 'is', null)
      .neq('estado', 'Archivado')
      .order('fecha_programada', {
        ascending: true,
      })

    if (error) {
      console.error('Error cargando calendario:', error)
      alert('No se pudo cargar el calendario de contenido.')
      setLoading(false)
      return
    }

    setContenido(data || [])
    setLoading(false)
  }

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

  function goToToday() {
    const today = new Date()

    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))
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

  const contenidoDelMes = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    return contenidoFiltrado.filter((item) => {
      if (!item.fecha_programada) return false

      const fecha = new Date(item.fecha_programada)

      return fecha.getFullYear() === year && fecha.getMonth() === month
    })
  }, [contenidoFiltrado, currentMonth])

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

  const monthDays = useMemo(() => {
    return getMonthDays(currentMonth)
  }, [currentMonth])

  const agendaByDay = useMemo(() => {
    return Object.entries(itemsByDate)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([dateKey, items]) => ({
        dateKey,
        items,
        date: items[0]?.fecha_programada,
      }))
  }, [itemsByDate])

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
                Calendario Editorial
              </h1>

              <p className="mt-1 text-xs md:text-sm text-[#b07a7a]">
                Visualiza las publicaciones programadas por día y por mes.
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

      <section className="max-w-[1800px] mx-auto px-4 md:px-8 py-5 md:py-7">
        <section className="bg-white border border-[#f3dede] rounded-[26px] p-5 md:p-6 mb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
                Planificación mensual
              </p>

              <h2 className="mt-1 text-[20px] font-bold text-[#7a0000] capitalize">
                {formatMonth(currentMonth)}
              </h2>

              <p className="mt-1 text-sm text-[#b07a7a]">
                {contenidoDelMes.length} contenido(s) programado(s) este mes.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <select
                value={platformFilter}
                onChange={(event) => setPlatformFilter(event.target.value)}
                className="w-full sm:w-[230px] h-10 rounded-xl border border-[#efcccc] bg-white px-4 text-sm text-[#2e2e2e] outline-none focus:border-[#8c0303]"
              >
                {plataformas.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform === 'Todos'
                      ? 'Todas las plataformas'
                      : platform}
                  </option>
                ))}
              </select>

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
                  onClick={goToToday}
                  className="h-10 px-4 rounded-xl border border-[#efcccc] text-[#8c0303] text-sm font-semibold hover:bg-[#fff5f5]"
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
        </section>

        {loading ? (
          <div className="py-16 text-center text-sm text-[#b07a7a]">
            Cargando calendario...
          </div>
        ) : (
          <>
            <section className="md:hidden bg-white border border-[#f3dede] rounded-[26px] overflow-hidden">
              <div className="p-5 border-b border-[#f3dede]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#fff1f1] text-[#8c0303] flex items-center justify-center">
                    <ListChecks size={18} />
                  </div>

                  <div>
                    <h2 className="text-[18px] font-bold text-[#7a0000]">
                      Agenda del mes
                    </h2>

                    <p className="mt-1 text-sm text-[#b07a7a]">
                      Publicaciones organizadas por fecha.
                    </p>
                  </div>
                </div>
              </div>

              {agendaByDay.length === 0 ? (
                <EmptyState text="No hay publicaciones programadas para este mes." />
              ) : (
                <div className="divide-y divide-[#f3dede]">
                  {agendaByDay.map((day) => (
                    <section key={day.dateKey} className="p-5">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[#b9a0a0]">
                        {formatFullDate(day.date)}
                      </p>

                      <div className="mt-4 space-y-3">
                        {day.items.map((item) => (
                          <article
                            key={item.id}
                            className="rounded-2xl border border-[#f3dede] bg-[#fffafa] p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-bold text-[#7a0000] break-words">
                                  {item.titulo}
                                </p>

                                <p className="mt-1 text-sm text-[#b07a7a] break-words">
                                  {formatTime(item.fecha_programada)}
                                  {item.plataformas?.length > 0
                                    ? ` · ${item.plataformas.join(' · ')}`
                                    : ''}
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

                            {(item.formato ||
                              item.producto_relacionado ||
                              item.campana_relacionada) && (
                              <div className="mt-3 pt-3 border-t border-[#f3dede]">
                                <p className="text-xs text-[#b07a7a] break-words">
                                  {item.formato || 'Sin formato'}
                                  {item.producto_relacionado
                                    ? ` · ${item.producto_relacionado}`
                                    : ''}
                                  {!item.producto_relacionado &&
                                  item.campana_relacionada
                                    ? ` · ${item.campana_relacionada}`
                                    : ''}
                                </p>
                              </div>
                            )}
                          </article>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </section>

            <section className="hidden md:block bg-white border border-[#f3dede] rounded-[26px] overflow-hidden">
              <div className="grid grid-cols-7 border-b border-[#f3dede] bg-[#f8eeee]">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(
                  (day) => (
                    <div
                      key={day}
                      className="px-4 py-4 text-[11px] uppercase tracking-[0.14em] text-[#b07a7a]"
                    >
                      {day}
                    </div>
                  )
                )}
              </div>

              <div className="grid grid-cols-7">
                {monthDays.map((day, index) => {
                  if (!day) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="min-h-[165px] bg-[#fffafa]/40 border-r border-b border-[#f3dede]"
                      />
                    )
                  }

                  const dateKey = getDateKey(day)
                  const items = itemsByDate[dateKey] || []
                  const isToday = getDateKey(day) === getDateKey(new Date())

                  return (
                    <div
                      key={dateKey}
                      className="min-h-[165px] border-r border-b border-[#f3dede] p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            isToday
                              ? 'bg-[#8c0303] text-white'
                              : 'text-[#7a0000]'
                          }`}
                        >
                          {day.getDate()}
                        </span>

                        {items.length > 0 && (
                          <span className="text-[10px] text-[#b07a7a]">
                            {items.length} item(s)
                          </span>
                        )}
                      </div>

                      <div className="mt-3 space-y-2">
                        {items.slice(0, 3).map((item) => (
                          <article
                            key={item.id}
                            className="rounded-xl border border-[#f3dede] bg-[#fffafa] px-2.5 py-2"
                          >
                            <p className="text-[11px] font-semibold text-[#7a0000] truncate">
                              {item.titulo}
                            </p>

                            <p className="mt-1 text-[10px] text-[#b07a7a] truncate">
                              {formatTime(item.fecha_programada)}
                              {item.plataformas?.length > 0
                                ? ` · ${item.plataformas[0]}`
                                : ''}
                            </p>

                            <span
                              className={`${getStatusStyle(
                                item.estado
                              )} inline-flex mt-2 px-2 py-0.5 rounded-full text-[9px] font-semibold`}
                            >
                              {item.estado}
                            </span>
                          </article>
                        ))}

                        {items.length > 3 && (
                          <p className="px-1 text-[10px] font-semibold text-[#8c0303]">
                            +{items.length - 3} más
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  )
}

function EmptyState({ text }) {
  return (
    <div className="min-h-[180px] px-5 flex flex-col items-center justify-center text-center">
      <CalendarDays size={30} className="text-[#b07a7a]" />

      <p className="mt-4 text-sm font-semibold text-[#7a0000]">
        Sin publicaciones programadas
      </p>

      <p className="mt-1 text-sm text-[#b07a7a]">
        {text}
      </p>
    </div>
  )
}