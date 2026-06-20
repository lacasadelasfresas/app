import { supabase } from './supabaseClient'

export async function registrarAuditoria({
  accion,
  modulo,
  descripcion,
  registroId = null,
  datosAntes = null,
  datosDespues = null,
}) {
  
  try {
const { data } = await supabase.auth.getSession()
const authUserId = data.session?.user?.id || null

let usuario = null

if (authUserId) {
  const { data: usuarioData } = await supabase
    .from('usuarios')
    .select('nombre, email, rol')
    .eq('auth_user_id', authUserId)
    .single()

  usuario = usuarioData
}

    await supabase.from('auditoria').insert({
usuario_email: usuario?.email || null,
      usuario_nombre: usuario?.nombre || 'Usuario',
      rol: usuario?.rol || null,
      accion,
      modulo,
      descripcion,
      registro_id: registroId,
      datos_antes: datosAntes,
datos_despues: datosDespues,
    })
  } catch (error) {
    console.error('Error registrando auditoría:', error)
  }
}
