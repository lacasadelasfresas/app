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
    const email = data.session?.user?.email || null

    let usuario = null

    if (email) {
      const { data: usuarioData } = await supabase
        .from('usuarios')
        .select('nombre, email, rol')
        .eq('email', email)
        .single()

      usuario = usuarioData
    }

    await supabase.from('auditoria').insert({
      usuario_email: usuario?.email || email,
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
