'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  ShoppingBag,
  FileText,
  DollarSign,
  Wallet,
  Boxes,
  ScrollText,
  Calendar,
  Megaphone,
  Mail,
  BarChart3,
  ShieldCheck,
  Repeat,
} from 'lucide-react'

import { supabase } from '@/lib/supabaseClient'

export default function Sidebar({
  collapsed,
  setCollapsed,
  onNavigate,
}) {
  const pathname = usePathname()
  const router = useRouter()

  const [usuario, setUsuario] = useState({
    nombre: '',
    email: '',
    rol: '',
  })

  useEffect(() => {
    async function cargarUsuario() {
      const { data } = await supabase.auth.getSession()
      const authUserId = data.session?.user?.id

      if (!authUserId) return

      const { data: usuarioData, error } = await supabase
        .from('usuarios')
        .select('nombre, email, rol')
        .eq('auth_user_id', authUserId)
        .single()

      if (error || !usuarioData) {
        console.error('Error cargando usuario del sidebar:', error)
        return
      }

      setUsuario({
        nombre: usuarioData.nombre || 'Usuario',
        email: usuarioData.email || '',
        rol: usuarioData.rol || '',
      })
    }

    cargarUsuario()
  }, [])

  async function cerrarSesion() {
    await supabase.auth.signOut()

    localStorage.removeItem('usuarioRol')
    localStorage.removeItem('usuarioNombre')
    localStorage.removeItem('usuarioEmail')
    localStorage.removeItem('debeCambiarPassword')

    router.replace('/login')
  }

  function isActive(path) {
    if (path === '/') return pathname === '/'

    return pathname === path || pathname.startsWith(`${path}/`)
  }

  function linkClass(path) {
    return `w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition ${
      isActive(path)
        ? 'bg-[#8c0303] text-white font-semibold shadow-sm'
        : 'text-[#2e2e2e] hover:bg-[#fff1f1]'
    } ${collapsed ? 'justify-center' : ''}`
  }

  function sectionTitle(label) {
    if (collapsed) return null

    return (
      <p className="text-[10px] text-[#b8a1a1] mt-4 mb-1.5 tracking-[0.22em] font-medium px-2 uppercase">
        {label}
      </p>
    )
  }

  function handleNavigate() {
    if (onNavigate) {
      onNavigate()
    }
  }

  return (
    <aside
      className={`h-full md:h-screen overflow-hidden bg-white text-[#2e2e2e] border-r border-[#f1dede] flex flex-col transition-all duration-300 w-[250px] ${
        collapsed ? 'md:w-[82px]' : 'md:w-[250px]'
      }`}
    >
      <div className="relative h-[72px] md:h-[88px] px-6 flex items-center justify-center border-b border-[#f1dede] shrink-0">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute top-6 -right-4 z-50 w-8 h-8 rounded-full bg-[#8c0303] text-white items-center justify-center text-lg shadow-lg border-2 border-white"
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed ? '›' : '‹'}
        </button>

        {!collapsed && (
          <Image
            src="/logo.png"
            alt="La Casa de las Fresas"
            width={120}
            height={60}
            priority
            className="object-contain w-[145px] h-auto max-h-[56px]"
          />
        )}
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 space-y-1">
        {sectionTitle('Principal')}

        <Link
          href="/app/cuadro-de-mandos"
          onClick={handleNavigate}
          className={linkClass('/app/cuadro-de-mandos')}
        >
          <LayoutDashboard size={18} />
          {!collapsed && 'Dashboard General'}
        </Link>

        {sectionTitle('Operación')}

        <Link
          href="/pedidos"
          onClick={handleNavigate}
          className={linkClass('/pedidos')}
        >
          <ShoppingBag size={18} />
          {!collapsed && 'Registro de Ventas'}
        </Link>

        <Link
          href="/cotizaciones"
          onClick={handleNavigate}
          className={linkClass('/cotizaciones')}
        >
          <FileText size={18} />
          {!collapsed && 'Cotizaciones'}
        </Link>

        {sectionTitle('Reportes')}

        <Link
          href="/gastos-recurrentes"
          onClick={handleNavigate}
          className={linkClass('/gastos-recurrentes')}
        >
          <Repeat size={18} />
          {!collapsed && 'Gastos recurrentes'}
        </Link>

        <Link
          href="/ventas"
          onClick={handleNavigate}
          className={linkClass('/ventas')}
        >
          <DollarSign size={18} />
          {!collapsed && 'Análisis de Ventas'}
        </Link>

        <Link
          href="/finanzas"
          onClick={handleNavigate}
          className={linkClass('/finanzas')}
        >
          <Wallet size={18} />
          {!collapsed && 'Finanzas'}
        </Link>

        {sectionTitle('Cuadro de Mandos')}

        <Link
          href="/centro-contenido"
          onClick={handleNavigate}
          className={linkClass('/centro-contenido')}
        >
          <FileText size={18} />
          {!collapsed && 'Centro de Contenido'}
        </Link>

        <Link
          href="/calendario-editorial"
          onClick={handleNavigate}
          className={linkClass('/calendario-editorial')}
        >
          <Calendar size={18} />
          {!collapsed && 'Calendario Editorial'}
        </Link>

        <Link
          href="/campanas"
          onClick={handleNavigate}
          className={linkClass('/campanas')}
        >
          <Megaphone size={18} />
          {!collapsed && 'Campañas'}
        </Link>

        <Link
          href="/embudos-email"
          onClick={handleNavigate}
          className={linkClass('/embudos-email')}
        >
          <Mail size={18} />
          {!collapsed && 'Embudos & Email'}
        </Link>

        <Link
          href="/analitica"
          onClick={handleNavigate}
          className={linkClass('/analitica')}
        >
          <BarChart3 size={18} />
          {!collapsed && 'Analítica'}
        </Link>

        {sectionTitle('Inventario')}

        <Link
          href="/inventario"
          onClick={handleNavigate}
          className={linkClass('/inventario')}
        >
          <Boxes size={18} />
          {!collapsed && 'Inventario'}
        </Link>

        <Link
          href="/recipes"
          onClick={handleNavigate}
          className={linkClass('/recipes')}
        >
          <ScrollText size={18} />
          {!collapsed && 'Recipes'}
        </Link>

        {sectionTitle('Administración')}

        <Link
          href="/auditoria"
          onClick={handleNavigate}
          className={linkClass('/auditoria')}
        >
          <ShieldCheck size={18} />
          {!collapsed && 'Auditoría'}
        </Link>
      </nav>

      <div className="border-t border-[#f1dede] px-3 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] bg-white shrink-0">
        <div
          className={`${collapsed ? 'justify-center' : ''} flex gap-3 items-center`}
        >
          <div className="w-9 h-9 rounded-full bg-[#8c0303] text-white flex items-center justify-center text-sm font-bold shrink-0">
            {usuario.nombre?.charAt(0)?.toUpperCase() || 'U'}
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#7a0000] truncate">
                {usuario.nombre || 'Usuario'}
              </p>

              <p className="text-[10px] text-[#b07a7a] truncate">
                {usuario.email || 'Sin email'}
              </p>

              <p className="text-[10px] text-[#8c0303] font-semibold mt-0.5">
                {usuario.rol || 'Sin rol'}
              </p>
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            type="button"
            onClick={cerrarSesion}
            className="mt-3 w-full rounded-xl border border-[#efcaca] px-3 py-2 text-[11px] font-semibold text-[#8c0303] hover:bg-[#fff1f1]"
          >
            Cerrar sesión
          </button>
        )}
      </div>
    </aside>
  )
}