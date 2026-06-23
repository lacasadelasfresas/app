'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ClipboardPenLine,
  FileText,
  Film,
  FolderOpen,
  Image as ImageIcon,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Star,
  Trash2,
  Upload,
  Video,
  X,
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

const PLATAFORMAS = [
  'Instagram',
  'TikTok',
  'Facebook',
  'WhatsApp',
  'PedidosYa',
]

const FORMATOS = ['Historia', 'Carrusel', 'Reel', 'Estático']

const PILARES = [
  'Educativo',
  'Emocional',
  'Estratégico',
  'Promocional',
  'Inspiracional',
  'Venta directa',
]

function createEmptyForm() {
  return {
    titulo: '',
    plataformas: [],
    formato: '',
    pilar: '',
    estado: 'Idea',
    fecha_programada: '',
    copy: '',
    cta: '',
    enlace_canva: '',
    enlace_drive: '',
    enlace_publicado: '',
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
    'En producción': 'bg-[#fff1f1] text-[#8c0303]',
    'Listo para publicar': 'bg-[#edf9f3] text-[#17724e]',
    Programado: 'bg-[#eef7ff] text-[#1f6ea4]',
    Publicado: 'bg-[#eaf9f0] text-[#157347]',
    Archivado: 'bg-[#f2f2f2] text-[#707070]',
  }

  return styles[status] || 'bg-[#f4f4f4] text-[#666]'
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
  const [ideaOrigenId, setIdeaOrigenId] = useState(null)

  const [archivos, setArchivos] = useState([])
  const [archivosPendientes, setArchivosPendientes] = useState([])
  const [uploadingMedia, setUploadingMedia] = useState(false)

useEffect(() => {
  async function iniciarBiblioteca() {
    await fetchContenido()

    const params = new URLSearchParams(window.location.search)
    const nuevaIdea = params.get('nuevo') === '1'
    const ideaId = params.get('idea')

    if (nuevaIdea) {
      setEditingId(null)
      setForm(createEmptyForm())
      setArchivos([])
      setArchivosPendientes([])
      setFormOpen(true)
    }

    if (ideaId) {
      const { data: idea, error } = await supabase
        .from('banco_ideas')
        .select('*')
        .eq('id', ideaId)
        .single()

      if (error || !idea) {
        console.error('Error cargando idea para convertir:', error)
        return
      }

      setEditingId(null)
      setIdeaOrigenId(idea.id)
      setArchivos([])
      setArchivosPendientes([])

      setForm({
        titulo: idea.titulo || '',
        plataformas: idea.plataformas || [],
        formato: idea.formato || '',
        pilar: idea.pilar || '',
        estado: 'Idea',
        fecha_programada: '',
        copy: idea.descripcion || '',
        cta: '',
        enlace_canva: '',
        enlace_drive: '',
        enlace_publicado: '',
      })

      setFormOpen(true)
    }

    if (nuevaIdea || ideaId) {
      window.history.replaceState(
        {},
        '',
        '/centro-de-contenido/biblioteca'
      )
    }
  }

  iniciarBiblioteca()
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

  function abrirNuevoContenido() {
    archivosPendientes.forEach((archivo) => {
      if (archivo.signedUrl) {
        URL.revokeObjectURL(archivo.signedUrl)
      }
    })
setIdeaOrigenId(null)
    setEditingId(null)
    setForm(createEmptyForm())
    setArchivos([])
    setArchivosPendientes([])
    setFormOpen(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function resetForm() {
    archivosPendientes.forEach((archivo) => {
      if (archivo.signedUrl) {
        URL.revokeObjectURL(archivo.signedUrl)
      }
    })

    setEditingId(null)
    setForm(createEmptyForm())
    setArchivos([])
    setArchivosPendientes([])
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

  async function cargarArchivos(contenidoId) {
    if (!contenidoId) {
      setArchivos([])
      return
    }

    const { data, error } = await supabase
      .from('contenido_archivos')
      .select('*')
      .eq('contenido_id', contenidoId)
      .order('es_principal', { ascending: false })
      .order('orden', { ascending: true })

    if (error) {
      console.error('Error cargando archivos:', error)
      return
    }

    const archivosConUrl = await Promise.all(
      (data || []).map(async (archivo) => {
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

    setArchivos(archivosConUrl)
  }

  function handleSeleccionarArchivos(event) {
    const selectedFiles = Array.from(event.target.files || [])

    if (selectedFiles.length === 0) return

    const archivosValidos = selectedFiles.filter((file) => {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      const isValidSize = file.size <= 50 * 1024 * 1024

      if (!isImage && !isVideo) {
        alert(`${file.name} no es una imagen o video válido.`)
        return false
      }

      if (!isValidSize) {
        alert(`${file.name} supera el límite de 50 MB.`)
        return false
      }

      return true
    })

    const nuevosPendientes = archivosValidos.map((file) => ({
      id: crypto.randomUUID(),
      file,
      nombre_archivo: file.name,
      mime_type: file.type,
      tamano_bytes: file.size,
      tipo_archivo: file.type.startsWith('video/') ? 'video' : 'imagen',
      signedUrl: URL.createObjectURL(file),
    }))

    setArchivosPendientes((previous) => [
      ...previous,
      ...nuevosPendientes,
    ])

    event.target.value = ''
  }

  function eliminarArchivoPendiente(id) {
    setArchivosPendientes((previous) => {
      const archivo = previous.find((item) => item.id === id)

      if (archivo?.signedUrl) {
        URL.revokeObjectURL(archivo.signedUrl)
      }

      return previous.filter((item) => item.id !== id)
    })
  }

  async function subirArchivosPendientes(contenidoId) {
    if (archivosPendientes.length === 0) return true

    setUploadingMedia(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const tienePrincipal = archivos.some(
        (archivo) => archivo.es_principal
      )

      for (let index = 0; index < archivosPendientes.length; index += 1) {
        const archivo = archivosPendientes[index]

        const safeName = archivo.nombre_archivo
          .replace(/[^\w.-]+/g, '-')
          .toLowerCase()

        const storagePath = `contenido/${contenidoId}/${Date.now()}-${crypto.randomUUID()}-${safeName}`

        const { error: uploadError } = await supabase.storage
          .from('contenido-media')
          .upload(storagePath, archivo.file, {
            contentType: archivo.mime_type,
            upsert: false,
          })

        if (uploadError) {
          throw uploadError
        }

        const { error: metadataError } = await supabase
          .from('contenido_archivos')
          .insert([
            {
              contenido_id: contenidoId,
              bucket_id: 'contenido-media',
              storage_path: storagePath,
              nombre_archivo: archivo.nombre_archivo,
              tipo_archivo: archivo.tipo_archivo,
              mime_type: archivo.mime_type,
              tamano_bytes: archivo.tamano_bytes,
              es_principal: !tienePrincipal && index === 0,
              orden: archivos.length + index,
              creado_por: user?.id || null,
            },
          ])

        if (metadataError) {
          await supabase.storage
            .from('contenido-media')
            .remove([storagePath])

          throw metadataError
        }
      }

      archivosPendientes.forEach((archivo) => {
        if (archivo.signedUrl) {
          URL.revokeObjectURL(archivo.signedUrl)
        }
      })

      setArchivosPendientes([])
      await cargarArchivos(contenidoId)

      return true
    } catch (error) {
      console.error('Error subiendo archivos:', error)
      alert('No se pudieron subir todos los archivos seleccionados.')
      return false
    } finally {
      setUploadingMedia(false)
    }
  }

  async function eliminarArchivoExistente(archivo) {
    const confirmar = confirm(
      `¿Deseas eliminar "${archivo.nombre_archivo}"?`
    )

    if (!confirmar) return

    const { error: storageError } = await supabase.storage
      .from('contenido-media')
      .remove([archivo.storage_path])

    if (storageError) {
      console.error('Error eliminando archivo de Storage:', storageError)
      alert('No se pudo eliminar el archivo.')
      return
    }

    const { error: databaseError } = await supabase
      .from('contenido_archivos')
      .delete()
      .eq('id', archivo.id)

    if (databaseError) {
      console.error('Error eliminando registro del archivo:', databaseError)
      alert('El archivo se eliminó, pero no se pudo actualizar el registro.')
      return
    }

    setArchivos((previous) =>
      previous.filter((item) => item.id !== archivo.id)
    )
  }

  async function marcarComoPrincipal(archivo) {
    if (!editingId || archivo.es_principal) return

    const { error: clearError } = await supabase
      .from('contenido_archivos')
      .update({ es_principal: false })
      .eq('contenido_id', editingId)

    if (clearError) {
      console.error('Error limpiando archivo principal:', clearError)
      alert('No se pudo actualizar el archivo principal.')
      return
    }

    const { error: principalError } = await supabase
      .from('contenido_archivos')
      .update({ es_principal: true })
      .eq('id', archivo.id)

    if (principalError) {
      console.error('Error marcando archivo principal:', principalError)
      alert('No se pudo marcar el archivo principal.')
      return
    }

    setArchivos((previous) =>
      previous.map((item) => ({
        ...item,
        es_principal: item.id === archivo.id,
      }))
    )
  }

  async function editarContenido(item) {
    setIdeaOrigenId(null)
    setEditingId(item.id)
    setArchivosPendientes([])

    setForm({
      titulo: item.titulo || '',
      plataformas: item.plataformas || [],
      formato: item.formato || '',
      pilar: item.pilar || '',
      estado: item.estado || 'Idea',
      fecha_programada: toInputDateTime(item.fecha_programada),
      copy: item.copy || '',
      cta: item.cta || '',
      enlace_canva: item.enlace_canva || '',
      enlace_drive: item.enlace_drive || '',
      enlace_publicado: item.enlace_publicado || '',
    })

    await cargarArchivos(item.id)

    setFormOpen(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  async function guardarContenido() {
    if (!form.titulo.trim()) {
      alert('El título es obligatorio.')
      return
    }

    setSaving(true)

    const payload = {
      titulo: form.titulo.trim(),
      plataformas: form.plataformas,
      formato: form.formato || null,
      pilar: form.pilar || null,
      estado: form.estado,
      fecha_programada: form.fecha_programada
        ? new Date(form.fecha_programada).toISOString()
        : null,
      copy: form.copy.trim() || null,
      cta: form.cta.trim() || null,
      enlace_canva: form.enlace_canva.trim() || null,
      enlace_drive: form.enlace_drive.trim() || null,
      enlace_publicado: form.enlace_publicado.trim() || null,
      updated_at: new Date().toISOString(),
    }

    let contenidoId = editingId

    if (editingId) {
      const { error } = await supabase
        .from('contenido')
        .update(payload)
        .eq('id', editingId)

      if (error) {
        console.error('Error actualizando contenido:', error)
        alert('No se pudo actualizar el contenido.')
        setSaving(false)
        return
      }
    } else {
      const { data, error } = await supabase
        .from('contenido')
        .insert([payload])
        .select('id')
        .single()

      if (error || !data?.id) {
        console.error('Error creando contenido:', error)
        alert('No se pudo crear el contenido.')
        setSaving(false)
        return
      }

      contenidoId = data.id
    }

const uploadSuccess = await subirArchivosPendientes(contenidoId)

if (!uploadSuccess) {
  setSaving(false)
  return
}

if (ideaOrigenId && !editingId) {
  const { error: ideaError } = await supabase
    .from('banco_ideas')
    .update({
      estado: 'Convertida',
      contenido_id: contenidoId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ideaOrigenId)

  if (ideaError) {
    console.error('Error vinculando idea convertida:', ideaError)
  }
}

await fetchContenido()

    const wasEditing = Boolean(editingId)

    resetForm()
    setSaving(false)

    alert(
      wasEditing
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

    const { data: archivosRelacionados, error: archivosError } = await supabase
      .from('contenido_archivos')
      .select('id, storage_path')
      .eq('contenido_id', id)

    if (archivosError) {
      console.error('Error cargando archivos relacionados:', archivosError)
      alert('No se pudo preparar la eliminación del contenido.')
      setDeletingId(null)
      return
    }

    const rutas = (archivosRelacionados || []).map(
      (archivo) => archivo.storage_path
    )

    if (rutas.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('contenido-media')
        .remove(rutas)

      if (storageError) {
        console.error('Error eliminando archivos de Storage:', storageError)
        alert('No se pudieron eliminar los archivos relacionados.')
        setDeletingId(null)
        return
      }

      const { error: deleteFilesError } = await supabase
        .from('contenido_archivos')
        .delete()
        .eq('contenido_id', id)

      if (deleteFilesError) {
        console.error(
          'Error eliminando registros de archivos:',
          deleteFilesError
        )
        alert('No se pudieron eliminar los registros de archivos.')
        setDeletingId(null)
        return
      }
    }

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
        ${item.formato || ''}
        ${item.pilar || ''}
        ${item.copy || ''}
        ${item.cta || ''}
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
                onClick={abrirNuevoContenido}
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
                    Completa los campos esenciales para producir, programar y
                    publicar esta pieza.
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
                description="Define qué pieza es, dónde se publicará y cuándo debe salir."
              />

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
                <Field label="Título *">
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

                <Field label="Fecha programada">
                  <input
                    type="datetime-local"
                    name="fecha_programada"
                    value={form.fecha_programada}
                    onChange={handleChange}
                    className={inputClass}
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
                icon={<Film size={17} />}
                title="Copy, CTA y recursos"
                description="Guarda la información necesaria para producir y publicar sin buscarla después."
              />

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-5">
                <Field label="Copy o guion">
                  <textarea
                    name="copy"
                    value={form.copy}
                    onChange={handleChange}
                    rows={7}
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

                  <Field label="Enlace de Drive">
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
            </div>

            <div className="mt-8 pt-7 border-t border-[#f3dede]">
              <SectionTitle
                icon={<ImageIcon size={17} />}
                title="Diseño, imágenes y videos"
                description="Guarda el arte final, foto de producto, reel o archivo visual asociado a esta publicación."
              />

              <div className="mt-5 rounded-[22px] border border-dashed border-[#efcccc] bg-[#fffafa] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#7a0000]">
                      Adjuntar diseño o video
                    </p>

                    <p className="mt-1 text-xs text-[#b07a7a]">
                      Puedes subir imágenes o videos de hasta 50 MB.
                    </p>
                  </div>

                  <label className="w-full sm:w-auto h-11 px-5 rounded-xl bg-[#8c0303] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#720000] cursor-pointer">
                    <Upload size={17} />
                    Seleccionar archivos

                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleSeleccionarArchivos}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {(archivos.length > 0 || archivosPendientes.length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
                  {archivos.map((archivo) => (
                    <MediaCard
                      key={archivo.id}
                      archivo={archivo}
                      onMakePrimary={() => marcarComoPrincipal(archivo)}
                      onDelete={() => eliminarArchivoExistente(archivo)}
                    />
                  ))}

                  {archivosPendientes.map((archivo) => (
                    <PendingMediaCard
                      key={archivo.id}
                      archivo={archivo}
                      onDelete={() =>
                        eliminarArchivoPendiente(archivo.id)
                      }
                    />
                  ))}
                </div>
              )}

              {uploadingMedia && (
                <div className="mt-4 flex items-center gap-2 text-sm text-[#8c0303]">
                  <LoaderCircle size={17} className="animate-spin" />
                  Subiendo archivos...
                </div>
              )}
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
                disabled={saving || uploadingMedia}
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

                  <div className="mt-3 text-sm text-[#b07a7a]">
                    {item.fecha_programada
                      ? `Programado: ${formatDate(item.fecha_programada)}`
                      : 'Sin fecha programada'}
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
                      onClick={() =>
                        eliminarContenido(item.id, item.titulo)
                      }
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
            <table className="min-w-[1050px] w-full text-sm">
              <thead className="bg-[#f8eeee] text-[#b07a7a] uppercase text-[11px] tracking-[0.14em]">
                <tr>
                  <th className="py-4 px-5 text-left">Contenido</th>
                  <th className="py-4 px-5 text-left">Plataforma</th>
                  <th className="py-4 px-5 text-left">Formato</th>
                  <th className="py-4 px-5 text-left">Pilar</th>
                  <th className="py-4 px-5 text-left">Estado</th>
                  <th className="py-4 px-5 text-left">Fecha</th>
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
                      Cargando contenido...
                    </td>
                  </tr>
                ) : filteredContent.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
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
                              {item.copy
                                ? 'Copy o guion registrado'
                                : 'Sin copy registrado'}
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

                      <td className="py-4 px-5 text-[#2e2e2e]">
                        {item.pilar || '—'}
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
        <h3 className="text-[18px] font-bold text-[#7a0000]">{title}</h3>

        <p className="mt-1 text-sm text-[#b07a7a]">{description}</p>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-[#b07a7a] mb-2">
        {label}
      </span>

      {children}
    </label>
  )
}

function MediaCard({ archivo, onMakePrimary, onDelete }) {
  const esVideo = archivo.tipo_archivo === 'video'

  return (
    <article className="relative overflow-hidden rounded-[22px] border border-[#f3dede] bg-white">
      <div className="aspect-square bg-[#fffafa]">
        {esVideo ? (
          <video
            src={archivo.signedUrl}
            controls
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={archivo.signedUrl}
            alt={archivo.nombre_archivo}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#7a0000] truncate">
              {archivo.nombre_archivo}
            </p>

            <p className="mt-1 text-xs text-[#b07a7a]">
              {esVideo ? 'Video' : 'Imagen'}
            </p>
          </div>

          {archivo.es_principal && (
            <span className="shrink-0 bg-[#fff1f1] text-[#8c0303] px-2 py-1 rounded-full text-[10px] font-bold">
              Principal
            </span>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={onMakePrimary}
            disabled={archivo.es_principal}
            className="flex-1 h-10 rounded-xl border border-[#efcccc] text-[#8c0303] text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#fff5f5] disabled:opacity-50"
          >
            <Star size={14} />
            Principal
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="w-10 h-10 rounded-xl border border-red-200 text-red-600 flex items-center justify-center hover:bg-red-50"
            aria-label={`Eliminar ${archivo.nombre_archivo}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </article>
  )
}

function PendingMediaCard({ archivo, onDelete }) {
  const esVideo = archivo.tipo_archivo === 'video'

  return (
    <article className="relative overflow-hidden rounded-[22px] border border-dashed border-[#efcccc] bg-[#fffafa]">
      <div className="aspect-square">
        {esVideo ? (
          <video
            src={archivo.signedUrl}
            controls
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={archivo.signedUrl}
            alt={archivo.nombre_archivo}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="p-4">
        <p className="text-sm font-semibold text-[#7a0000] truncate">
          {archivo.nombre_archivo}
        </p>

        <p className="mt-1 text-xs text-[#b07a7a]">
          Pendiente de guardar
        </p>

        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-[#8c0303] font-semibold">
            {esVideo ? 'Video' : 'Imagen'}
          </span>

          <button
            type="button"
            onClick={onDelete}
            className="w-10 h-10 rounded-xl border border-red-200 text-red-600 flex items-center justify-center hover:bg-red-50"
            aria-label={`Quitar ${archivo.nombre_archivo}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </article>
  )
}

function EmptyState({ text }) {
  return (
    <div className="min-h-[180px] flex flex-col items-center justify-center text-center px-5">
      <FolderOpen size={31} className="text-[#b07a7a]" />

      <p className="mt-4 text-sm font-semibold text-[#7a0000]">
        No hay contenido para mostrar
      </p>

      <p className="mt-1 text-sm text-[#b07a7a]">{text}</p>
    </div>
  )
}