'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Eye,
  FileText,
  FolderKanban,
  FolderOpen,
  Image as ImageIcon,
  Lightbulb,
  LayoutList,
  MessageCircle,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Trophy,
  Video,
  WandSparkles,
} from 'lucide-react'

function formatDate(dateValue) {
  if (!dateValue) return 'Sin fecha'

  return new Intl.DateTimeFormat('es-PA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateValue))
}

function formatShortDate(dateValue) {
  if (!dateValue) return 'Sin fecha'

  return new Intl.DateTimeFormat('es-PA', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(dateValue))
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

function getPlatformLabel(platforms) {
  if (!platforms || platforms.length === 0) {
    return 'Sin plataforma'
  }

  return platforms.join(' · ')
}

export default function CentroDeContenidoPage() {
  const [contenido, setContenido] = useState([])
  const [loading, setLoading] = useState(true)

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
      console.error('Error cargando contenido:', error)
      alert('No se pudo cargar el Centro de Contenido.')
      setLoading(false)
      return
    }

    const contenidoBase = data || []
    const contenidoIds = contenidoBase.map((item) => item.id)

    if (contenidoIds.length === 0) {
      setContenido([])
      setLoading(false)
      return
    }

    const { data: archivosData, error: archivosError } = await supabase
      .from('contenido_archivos')
      .select('*')
      .in('contenido_id', contenidoIds)
      .eq('es_principal', true)

    if (archivosError) {
      console.error('Error cargando diseños principales:', archivosError)
      setContenido(contenidoBase)
      setLoading(false)
      return
    }

    const archivosConUrl = await Promise.all(
      (archivosData || []).map(async (archivo) => {
        const { data: signedData, error: signedError } =
          await supabase.storage
            .from('contenido-media')
            .createSignedUrl(archivo.storage_path, 60 * 60)

        if (signedError) {
          console.error(
            `Error creando URL firmada para ${archivo.nombre_archivo}:`,
            signedError
          )
        }

        return {
          ...archivo,
          signedUrl: signedData?.signedUrl || '',
        }
      })
    )

    const archivoPorContenido = archivosConUrl.reduce(
      (accumulator, archivo) => {
        accumulator[archivo.contenido_id] = archivo
        return accumulator
      },
      {}
    )

    const contenidoConDiseño = contenidoBase.map((item) => ({
      ...item,
      archivo_principal: archivoPorContenido[item.id] || null,
    }))

    setContenido(contenidoConDiseño)
    setLoading(false)
  }

  const resumen = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const ideas = contenido.filter((item) => item.estado === 'Idea').length

    const produccion = contenido.filter(
      (item) => item.estado === 'En producción'
    ).length

    const aprobacion = contenido.filter(
      (item) => item.estado === 'Pendiente de aprobación'
    ).length

    const programados = contenido.filter(
      (item) => item.estado === 'Programado'
    ).length

    const publicadosMes = contenido.filter((item) => {
      if (item.estado !== 'Publicado' || !item.fecha_publicada) {
        return false
      }

      const fecha = new Date(item.fecha_publicada)

      return (
        fecha.getMonth() === currentMonth &&
        fecha.getFullYear() === currentYear
      )
    }).length

    return {
      ideas,
      produccion,
      aprobacion,
      programados,
      publicadosMes,
    }
  }, [contenido])

  const proximaPublicacion = useMemo(() => {
    const now = new Date()

    return contenido
      .filter((item) => {
        if (!item.fecha_programada) return false

        const fecha = new Date(item.fecha_programada)

        return (
          fecha >= now &&
          ['Programado', 'Listo para publicar', 'Planificado'].includes(
            item.estado
          )
        )
      })
      .sort(
        (a, b) =>
          new Date(a.fecha_programada) - new Date(b.fecha_programada)
      )[0]
  }, [contenido])

  const proximosContenidos = useMemo(() => {
    const now = new Date()

    return contenido
      .filter((item) => {
        if (!item.fecha_programada) return false

        const fecha = new Date(item.fecha_programada)

        return (
          fecha >= now &&
          ['Programado', 'Listo para publicar', 'Planificado'].includes(
            item.estado
          )
        )
      })
      .sort(
        (a, b) =>
          new Date(a.fecha_programada) - new Date(b.fecha_programada)
      )
      .slice(0, 5)
  }, [contenido])

  const contenidoDestacado = useMemo(() => {
    if (contenido.length === 0) return null

    return [...contenido]
      .filter((item) => item.estado === 'Publicado')
      .sort((a, b) => {
        const rendimientoA =
          Number(a.likes || 0) +
          Number(a.comentarios || 0) +
          Number(a.guardados || 0) * 2 +
          Number(a.compartidos || 0) * 2 +
          Number(a.pedidos_generados || 0) * 5

        const rendimientoB =
          Number(b.likes || 0) +
          Number(b.comentarios || 0) +
          Number(b.guardados || 0) * 2 +
          Number(b.compartidos || 0) * 2 +
          Number(b.pedidos_generados || 0) * 5

        return rendimientoB - rendimientoA
      })[0]
  }, [contenido])

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
                Centro de Contenido
              </h1>

              <p className="mt-1 text-xs text-[#b07a7a] md:text-sm">
                Controla ideas, publicaciones, campañas y rendimiento comercial.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 lg:w-auto xl:flex-row xl:items-center xl:justify-end">
              <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto">
                <Link
                  href="/centro-de-contenido/kanban"
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#efcccc] bg-white px-4 text-sm font-semibold text-[#8c0303] hover:bg-[#fff5f5] sm:w-auto"
                >
                  <FolderKanban size={16} />
                  Kanban
                </Link>

                <Link
                  href="/centro-de-contenido/calendario"
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#efcccc] bg-white px-4 text-sm font-semibold text-[#8c0303] hover:bg-[#fff5f5] sm:w-auto"
                >
                  <CalendarDays size={16} />
                  Calendario
                </Link>

                <Link
                  href="/centro-de-contenido/lista"
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#efcccc] bg-white px-4 text-sm font-semibold text-[#8c0303] hover:bg-[#fff5f5] sm:w-auto"
                >
                  <LayoutList size={16} />
                  Lista
                </Link>
              </div>

              <div className="mx-1 hidden h-7 w-px bg-[#f1dede] xl:block" />

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Link
                  href="/centro-de-contenido/biblioteca"
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#8c0303] px-4 text-sm font-semibold text-white hover:bg-[#720000] sm:w-auto"
                >
                  <FolderOpen size={16} />
                  Biblioteca
                </Link>

                <button
                  type="button"
                  onClick={fetchContenido}
                  disabled={loading}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#efcccc] bg-white px-4 text-sm font-semibold text-[#8c0303] hover:bg-[#fff5f5] disabled:opacity-60 sm:w-auto"
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

      <section className="mx-auto max-w-[1500px] space-y-5 px-4 py-5 md:px-8 md:py-7">
        <section className="relative overflow-hidden rounded-[26px] border border-[#f3dede] bg-white p-5 md:p-6">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full border border-[#f3dede] opacity-70" />
          <div className="absolute right-8 top-8 h-20 w-20 rounded-full border border-[#f7e5e5] opacity-70" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff1f1] text-[#8c0303]">
                  <Sparkles size={20} />
                </div>

                <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
                  Vista general
                </p>
              </div>

              <h2 className="mt-4 text-[22px] font-bold text-[#7a0000] md:text-[27px]">
                Convierte tu contenido en una herramienta de ventas.
              </h2>

              <p className="mt-2 text-sm text-[#b07a7a] md:text-base">
                Aquí podrás ver qué está pendiente, qué requiere aprobación y
                qué publicaciones están generando resultados para La Casa de las
                Fresas.
              </p>
            </div>

            <div className="w-full shrink-0 lg:w-[370px]">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-[#f3dede] bg-[#fffafa] p-4">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[#b9a0a0]">
                    Total registrado
                  </p>

                  <p className="mt-2 text-[28px] font-bold text-[#7a0000]">
                    {contenido.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#f3dede] bg-[#fffafa] p-4">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[#b9a0a0]">
                    Publicados este mes
                  </p>

                  <p className="mt-2 text-[28px] font-bold text-[#7a0000]">
                    {resumen.publicadosMes}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex justify-center">
                <Link
                  href="/centro-de-contenido/biblioteca?nuevo=1"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#8c0303] px-5 text-sm font-semibold text-white transition hover:bg-[#720000]"
                >
                  <Plus size={17} />
                  Programar contenido
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <KpiCard
            label="Ideas pendientes"
            value={resumen.ideas}
            icon={<Lightbulb size={19} />}
          />

          <KpiCard
            label="En producción"
            value={resumen.produccion}
            icon={<WandSparkles size={19} />}
          />

          <KpiCard
            label="Por aprobar"
            value={resumen.aprobacion}
            icon={<ClipboardList size={19} />}
          />

          <KpiCard
            label="Programados"
            value={resumen.programados}
            icon={<CalendarDays size={19} />}
          />

          <KpiCard
            label="Publicados este mes"
            value={resumen.publicadosMes}
            icon={<CheckCircle2 size={19} />}
          />
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[26px] border border-[#f3dede] bg-white p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
                  Próxima publicación
                </p>

                <h2 className="mt-2 text-[20px] font-bold text-[#7a0000] md:text-[23px]">
                  {proximaPublicacion
                    ? proximaPublicacion.titulo
                    : 'No tienes contenido programado'}
                </h2>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff1f1] text-[#8c0303]">
                <Send size={19} />
              </div>
            </div>

            {proximaPublicacion ? (
              <>
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[150px_1fr]">
                  <ContentThumbnail
                    item={proximaPublicacion}
                    className="aspect-square w-full max-w-[180px] md:max-w-none"
                    iconSize={20}
                  />

                  <div className="min-w-0">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <InfoBox
                        label="Fecha"
                        value={formatDate(
                          proximaPublicacion.fecha_programada
                        )}
                      />

                      <InfoBox
                        label="Plataforma"
                        value={getPlatformLabel(
                          proximaPublicacion.plataformas
                        )}
                      />

                      <InfoBox
                        label="Formato"
                        value={
                          proximaPublicacion.formato ||
                          'Sin formato definido'
                        }
                      />
                    </div>

                    <div className="mt-3 rounded-2xl border border-[#f3dede] bg-[#fffafa] p-4">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[#b9a0a0]">
                        Estado actual
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <span
                          className={`${getStatusStyle(
                            proximaPublicacion.estado
                          )} rounded-full px-3 py-1 text-xs font-semibold`}
                        >
                          {proximaPublicacion.estado}
                        </span>

                        {proximaPublicacion.producto_relacionado && (
                          <span className="text-sm text-[#b07a7a]">
                            Producto: {proximaPublicacion.producto_relacionado}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-[#efcccc] bg-[#fffafa] px-5 py-8 text-center">
                <CalendarDays
                  size={28}
                  className="mx-auto text-[#b07a7a]"
                />

                <p className="mt-3 text-sm font-semibold text-[#7a0000]">
                  Aún no hay publicaciones próximas.
                </p>

                <p className="mt-1 text-xs text-[#b07a7a]">
                  Cuando registremos contenido programado, aparecerá aquí.
                </p>
              </div>
            )}
          </article>

          <article className="rounded-[26px] border border-[#f3dede] bg-white p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
                  Mejor contenido
                </p>

                <h2 className="mt-2 text-[20px] font-bold text-[#7a0000] md:text-[23px]">
                  {contenidoDestacado
                    ? contenidoDestacado.titulo
                    : 'Sin métricas todavía'}
                </h2>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff1f1] text-[#8c0303]">
                <Trophy size={19} />
              </div>
            </div>

            {contenidoDestacado ? (
              <>
                <div className="mt-5 flex gap-4">
                  <ContentThumbnail
                    item={contenidoDestacado}
                    className="h-[98px] w-[98px] shrink-0"
                    iconSize={18}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[#b07a7a]">
                      {getPlatformLabel(contenidoDestacado.plataformas)}
                      {contenidoDestacado.formato
                        ? ` · ${contenidoDestacado.formato}`
                        : ''}
                    </p>

                    <span
                      className={`${getStatusStyle(
                        contenidoDestacado.estado
                      )} mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold`}
                    >
                      {contenidoDestacado.estado}
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <MetricBox
                    label="Alcance"
                    value={contenidoDestacado.alcance || 0}
                    icon={<Eye size={15} />}
                  />

                  <MetricBox
                    label="Guardados"
                    value={contenidoDestacado.guardados || 0}
                    icon={<FileText size={15} />}
                  />

                  <MetricBox
                    label="Mensajes"
                    value={contenidoDestacado.mensajes_recibidos || 0}
                    icon={<MessageCircle size={15} />}
                  />

                  <MetricBox
                    label="Pedidos"
                    value={contenidoDestacado.pedidos_generados || 0}
                    icon={<Plus size={15} />}
                  />
                </div>
              </>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-[#efcccc] bg-[#fffafa] px-5 py-8 text-center">
                <Trophy size={28} className="mx-auto text-[#b07a7a]" />

                <p className="mt-3 text-sm font-semibold text-[#7a0000]">
                  Todavía no hay contenido publicado.
                </p>

                <p className="mt-1 text-xs text-[#b07a7a]">
                  Al registrar métricas, aquí veremos qué contenido funciona
                  mejor.
                </p>
              </div>
            )}
          </article>
        </section>

        <section className="overflow-hidden rounded-[26px] border border-[#f3dede] bg-white">
          <div className="border-b border-[#f3dede] p-5 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
                  Organización semanal
                </p>

                <h2 className="mt-1 text-[20px] font-bold text-[#7a0000] md:text-[23px]">
                  Próximos contenidos
                </h2>

                <p className="mt-1 text-sm text-[#b07a7a]">
                  Publicaciones que ya tienen fecha programada.
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#fff1f1] text-[#8c0303]">
                <CalendarDays size={18} />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-[#b07a7a]">
              Cargando contenido...
            </div>
          ) : proximosContenidos.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <CalendarDays
                size={30}
                className="mx-auto text-[#b07a7a]"
              />

              <p className="mt-3 text-sm font-semibold text-[#7a0000]">
                No hay publicaciones próximas.
              </p>

              <p className="mt-1 text-xs text-[#b07a7a]">
                Este espacio mostrará los contenidos que estén listos o
                programados.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#f3dede]">
              {proximosContenidos.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col gap-4 p-5 hover:bg-[#fffafa] sm:flex-row sm:items-center sm:justify-between md:px-6"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <ContentThumbnail
                      item={item}
                      className="h-14 w-14 shrink-0"
                      iconSize={14}
                    />

                    <div className="min-w-0">
                      <p className="break-words font-bold text-[#7a0000]">
                        {item.titulo}
                      </p>

                      <p className="mt-1 break-words text-sm text-[#b07a7a]">
                        {formatShortDate(item.fecha_programada)}
                        {' · '}
                        {getPlatformLabel(item.plataformas)}
                        {item.formato ? ` · ${item.formato}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span
                      className={`${getStatusStyle(
                        item.estado
                      )} rounded-full px-3 py-1 text-xs font-semibold`}
                    >
                      {item.estado}
                    </span>

                    <ChevronRight size={18} className="text-[#b07a7a]" />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

function ContentThumbnail({ item, className = '', iconSize = 16 }) {
  const archivoPrincipal = item.archivo_principal
  const esVideo = archivoPrincipal?.tipo_archivo === 'video'

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[#f3dede] bg-[#fffafa] ${className}`}
    >
      {archivoPrincipal?.signedUrl ? (
        esVideo ? (
          <>
            <video
              src={archivoPrincipal.signedUrl}
              muted
              preload="metadata"
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#8c0303] shadow-sm">
                <Video size={iconSize} />
              </div>
            </div>
          </>
        ) : (
          <img
            src={archivoPrincipal.signedUrl}
            alt={item.titulo}
            className="h-full w-full object-cover"
          />
        )
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-2 text-center text-[#b07a7a]">
          <ImageIcon size={iconSize} />

          <span className="text-[9px] font-semibold">
            Sin diseño
          </span>
        </div>
      )}
    </div>
  )
}

function KpiCard({ label, value, icon }) {
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

function InfoBox({ label, value }) {
  return (
    <div className="min-w-0 rounded-2xl border border-[#f3dede] bg-[#fffafa] p-4">
      <p className="text-[10px] uppercase tracking-[0.13em] text-[#b9a0a0]">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-[#7a0000]">
        {value}
      </p>
    </div>
  )
}

function MetricBox({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-[#f3dede] bg-[#fffafa] p-4">
      <div className="flex items-center gap-2 text-[#b07a7a]">
        {icon}

        <p className="text-[10px] uppercase tracking-[0.12em]">
          {label}
        </p>
      </div>

      <p className="mt-2 text-[22px] font-bold text-[#7a0000]">
        {value}
      </p>
    </div>
  )
}