'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ChefHat,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function RecipesPage() {
  const [productos, setProductos] = useState([])
  const [inventario, setInventario] = useState([])
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState({
    producto_id: '',
    inventario_id: '',
    cantidad: '',
    unidad: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)

    const [productosResponse, inventarioResponse, recipesResponse] =
      await Promise.all([
        supabase
          .from('productos')
          .select('id, nombre, sku, activo')
          .eq('activo', true)
          .order('nombre', { ascending: true }),

        supabase
          .from('inventario')
          .select('id, nombre, sku, unidad, activo')
          .eq('activo', true)
          .order('nombre', { ascending: true }),

        supabase
          .from('recipes')
          .select(`
            id,
            cantidad,
            unidad,
            productos (
              id,
              nombre,
              sku
            ),
            inventario (
              id,
              nombre,
              sku,
              unidad
            )
          `)
          .order('created_at', { ascending: false }),
      ])

    if (productosResponse.error) {
      console.error('Error productos:', productosResponse.error)
    }

    if (inventarioResponse.error) {
      console.error('Error inventario:', inventarioResponse.error)
    }

    if (recipesResponse.error) {
      console.error('Error recipes:', recipesResponse.error)
      alert('No se pudieron cargar las recetas.')
    }

    setProductos(productosResponse.data || [])
    setInventario(inventarioResponse.data || [])
    setRecipes(recipesResponse.data || [])
    setLoading(false)
  }

  function resetForm() {
    setEditingId(null)

    setForm({
      producto_id: '',
      inventario_id: '',
      cantidad: '',
      unidad: '',
    })
  }

  function handleChange(event) {
    const { name, value } = event.target

    if (name === 'inventario_id') {
      const selectedItem = inventario.find((item) => item.id === value)

      setForm((previous) => ({
        ...previous,
        inventario_id: value,
        unidad: selectedItem?.unidad || '',
      }))

      return
    }

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  function editarRecipe(recipe) {
    setEditingId(recipe.id)

    setForm({
      producto_id: recipe.productos?.id || '',
      inventario_id: recipe.inventario?.id || '',
      cantidad: recipe.cantidad || '',
      unidad: recipe.unidad || recipe.inventario?.unidad || '',
    })

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  async function guardarRecipe() {
    if (!form.producto_id || !form.inventario_id || !form.cantidad) {
      alert('Selecciona el producto, insumo y cantidad.')
      return
    }

    const cantidad = Number(form.cantidad)

    if (cantidad <= 0) {
      alert('La cantidad debe ser mayor a 0.')
      return
    }

    setSaving(true)

    const payload = {
      producto_id: form.producto_id,
      inventario_id: form.inventario_id,
      cantidad,
      unidad: form.unidad.trim() || null,
    }

    const { error } = editingId
      ? await supabase
          .from('recipes')
          .update(payload)
          .eq('id', editingId)
      : await supabase.from('recipes').insert([payload])

    if (error) {
      console.error('Error guardando receta:', error)
      alert('No se pudo guardar la receta.')
      setSaving(false)
      return
    }

    resetForm()
    await fetchData()
    setSaving(false)
  }

  async function eliminarRecipe(id) {
    const confirmar = confirm(
      '¿Deseas eliminar este ingrediente de la receta?'
    )

    if (!confirmar) return

    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error eliminando receta:', error)
      alert('No se pudo eliminar el ingrediente.')
      return
    }

    await fetchData()
  }

  const selectedProduct = useMemo(() => {
    return productos.find((producto) => producto.id === form.producto_id)
  }, [productos, form.producto_id])

  const inputClass =
    'w-full rounded-xl border border-[#efcaca] bg-white px-4 py-3 text-sm text-[#2e2e2e] outline-none transition focus:border-[#8c0303] focus:ring-2 focus:ring-[#fff1f1]'

  return (
    <main className="min-h-screen bg-[#fcf8f8]">
      <header className="bg-white border-b border-[#f1dede] px-5 md:px-8 py-3 md:h-[82px] md:py-0 md:flex md:items-center">
        <div className="w-full max-w-none">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
                Producción y costos
              </p>

              <h1 className="mt-1 text-[21px] md:text-[23px] font-bold text-[#7a0000] leading-tight">
                Recetas
              </h1>

              <p className="mt-1 text-xs md:text-sm text-[#b07a7a]">
                Define los insumos que consume cada producto vendido.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="w-full sm:w-auto h-10 px-4 rounded-xl border border-[#efcaca] bg-white text-[#8c0303] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#fff5f5] disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={loading ? 'animate-spin' : ''}
              />
              Actualizar
            </button>
          </div>
        </div>
      </header>

      <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-5 md:py-7 space-y-5">
        <section className="bg-white border border-[#f3dede] rounded-[26px] p-5 md:p-7">
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#fff1f1] text-[#8c0303] flex items-center justify-center shrink-0">
                <ChefHat size={19} />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#b9a0a0]">
                  {editingId ? 'Editar ingrediente' : 'Nueva receta'}
                </p>

                <h2 className="mt-1 text-[18px] md:text-[20px] font-bold text-[#7a0000]">
                  {editingId
                    ? 'Actualiza este ingrediente'
                    : 'Agrega un insumo a una receta'}
                </h2>

                <p className="mt-1 text-xs md:text-sm text-[#b07a7a]">
                  Un producto puede tener varios insumos registrados.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#b07a7a] mb-2">
                  Producto
                </label>

                <select
                  name="producto_id"
                  value={form.producto_id}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Seleccionar producto...</option>

                  {productos.map((producto) => (
                    <option key={producto.id} value={producto.id}>
                      {producto.nombre}
                      {producto.sku ? ` · ${producto.sku}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#b07a7a] mb-2">
                  Insumo
                </label>

                <select
                  name="inventario_id"
                  value={form.inventario_id}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Seleccionar insumo...</option>

                  {inventario.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre}
                      {item.unidad ? ` · ${item.unidad}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#b07a7a] mb-2">
                  Cantidad usada
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="cantidad"
                  value={form.cantidad}
                  onChange={handleChange}
                  placeholder="Ej. 0.25"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#b07a7a] mb-2">
                  Unidad
                </label>

                <input
                  name="unidad"
                  value={form.unidad}
                  onChange={handleChange}
                  placeholder="Ej. lb, ml, unidad..."
                  className={inputClass}
                />
              </div>
            </div>

            {selectedProduct && (
              <div className="rounded-2xl border border-[#f3dede] bg-[#fffafa] px-4 py-3 text-sm text-[#b07a7a]">
                Estás editando la receta de:{' '}
                <strong className="text-[#7a0000]">
                  {selectedProduct.nombre}
                </strong>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="w-full sm:w-auto rounded-xl border border-[#efcaca] px-5 py-3 text-sm font-semibold text-[#8c0303] hover:bg-[#fff5f5] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <X size={17} />
                  Cancelar edición
                </button>
              )}

              <button
                type="button"
                onClick={guardarRecipe}
                disabled={saving}
                className="w-full sm:w-auto rounded-xl bg-[#8c0303] px-5 py-3 text-sm font-semibold text-white flex items-center justify-center gap-2 hover:bg-[#720000] disabled:opacity-60"
              >
                {editingId ? <Save size={17} /> : <Plus size={17} />}
                {saving
                  ? 'Guardando...'
                  : editingId
                    ? 'Guardar cambios'
                    : 'Agregar insumo'}
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white border border-[#f3dede] rounded-[26px] overflow-hidden">
          <div className="p-5 md:p-6 border-b border-[#f3dede]">
            <h2 className="text-[18px] md:text-[20px] font-bold text-[#7a0000]">
              Ingredientes registrados
            </h2>

            <p className="text-sm text-[#b07a7a] mt-1">
              {recipes.length} ingrediente(s) asociado(s) a productos.
            </p>
          </div>

          <div className="md:hidden divide-y divide-[#f3dede]">
            {loading ? (
              <p className="px-5 py-10 text-center text-sm text-[#b07a7a]">
                Cargando recetas...
              </p>
            ) : recipes.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[#b07a7a]">
                Aún no hay recetas registradas.
              </p>
            ) : (
              recipes.map((recipe) => (
                <article key={recipe.id} className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#fff1f1] text-[#8c0303] flex items-center justify-center shrink-0">
                      <Package size={17} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[16px] font-bold text-[#7a0000] break-words">
                        {recipe.productos?.nombre || 'Sin producto'}
                      </p>

                      <p className="text-sm text-[#b07a7a] mt-1 break-words">
                        Insumo: {recipe.inventario?.nombre || 'Sin insumo'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="rounded-2xl border border-[#f3dede] bg-[#fffafa] p-3">
                      <p className="text-[10px] uppercase tracking-[0.13em] text-[#b9a0a0]">
                        Cantidad
                      </p>

                      <p className="mt-2 text-lg font-bold text-[#7a0000]">
                        {recipe.cantidad}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[#f3dede] bg-[#fffafa] p-3">
                      <p className="text-[10px] uppercase tracking-[0.13em] text-[#b9a0a0]">
                        Unidad
                      </p>

                      <p className="mt-2 text-lg font-bold text-[#7a0000]">
                        {recipe.unidad ||
                          recipe.inventario?.unidad ||
                          '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => editarRecipe(recipe)}
                      className="flex-1 rounded-xl border border-[#efcaca] py-3 text-sm font-semibold text-[#8c0303] flex items-center justify-center gap-2"
                    >
                      <Pencil size={16} />
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => eliminarRecipe(recipe.id)}
                      className="w-12 rounded-xl border border-red-200 text-red-600 flex items-center justify-center hover:bg-red-50"
                      aria-label="Eliminar ingrediente"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-[850px] w-full text-sm">
              <thead className="bg-[#f8eeee] text-[#b07a7a] uppercase text-[11px] tracking-[0.15em]">
                <tr>
                  <th className="py-4 px-5 text-left">Producto</th>
                  <th className="py-4 px-5 text-left">Insumo</th>
                  <th className="py-4 px-5 text-left">Cantidad</th>
                  <th className="py-4 px-5 text-left">Unidad</th>
                  <th className="py-4 px-5 text-right">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="py-10 text-center text-[#b07a7a]"
                    >
                      Cargando recetas...
                    </td>
                  </tr>
                ) : recipes.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="py-10 text-center text-[#b07a7a]"
                    >
                      Aún no hay recetas registradas.
                    </td>
                  </tr>
                ) : (
                  recipes.map((recipe) => (
                    <tr
                      key={recipe.id}
                      className="border-b border-[#f3dede] hover:bg-[#fffafa]"
                    >
                      <td className="py-4 px-5 font-semibold text-[#2e2e2e]">
                        {recipe.productos?.nombre || 'Sin producto'}
                      </td>

                      <td className="py-4 px-5 text-[#2e2e2e]">
                        {recipe.inventario?.nombre || 'Sin insumo'}
                      </td>

                      <td className="py-4 px-5 text-[#2e2e2e]">
                        {recipe.cantidad}
                      </td>

                      <td className="py-4 px-5 text-[#2e2e2e]">
                        {recipe.unidad ||
                          recipe.inventario?.unidad ||
                          '—'}
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => editarRecipe(recipe)}
                            className="w-9 h-9 rounded-xl border border-[#efcaca] text-[#8c0303] flex items-center justify-center hover:bg-[#fff5f5]"
                            title="Editar ingrediente"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => eliminarRecipe(recipe.id)}
                            className="w-9 h-9 rounded-xl border border-red-200 text-red-600 flex items-center justify-center hover:bg-red-50"
                            title="Eliminar ingrediente"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  )
}