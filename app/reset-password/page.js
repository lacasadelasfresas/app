'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function ResetPasswordPage() {
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validatingSession, setValidatingSession] = useState(true)

  useEffect(() => {
    async function validarSesion() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        alert('Tu sesión no es válida o el enlace ya venció. Inicia sesión nuevamente.')
        router.replace('/login')
        return
      }

      setValidatingSession(false)
    }

    validarSesion()
  }, [router])

  async function handleReset(event) {
    event.preventDefault()

    if (password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user?.email) {
        alert(
          'Tu sesión de recuperación no es válida o ya venció. Solicita un nuevo enlace.'
        )
        return
      }

      const authUserId = user.id

      const { data: perfil, error: perfilError } = await supabase
        .from('usuarios')
        .select(
          'id, nombre, email, rol, activo, debe_cambiar_password, auth_user_id'
        )
        .eq('auth_user_id', authUserId)
        .single()

      if (perfilError || !perfil) {
        alert('No encontramos tu perfil dentro del Cuadro de Mandos.')
        return
      }

      if (!perfil.activo) {
        await supabase.auth.signOut()
        alert('Tu usuario se encuentra inactivo. Contacta al administrador.')
        router.replace('/login')
        return
      }

      const { error: passwordError } = await supabase.auth.updateUser({
        password,
      })

      if (passwordError) {
        console.error('Error actualizando contraseña:', passwordError)
        alert('No se pudo actualizar la contraseña.')
        return
      }

      const { error: finalizarError } = await supabase.rpc(
        'finalizar_cambio_password'
      )

      if (finalizarError) {
        console.error(
          'Error finalizando el cambio obligatorio de contraseña:',
          finalizarError
        )

        alert(
          'La contraseña fue actualizada, pero no se pudo completar la validación del perfil. Contacta al administrador.'
        )
        return
      }

      alert('Contraseña actualizada correctamente.')
      router.replace('/app/cuadro-de-mandos')
    } catch (error) {
      console.error('Error al actualizar contraseña:', error)
      alert('Ocurrió un error inesperado. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const passwordMatch =
    confirmPassword.length > 0 && password === confirmPassword

  const passwordDoesNotMatch =
    confirmPassword.length > 0 && password !== confirmPassword

  if (validatingSession) {
    return (
      <main className="min-h-screen bg-[#fcf8f8] flex items-center justify-center px-5">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto rounded-full border-4 border-[#f1dede] border-t-[#8c0303] animate-spin" />
          <p className="mt-4 text-sm text-[#b07a7a]">
            Validando tu sesión...
          </p>
        </div>
      </main>
    )
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
          onSubmit={handleReset}
          className="bg-white/95 backdrop-blur-sm border border-[#f1dede] rounded-[30px] p-6 sm:p-8 md:p-9 shadow-[0_20px_60px_rgba(122,0,0,0.10)]"
        >
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#fff1f1] text-[#8c0303] flex items-center justify-center">
              <KeyRound size={21} />
            </div>

            <p className="mt-5 text-[10px] uppercase tracking-[0.20em] text-[#b9a0a0]">
              Seguridad de cuenta
            </p>

            <h1 className="mt-3 text-[28px] md:text-[32px] font-bold text-[#7a0000] leading-tight">
              Crea tu nueva contraseña
            </h1>

            <p className="text-sm text-[#b07a7a] mt-2">
              Utiliza una contraseña segura para acceder al cuadro de mandos.
            </p>
          </div>

          <div className="mt-8">
            <label className="block text-xs uppercase tracking-[0.16em] text-[#b9a0a0] mb-2">
              Nueva contraseña
            </label>

            <div className="flex items-center gap-3 border border-[#efcaca] rounded-xl px-4 py-3 bg-white focus-within:border-[#8c0303] focus-within:ring-2 focus-within:ring-[#fff1f1] transition">
              <LockKeyhole size={17} className="text-[#b07a7a] shrink-0" />

              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mínimo 6 caracteres"
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

          <div className="mt-5">
            <label className="block text-xs uppercase tracking-[0.16em] text-[#b9a0a0] mb-2">
              Confirmar contraseña
            </label>

            <div
              className={`flex items-center gap-3 border rounded-xl px-4 py-3 bg-white transition ${
                passwordDoesNotMatch
                  ? 'border-red-300 focus-within:ring-2 focus-within:ring-red-100'
                  : passwordMatch
                    ? 'border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-100'
                    : 'border-[#efcaca] focus-within:border-[#8c0303] focus-within:ring-2 focus-within:ring-[#fff1f1]'
              }`}
            >
              <LockKeyhole size={17} className="text-[#b07a7a] shrink-0" />

              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repite tu contraseña"
                className="w-full bg-transparent outline-none text-sm text-[#2e2e2e]"
                required
              />

              {passwordMatch ? (
                <CheckCircle2
                  size={18}
                  className="text-emerald-600 shrink-0"
                />
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((value) => !value)
                  }
                  className="text-[#8c0303] shrink-0"
                  aria-label={
                    showConfirmPassword
                      ? 'Ocultar contraseña'
                      : 'Mostrar contraseña'
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              )}
            </div>

            {passwordDoesNotMatch && (
              <p className="mt-2 text-xs text-red-600">
                Las contraseñas no coinciden.
              </p>
            )}

            {passwordMatch && (
              <p className="mt-2 text-xs text-emerald-700">
                Las contraseñas coinciden.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || passwordDoesNotMatch}
            className="w-full mt-7 bg-[#8c0303] text-white px-5 py-3.5 rounded-xl font-semibold text-sm shadow-sm hover:bg-[#720000] transition disabled:opacity-60"
          >
            {loading ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </form>

        <p className="text-center text-xs text-[#b07a7a] mt-6">
          La Casa de las Fresas · Cuadro de Mandos
        </p>
      </section>
    </main>
  )
}