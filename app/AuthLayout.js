'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Sidebar from './Sidebar'
import { supabase } from '@/lib/supabaseClient'

export default function AuthLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

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
    }

    if (session && isLogin) {
      router.push('/app/cuadro-de-mandos')
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
  <div className="flex min-h-screen bg-[#fcf8f8] items-stretch">
    <Sidebar
      collapsed={sidebarCollapsed}
      setCollapsed={setSidebarCollapsed}
    />

    <div className="flex-1 w-full min-w-0">
      {children}
    </div>
  </div>
)
}