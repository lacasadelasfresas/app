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

      const { data: usuarioData } = await supabase
        .from('usuarios')
        .select('nombre, email, rol')
        .eq('auth_user_id', authUserId)
        .single()

      if (!usuarioData) return

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
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  function handleNavigate() {
    if (onNavigate) onNavigate()
  }

  function linkClass(path) {
    return `w-full flex items-center gap-3 px-3 py-[7px] rounded-xl text-[14px] transition ${
      isActive(path)
        ? 'bg-[#8c0303] text-white font-semibold shadow-sm'
        : 'text-[#2e2e2e] hover:bg-[#fff1f1]'
    } ${collapsed ? 'justify-center px-2' : ''}`
  }

  function sectionTitle(label) {
    if (collapsed) return null

    return (
      <p className="text-[11px] text-[#c2aaaa] mt-3 mb-1 tracking-[0.2em] font-medium px-2 uppercase leading-none">
        {label}
      </p>
    )
  }

  return (
 <aside
  className={`relative z-[100] h-full md:h-screen bg-white text-[#2e2e2e] border-r border-[#f1dede] flex flex-col transition-all duration-300 overflow-hidden md:overflow-visible w-[250px] ${
        collapsed ? 'md:w-[82px]' : 'md:w-[250px]'
      }`}
    >
      {/* Logo: visible únicamente en desktop */}
<div className="hidden md:flex relative h-[82px] px-5 items-center justify-center border-b border-[#f1dede] shrink-0 bg-white">        {!collapsed && (
          <Image
            src="/logo.png"
            alt="La Casa de las Fresas"
            width={180}
            height={50}
            priority
 className="object-contain w-[220px] h-auto scale-[1.10]"
          />
        )}

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-1/2 -translate-y-1/2 -right-4 z-[150] w-9 h-9 rounded-full bg-[#8c0303] text-white items-center justify-center text-xl shadow-lg border-2 border-white hover:scale-105 transition-transform"
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>
      
<nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain md:overflow-hidden px-4 py-2 space-y-[1px]">        {sectionTitle('Principal')}

<button
  type="button"
  onClick={() => {
    handleNavigate()
    router.push('/app/cuadro-de-mandos')
  }}
  className={`${linkClass(
    '/app/cuadro-de-mandos'
  )} relative z-[200] cursor-pointer`}
>
  <LayoutDashboard size={18} />
  {!collapsed && 'Dashboard General'}
</button>

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

      <div className="border-t border-[#f1dede] px-3 py-2 bg-white shrink-0">
        <div
          className={`flex gap-2 items-center ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-[#8c0303] text-white flex items-center justify-center text-xs font-bold shrink-0">
            {usuario.nombre?.charAt(0)?.toUpperCase() || 'U'}
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-[#7a0000] truncate leading-tight">
                {usuario.nombre || 'Usuario'}
              </p>

              <p className="text-[13px] text-[#b07a7a] truncate leading-tight mt-0.5">
                {usuario.email || 'Sin email'}
              </p>

              <p className="text-[13px] text-[#8c0303] font-semibold mt-0.5">
                {usuario.rol || 'Sin rol'}
              </p>
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            type="button"
            onClick={cerrarSesion}
            className="mt-2 w-full rounded-xl border border-[#efcaca] px-3 py-1.5 text-[10px] font-semibold text-[#8c0303] hover:bg-[#fff1f1]"
          >
            Cerrar sesión
          </button>
        )}
      </div>
    </aside>
  )
}