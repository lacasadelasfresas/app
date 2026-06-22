'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Eye,
  FolderKanban,
  Lightbulb,
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
  'Archivado',
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

export default function KanbanContenidoPage() {
  const [contenido, setContenido] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [platformFilter, setPlatformFilter] = useState('Todos')

  useEffect(() => {
    fetchContenido()
  }, [])

  async function fetchContenido() {
    setLoading(true)

    const { data, error } = await supabase
      .from('contenido')
      .select('*')
      .neq('estado', 'Archivado')
      .order('prioridad', { ascending: true })
      .order('fecha_programada', { ascending: true, nullsFirst: false })

    if (error) {
      console.error('Error cargando Kanban:', error)
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
                Vista Kanban
              </h1>

              <p className="mt-1 text-xs md:text-sm text-[#b07a7a]">
                Mueve cada contenido según la etapa real de producción.
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

              <Link
                href="/centro-de-contenido/biblioteca"
                className="w-full sm:w-auto h-10 px-4 rounded-xl bg-[#8c0303] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#720000]"
              >
                <FolderKanban size={16} />
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
                Flujo de trabajo
              </p>

              <h2 className="mt-1 text-[20px] font-bold text-[#7a0000]">
                Organiza el contenido por etapa
              </h2>

              <p className="mt-1 text-sm text-[#b07a7a]">
                Actualiza el estado desde cada tarjeta y el tablero se moverá automáticamente.
              </p>
            </div>

            <select
              value={platformFilter}
              onChange={(event) => setPlatformFilter(event.target.value)}
              className="w-full lg:w-[260px] h-10 rounded-xl border border-[#efcccc] bg-white px-4 text-sm text-[#2e2e2e] outline-none focus:border-[#8c0303]"
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
            Cargando tablero...
          </div>
        ) : (
<div className="overflow-x-auto pb-4">
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 min-w-[1320px] xl:min-w-0">
              {COLUMNAS.map((column) => {
                const Icon = column.icon
                const items = getItemsByStatus(column.estado)

                return (
                  <section
                    key={column.estado}
  className="w-full min-w-0"
>
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
                          <article
                            key={item.id}
                            className="bg-white border border-[#f3dede] rounded-[20px] p-4 shadow-[0_4px_20px_rgba(122,0,0,0.03)]"
                          >
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
                                  {formatDate(item.fecha_programada)}
                                </span>
                              )}
                            </div>

                            <h4 className="mt-3 text-[16px] font-bold text-[#7a0000] leading-snug break-words">
                              {item.titulo}
                            </h4>

                            <p className="mt-2 text-xs text-[#b07a7a] break-words">
                              {item.plataformas?.join(' · ') ||
                                'Sin plataforma'}
                              {item.formato ? ` · ${item.formato}` : ''}
                            </p>

                            {(item.producto_relacionado ||
                              item.campana_relacionada) && (
                              <div className="mt-3 rounded-xl bg-[#fffafa] border border-[#f3dede] px-3 py-2">
                                <p className="text-[10px] text-[#b07a7a] break-words">
                                  {item.producto_relacionado ||
                                    item.campana_relacionada}
                                </p>
                              </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-[#f3dede]">
                              <label className="block text-[10px] uppercase tracking-[0.12em] text-[#b9a0a0] mb-2">
                                Mover a
                              </label>

                              <div className="flex gap-2">
                                <select
                                  value={item.estado}
                                  onChange={(event) =>
                                    cambiarEstado(
                                      item.id,
                                      event.target.value
                                    )
                                  }
                                  disabled={updatingId === item.id}
                                  className="flex-1 h-10 rounded-xl border border-[#efcccc] bg-white px-3 text-xs text-[#2e2e2e] outline-none focus:border-[#8c0303] disabled:opacity-60"
                                >
                                  {ESTADOS.map((status) => (
                                    <option key={status} value={status}>
                                      {status}
                                    </option>
                                  ))}
                                </select>

                                <Link
                                  href="/centro-de-contenido/biblioteca"
                                  className="w-10 h-10 rounded-xl border border-[#efcccc] text-[#8c0303] flex items-center justify-center hover:bg-[#fff5f5]"
                                  title="Abrir biblioteca para editar"
                                >
                                  <ChevronRight size={17} />
                                </Link>
                              </div>
                            </div>
                          </article>
                        ))
                      )}
                    </div>
                  </section>
                )
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}