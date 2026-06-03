'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Sidebar from './Sidebar'
import { supabase } from '@/lib/supabaseClient'

export default function AuthLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)

  const isLogin = pathname === '/login'

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getSession()

      if (!data.session && !isLogin) {
        router.push('/login')
        return
      }

      if (data.session && isLogin) {
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
    <div className="flex min-h-screen bg-[#fcf8f8]">
      <Sidebar />

      <div className="ml-[250px] w-full">
        {children}
      </div>
    </div>
  )
}