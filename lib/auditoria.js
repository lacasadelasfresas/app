import { supabase } from './supabaseClient'

export async function registrarAuditoria({
  accion,
  modulo,
  descripcion = null,
  registroId = null,
  datosAntes = null,
  datosDespues = null,
}) {
  try {
    const { error } = await supabase.rpc('registrar_auditoria', {
      p_accion: accion,
      p_modulo: modulo,
      p_descripcion: descripcion,
      p_registro_id: registroId ? String(registroId) : null,
      p_datos_antes: datosAntes,
      p_datos_despues: datosDespues,
    })

    if (error) {
      console.error('Error registrando auditoría:', error)
      return { error }
    }

    return { error: null }
  } catch (error) {
    console.error('Error registrando auditoría:', error)
    return { error }
  }
}