'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      alert('Correo o contraseña incorrectos.')
      return
    }

    router.push('/app/cuadro-de-mandos')
  }

  return (
    <main className="min-h-screen bg-[#fcf8f8] flex items-center justify-center p-6">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-white border border-[#f3dede] rounded-[32px] p-8"
      >
        <h1 className="text-[38px] ivy text-[#7a0000] leading-none">
          Iniciar sesión
        </h1>

        <p className="text-sm text-[#b07a7a] mt-2 mb-8">
          Accede al cuadro de mandos de La Casa de las Fresas.
        </p>

        <label className="block text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
          Email
        </label>
        <input
          type="email"
          className="w-full border border-[#efcaca] rounded-xl px-4 py-3 mb-4 outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="block text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
          Contraseña
        </label>
        <input
          type="password"
          className="w-full border border-[#efcaca] rounded-xl px-4 py-3 mb-6 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#8c0303] text-white px-5 py-3 rounded-xl font-semibold disabled:opacity-60"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}