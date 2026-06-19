'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { registrarAuditoria } from '@/lib/auditoria'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

async function handleLogin(e) {
  e.preventDefault()
  setLoading(true)

  try {
    const { data: loginData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

    if (loginError) {
      alert('Correo o contraseña incorrectos.')
      return
    }

    const userEmail = loginData?.user?.email?.trim().toLowerCase()

    if (!userEmail) {
      await supabase.auth.signOut()
      alert('No se pudo validar la sesión del usuario.')
      return
    }

    const { data: perfil, error: perfilError } = await supabase
      .from('usuarios')
      .select('id, nombre, email, rol, activo, debe_cambiar_password')
      .eq('email', userEmail)
      .single()

    if (perfilError || !perfil) {
      await supabase.auth.signOut()
      alert('Tu usuario no está registrado en el cuadro de mandos.')
      return
    }

    if (!perfil.activo) {
      await supabase.auth.signOut()
      alert('Tu usuario se encuentra inactivo. Contacta al administrador.')
      return
    }

await registrarAuditoria({
  accion: 'Iniciar sesión',
  modulo: 'Seguridad',
  descripcion: perfil.debe_cambiar_password
    ? 'Inicio de sesión exitoso. Se requiere cambio obligatorio de contraseña.'
    : 'Inicio de sesión exitoso en el Cuadro de Mandos.',
  registroId: perfil.id,
})

if (perfil.debe_cambiar_password) {
  router.replace('/reset-password')
  return
}

router.replace('/app/cuadro-de-mandos')

  } catch (error) {
    console.error('Error al iniciar sesión:', error)
    alert('Ocurrió un error al iniciar sesión. Intenta nuevamente.')
  } finally {
    setLoading(false)
}

router.replace('/app/cuadro-de-mandos')
}

  async function handleForgotPassword() {
    if (!email) {
      alert('Escribe tu correo primero.')
      return
    }

    setResetLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://lacasadelasfresas.shop/reset-password',
    })

    setResetLoading(false)

    if (error) {
      alert('No se pudo enviar el correo de recuperación.')
      return
    }

    alert('Te enviamos un correo para restablecer tu contraseña.')
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

        <button
          type="button"
          onClick={handleForgotPassword}
          disabled={resetLoading}
          className="w-full mt-4 text-sm font-semibold text-[#8c0303] hover:underline disabled:opacity-60"
        >
          {resetLoading ? 'Enviando correo...' : '¿Olvidaste tu contraseña?'}
        </button>
      </form>
    </main>
  )
}