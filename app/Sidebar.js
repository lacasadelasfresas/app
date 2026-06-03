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
  Package,
  Ticket,
  Boxes,
  ScrollText,
} from 'lucide-react'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function Sidebar() {
  const pathname = usePathname()

const router = useRouter()
const [usuario, setUsuario] = useState({
  nombre: '',
  email: '',
  rol: '',
})

useEffect(() => {
  setUsuario({
    nombre: localStorage.getItem('usuarioNombre') || 'Usuario',
    email: localStorage.getItem('usuarioEmail') || '',
    rol: localStorage.getItem('usuarioRol') || '',
  })
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
  `w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[15px] transition ${
    isActive(path)
      ? 'bg-[#8c0303] text-white'
      : 'text-[#2e2e2e] hover:bg-[#fff1f1]'
  }`
  return (
    <aside className="w-[250px] bg-white border-r border-[#f1dede] flex flex-col justify-between fixed left-0 top-0 h-screen">
      <div>
        <div className="h-[90px] px-8 flex items-center border-b border-[#f1dede]">
<Image
  src="/logo.png"
  alt="Logo"
  width={120}
  height={60}
  priority
  className="object-contain w-auto h-auto"
/>
        </div>

        <div className="p-4">
<p className="text-[11px] text-[#b8a1a1] mt-8 mb-4 tracking-[0.25em] font-medium px-2">
  PRINCIPAL
</p>

<Link
  href="/app/cuadro-de-mandos"
  className={linkClass('/app/cuadro-de-mandos')}
>
  <LayoutDashboard size={18} />
  Dashboard
</Link>

<p className="text-[11px] text-[#b8a1a1] mt-8 mb-4 tracking-[0.25em] font-medium px-2">
  OPERACIÓN
</p>

<Link href="/pedidos" className={linkClass('/pedidos')}>
  <ShoppingBag size={18} />
  Registro de Ventas
</Link>

<Link href="/cotizaciones" className={linkClass('/cotizaciones')}>
  <FileText size={18} />
  Cotizaciones
</Link>

<p className="text-[11px] text-[#b8a1a1] mt-8 mb-4 tracking-[0.25em] font-medium px-2">
  REPORTES
</p>

<Link href="/ventas" className={linkClass('/ventas')}>
  <DollarSign size={18} />
  Análisis de Ventas
</Link>

<Link href="/finanzas" className={linkClass('/finanzas')}>
  <Wallet size={18} />
  Finanzas
</Link>

<p className="text-[11px] text-[#b8a1a1] mt-8 mb-4 tracking-[0.25em] font-medium px-2">
  CATÁLOGO
</p>

<Link href="/productos" className={linkClass('/productos')}>
  <Package size={18} />
  Productos
</Link>

<Link href="/cupones" className={linkClass('/cupones')}>
  <Ticket size={18} />
  Cupones
</Link>

<p className="text-[11px] text-[#b8a1a1] mt-8 mb-4 tracking-[0.25em] font-medium px-2">
  INVENTARIO
</p>

<Link href="/inventario" className={linkClass('/inventario')}>
  <Boxes size={18} />
  Inventario
</Link>

<Link href="/recipes" className={linkClass('/recipes')}>
  <ScrollText size={18} />
  Recipes
</Link>

<div className="p-4 border-t border-[#f1dede]">
  <div className="rounded-2xl bg-[#fff8f8] border border-[#f3dede] p-4">
    <p className="text-sm font-semibold text-[#7a0000] truncate">
      {usuario.nombre}
    </p>

    <p className="text-[11px] text-[#b07a7a] truncate mt-1">
      {usuario.email}
    </p>

    <p className="text-[10px] uppercase tracking-[0.18em] text-[#b9a0a0] mt-2">
      {usuario.rol}
    </p>

    <button
      type="button"
      onClick={cerrarSesion}
      className="mt-4 w-full rounded-xl border border-[#efcaca] px-3 py-2 text-xs font-semibold text-[#8c0303] hover:bg-[#fff1f1]"
    >
      Cerrar sesión
    </button>
  </div>
</div>

    </div>
  </div>
</aside>
)
}