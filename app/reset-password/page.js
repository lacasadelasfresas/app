'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { registrarAuditoria } from '@/lib/auditoria'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReset(e) {
    e.preventDefault()

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

      const userEmail = user.email.trim().toLowerCase()

      const { data: perfil, error: perfilError } = await supabase
        .from('usuarios')
        .select('id, nombre, email, rol, activo, debe_cambiar_password')
        .eq('email', userEmail)
        .single()

      if (perfilError || !perfil) {
        alert('No encontramos tu perfil dentro del Cuadro de Mandos.')
        return
      }

      if (!perfil.activo) {
        await supabase.auth.signOut()
        alert('Tu usuario se encuentra inactivo. Contacta al administrador.')
        return
      }

      const { error: passwordError } = await supabase.auth.updateUser({
        password,
      })

      if (passwordError) {
        alert('No se pudo actualizar la contraseña.')
        return
      }

      const { error: perfilUpdateError } = await supabase
        .from('usuarios')
        .update({
          debe_cambiar_password: false,
        })
        .eq('id', perfil.id)

      if (perfilUpdateError) {
        console.error(
          'Error actualizando debe_cambiar_password:',
          perfilUpdateError
        )

        alert(
          'La contraseña fue actualizada, pero no se pudo completar la validación del perfil. Contacta al administrador.'
        )
        return
      }

      await registrarAuditoria({
        accion: 'Cambiar contraseña',
        modulo: 'Seguridad',
        descripcion: 'El usuario actualizó su contraseña correctamente.',
        registroId: perfil.id,
        datosAntes: {
          debe_cambiar_password: true,
        },
        datosDespues: {
          debe_cambiar_password: false,
        },
      })

      alert('Contraseña actualizada correctamente.')
      router.replace('/app/cuadro-de-mandos')
    } catch (error) {
      console.error('Error al actualizar contraseña:', error)
      alert('Ocurrió un error inesperado. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#fcf8f8] flex items-center justify-center p-6">
      <form
        onSubmit={handleReset}
        className="w-full max-w-md bg-white border border-[#f3dede] rounded-[32px] p-8"
      >
        <h1 className="text-[34px] ivy text-[#7a0000] leading-none">
          Nueva contraseña
        </h1>

        <p className="text-sm text-[#b07a7a] mt-2 mb-8">
          Escribe una nueva contraseña para acceder al sistema.
        </p>

        <label className="block text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
          Nueva contraseña
        </label>

        <input
          type="password"
          className="w-full border border-[#efcaca] rounded-xl px-4 py-3 mb-4 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <label className="block text-xs uppercase tracking-[0.18em] text-[#b9a0a0] mb-2">
          Confirmar contraseña
        </label>

        <input
          type="password"
          className="w-full border border-[#efcaca] rounded-xl px-4 py-3 mb-6 outline-none"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#8c0303] text-white px-5 py-3 rounded-xl font-semibold disabled:opacity-60"
        >
          {loading ? 'Actualizando...' : 'Actualizar contraseña'}
        </button>
      </form>
    </main>
  )
}