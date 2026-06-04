'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

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
} from 'lucide-react'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function Sidebar({ collapsed, setCollapsed }) {
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
    const email = data.session?.user?.email

    if (!email) return

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('nombre, email, rol')
      .eq('email', email)
      .single()

    if (usuario) {
      setUsuario({
        nombre: usuario.nombre || 'Usuario',
        email: usuario.email || '',
        rol: usuario.rol || '',
      })
    }
  }

  cargarUsuario()
}, [])

async function cerrarSesion() {
  await supabase.auth.signOut()
  localStorage.removeItem('usuarioRol')
  localStorage.removeItem('usuarioNombre')
  localStorage.removeItem('usuarioEmail')
  router.push('/login')
}

const isActive = (path) => {
  if (path === '/') return pathname === '/'
  return pathname === path || pathname.startsWith(`${path}/`)
}

const linkClass = (path) =>
  `w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition ${
    isActive(path)
      ? 'bg-[#8c0303] text-white font-semibold shadow-sm'
      : 'text-[#2e2e2e] hover:bg-[#fff1f1]'
  } ${collapsed ? 'justify-center' : ''}`
  return (
<aside
  className={`fixed left-0 top-0 z-40 h-screen bg-white text-[#2e2e2e] border-r border-[#f1dede] flex flex-col transition-all duration-300 ${
    collapsed ? 'w-[82px]' : 'w-[250px]'
  }`}
>
      <div>
        <div className="h-[90px] px-8 flex items-center border-b border-[#f1dede]">

<button
  type="button"
  onClick={() => setCollapsed(!collapsed)}
className="absolute top-6 -right-4 z-50 w-8 h-8 rounded-full bg-[#8c0303] text-white flex items-center justify-center text-lg shadow-lg border-2 border-white"
>
  {collapsed ? '›' : '‹'}
</button>

<Image
  src="/logo.png"
  alt="Logo"
  width={120}
  height={60}
  priority
  className="object-contain w-auto h-auto"
/>
        </div>

       <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
<p className="text-[11px] text-[#b8a1a1] mt-5 mb-2 tracking-[0.25em] font-medium px-2">
  PRINCIPAL
</p>

<Link
  href="/app/cuadro-de-mandos"
  className={linkClass('/app/cuadro-de-mandos')}
>
  <LayoutDashboard size={18} />
{!collapsed && 'Dashboard'}
</Link>

{!collapsed && (
<p className="text-[11px] text-[#b8a1a1] mt-5 mb-2 tracking-[0.25em] font-medium px-2">
  OPERACIÓN
</p>
)}

<Link href="/pedidos" className={linkClass('/pedidos')}>
  <ShoppingBag size={18} />
  {!collapsed && 'Registro de Ventas'}
</Link>

<Link href="/cotizaciones" className={linkClass('/cotizaciones')}>
  <FileText size={18} />
  {!collapsed && 'Cotizaciones'}
</Link>

{!collapsed && (
<p className="text-[11px] text-[#b8a1a1] mt-5 mb-2 tracking-[0.25em] font-medium px-2">
  REPORTES
</p>
)}

<Link href="/ventas" className={linkClass('/ventas')}>
  <DollarSign size={18} />
  {!collapsed && 'Análisis de Ventas'}
</Link>

<Link href="/finanzas" className={linkClass('/finanzas')}>
  <Wallet size={18} />
  {!collapsed && 'Finanzas'}
</Link>

{!collapsed && (
  <p className="text-[11px] text-[#b8a1a1] mt-5 mb-2 tracking-[0.25em] font-medium px-2">
    CUADRO DE MANDOS
  </p>
)}

<Link href="/centro-contenido" className={linkClass('/centro-contenido')}>
  <FileText size={18} />
  {!collapsed && 'Centro de Contenido'}
</Link>

<Link href="/calendario-editorial" className={linkClass('/calendario-editorial')}>
  <Calendar size={18} />
  {!collapsed && 'Calendario Editorial'}
</Link>

<Link href="/campanas" className={linkClass('/campanas')}>
  <Megaphone size={18} />
  {!collapsed && 'Campañas'}
</Link>

<Link href="/embudos-email" className={linkClass('/embudos-email')}>
  <Mail size={18} />
  {!collapsed && 'Embudos & Email'}
</Link>

<Link href="/analitica" className={linkClass('/analitica')}>
  <BarChart3 size={18} />
  {!collapsed && 'Analítica'}
</Link>

{!collapsed && (
<p className="text-[11px] text-[#b8a1a1] mt-5 mb-2 tracking-[0.25em] font-medium px-2">
  INVENTARIO
</p>
)}

<Link href="/inventario" className={linkClass('/inventario')}>
  <Boxes size={18} />
  {!collapsed && 'Inventario'}
</Link>

<Link href="/recipes" className={linkClass('/recipes')}>
  <ScrollText size={18} />
  {!collapsed && 'Recipes'}
</Link>

<div className="border-t border-[#f1dede] p-3 bg-white shrink-0">
  <div className={`${collapsed ? 'justify-center' : ''} flex gap-3 items-center`}>
    <div className="w-8 h-8 rounded-full bg-[#8c0303] text-white flex items-center justify-center text-xs font-bold shrink-0">
      {usuario.nombre?.charAt(0) || 'U'}
    </div>

    {!collapsed && (
      <div className="min-w-0">
        <p className="text-xs font-semibold text-[#7a0000] truncate">
          {usuario.nombre || 'Usuario'}
        </p>
        <p className="text-[10px] text-[#b07a7a] truncate">
          {usuario.email}
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

    </div>
  </div>
</aside>
)
}