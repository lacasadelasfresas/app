'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AuditoriaPage() {
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAuditoria()
  }, [])

  async function fetchAuditoria() {
    setLoading(true)

    const { data, error } = await supabase
      .from('auditoria')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error cargando auditoría:', error)
      setLoading(false)
      return
    }

    setRegistros(data || [])
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#fcf8f8]">
      <div className="bg-white border-b border-[#f1dede] px-10 h-[86px] flex items-center">
        <div>
          <h1 className="text-[30px] text-[#7a0000] ivy leading-none">
            Auditoría
          </h1>
          <p className="text-sm text-[#b07a7a] mt-2">
            Registro de movimientos realizados dentro del sistema.
          </p>
        </div>
      </div>

      <section className="p-8">
        <div className="bg-white border border-[#f3dede] rounded-[28px] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#f8eeee] text-[#b07a7a] uppercase text-[11px] tracking-[0.15em]">
              <tr>
                <th className="py-4 px-5 text-left">Fecha</th>
                <th className="py-4 px-5 text-left">Usuario</th>
                <th className="py-4 px-5 text-left">Rol</th>
                <th className="py-4 px-5 text-left">Acción</th>
                <th className="py-4 px-5 text-left">Módulo</th>
                <th className="py-4 px-5 text-left">Descripción</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-[#b07a7a]">
                    Cargando auditoría...
                  </td>
                </tr>
              ) : registros.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-[#b07a7a]">
                    No hay movimientos registrados todavía.
                  </td>
                </tr>
              ) : (
                registros.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[#f3dede] hover:bg-[#fffafa]"
                  >
                    <td className="py-4 px-5 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleString('es-PA')}
                    </td>

                    <td className="py-4 px-5">
                      <p className="font-semibold text-[#2e2e2e]">
                        {item.usuario_nombre || 'Usuario'}
                      </p>
                      <p className="text-xs text-[#b07a7a]">
                        {item.usuario_email || 'Sin email'}
                      </p>
                    </td>

                    <td className="py-4 px-5">
                      <span className="px-3 py-1 rounded-full bg-[#fff1f1] text-[#8c0303] text-xs font-semibold">
                        {item.rol || 'Sin rol'}
                      </span>
                    </td>

                    <td className="py-4 px-5 font-semibold text-[#8c0303]">
                      {item.accion}
                    </td>

                    <td className="py-4 px-5">
                      {item.modulo}
                    </td>

                    <td className="py-4 px-5">
                      {item.descripcion || 'Sin descripción'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}