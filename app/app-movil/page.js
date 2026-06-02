'use client'

export default function AppMovil() {
  return (
    <main className="min-h-screen bg-[#fcf8f8] px-5 py-6">
      <section className="max-w-md mx-auto space-y-6">

        <div className="text-center">
          <p className="text-sm tracking-[0.3em] text-[#b8a1a1] uppercase">
            La Casa de las Fresas
          </p>

          <h1 className="ivy text-[42px] leading-none text-[#7a0000] mt-3">
            App Móvil
          </h1>

          <p className="text-[#9e8c8c] mt-2">
            Registro rápido de pedidos
          </p>
        </div>

        <div className="bg-white border border-[#f3dede] rounded-[30px] p-6 shadow-[0_4px_30px_rgba(0,0,0,0.03)] space-y-4">

          <button className="w-full bg-[#8c0303] text-white py-4 rounded-2xl text-lg">
            Nuevo Pedido
          </button>

          <button className="w-full bg-[#fff1f1] text-[#8c0303] py-4 rounded-2xl text-lg">
            Ver pedidos de hoy
          </button>

          <button className="w-full bg-[#fff1f1] text-[#8c0303] py-4 rounded-2xl text-lg">
            Ventas del día
          </button>

        </div>

      </section>
    </main>
  )
}