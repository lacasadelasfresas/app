'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { registrarAuditoria } from '@/lib/auditoria'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  async function handleLogin(event) {
    event.preventDefault()
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

      const authUserId = loginData?.user?.id

      if (!authUserId) {
        await supabase.auth.signOut()
        alert('No se pudo validar la sesión del usuario.')
        return
      }

      const { data: perfil, error: perfilError } = await supabase
        .from('usuarios')
        .select(
          'id, nombre, email, rol, activo, debe_cambiar_password, auth_user_id'
        )
        .eq('auth_user_id', authUserId)
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
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      alert('Escribe tu correo primero.')
      return
    }

    setResetLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: 'https://lacasadelasfresas.shop/reset-password',
      }
    )

    setResetLoading(false)

    if (error) {
      console.error('Error enviando recuperación:', error)
      alert('No se pudo enviar el correo de recuperación.')
      return
    }

    alert('Te enviamos un correo para restablecer tu contraseña.')
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fcf8f8] flex items-center justify-center px-4 py-8 md:px-6">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_18%_18%,rgba(140,3,3,0.10)_0,transparent_24%),radial-gradient(circle_at_82%_78%,rgba(255,205,205,0.70)_0,transparent_26%)]" />

        <div className="absolute -top-24 -left-24 w-[280px] h-[280px] rounded-full border border-[#efd4d4]" />
        <div className="absolute -top-10 -left-10 w-[220px] h-[220px] rounded-full border border-[#f5e1e1]" />

        <div className="absolute -bottom-32 -right-24 w-[360px] h-[360px] rounded-full border border-[#efd4d4]" />
        <div className="absolute -bottom-16 -right-10 w-[280px] h-[280px] rounded-full border border-[#f5e1e1]" />

        <div className="absolute top-[14%] right-[11%] w-3 h-3 rounded-full bg-[#8c0303]/20" />
        <div className="absolute top-[20%] right-[17%] w-2 h-2 rounded-full bg-[#8c0303]/30" />
        <div className="absolute bottom-[18%] left-[12%] w-3 h-3 rounded-full bg-[#8c0303]/20" />
        <div className="absolute bottom-[24%] left-[18%] w-2 h-2 rounded-full bg-[#8c0303]/30" />
      </div>

      <section className="relative z-10 w-full max-w-[470px]">
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="w-[260px] sm:w-[300px] md:w-[340px] h-[112px] md:h-[126px] flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="La Casa de las Fresas"
              width={360}
              height={140}
              priority
              className="w-full h-full object-contain scale-[1.18]"
            />
          </div>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-white/95 backdrop-blur-sm border border-[#f1dede] rounded-[30px] p-6 sm:p-8 md:p-9 shadow-[0_20px_60px_rgba(122,0,0,0.10)]"
        >
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.20em] text-[#b9a0a0]">
              Cuadro de mandos
            </p>

            <h1 className="mt-3 text-[28px] md:text-[32px] font-bold text-[#7a0000] leading-tight">
              Iniciar sesión
            </h1>

            <p className="text-sm text-[#b07a7a] mt-2">
              Accede a la operación de La Casa de las Fresas.
            </p>
          </div>

          <div className="mt-8">
            <label className="block text-xs uppercase tracking-[0.16em] text-[#b9a0a0] mb-2">
              Email
            </label>

            <div className="flex items-center gap-3 border border-[#efcaca] rounded-xl px-4 py-3 bg-white focus-within:border-[#8c0303] focus-within:ring-2 focus-within:ring-[#fff1f1] transition">
              <Mail size={17} className="text-[#b07a7a] shrink-0" />

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nombre@correo.com"
                className="w-full bg-transparent outline-none text-sm text-[#2e2e2e]"
                required
              />
            </div>
          </div>

          <div className="mt-5">
            <label className="block text-xs uppercase tracking-[0.16em] text-[#b9a0a0] mb-2">
              Contraseña
            </label>

            <div className="flex items-center gap-3 border border-[#efcaca] rounded-xl px-4 py-3 bg-white focus-within:border-[#8c0303] focus-within:ring-2 focus-within:ring-[#fff1f1] transition">
              <LockKeyhole size={17} className="text-[#b07a7a] shrink-0" />

              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Ingresa tu contraseña"
                className="w-full bg-transparent outline-none text-sm text-[#2e2e2e]"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="text-[#8c0303] shrink-0"
                aria-label={
                  showPassword
                    ? 'Ocultar contraseña'
                    : 'Mostrar contraseña'
                }
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-7 bg-[#8c0303] text-white px-5 py-3.5 rounded-xl font-semibold text-sm shadow-sm hover:bg-[#720000] transition disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar al sistema'}
          </button>

          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={resetLoading}
            className="w-full mt-4 text-sm font-semibold text-[#8c0303] hover:underline disabled:opacity-60"
          >
            {resetLoading
              ? 'Enviando correo...'
              : '¿Olvidaste tu contraseña?'}
          </button>
        </form>

        <p className="text-center text-xs text-[#b07a7a] mt-6">
          La Casa de las Fresas · Cuadro de Mandos
        </p>
      </section>
    </main>
  )
}