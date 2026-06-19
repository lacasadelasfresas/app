'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import { supabase } from '@/lib/supabaseClient'

export default function AuthLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const isLogin = pathname === '/login'

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getSession()
      const session = data.session

      if (!session && !isLogin) {
        router.push('/login')
        return
      }

      if (session) {
        const email = session.user.email

        const { data: usuario, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', email)
          .eq('activo', true)
          .single()

        if (error || !usuario) {
          await supabase.auth.signOut()
          router.push('/login')
          return
        }

        localStorage.setItem('usuarioRol', usuario.rol)
        localStorage.setItem('usuarioNombre', usuario.nombre)
        localStorage.setItem('usuarioEmail', usuario.email)
        localStorage.setItem(
  'debeCambiarPassword',
  usuario.debe_cambiar_password ? 'true' : 'false'
)
      }

if (session && isLogin) {
  if (usuario.debe_cambiar_password) {
    router.push('/reset-password')
  } else {
    router.push('/app/cuadro-de-mandos')
  }

  return
}

      setChecking(false)
    }

    checkUser()
  }, [pathname, isLogin, router])

  if (checking && !isLogin) {
    return (
      <main className="min-h-screen bg-[#fcf8f8] flex items-center justify-center text-[#8c0303]">
        Cargando...
      </main>
    )
  }

  if (isLogin) {
    return children
  }

  return (
    <div className="min-h-screen bg-[#fcf8f8]">
      <button
        type="button"
        onClick={() => setMobileSidebarOpen(true)}
        className="md:hidden fixed top-5 left-4 z-[70] w-11 h-11 rounded-full bg-[#8c0303] text-white shadow-lg flex items-center justify-center"
      >
        <Menu size={22} />
      </button>

      {mobileSidebarOpen && (
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(false)}
          className="md:hidden fixed inset-0 z-[50] bg-black/30"
        />
      )}

<div
  className={`fixed inset-y-0 left-0 z-[60] w-[250px] transition-transform duration-300 md:w-auto md:translate-x-0 ${
    mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
  }`}
>
        <Sidebar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
      </div>

<div
  className={`transition-all duration-300 min-w-0 ${
    sidebarCollapsed
      ? 'md:ml-[82px] md:w-[calc(100%-82px)]'
      : 'md:ml-[250px] md:w-[calc(100%-250px)]'
  }`}
>
        <div className="md:hidden h-20" />
        {children}
      </div>
    </div>
  )
}