'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Plus, Trash2, Pencil } from 'lucide-react'

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

    const { data: productosData, error: productosError } = await supabase
      .from('productos')
      .select('id, nombre, sku, activo')
      .eq('activo', true)
      .order('nombre', { ascending: true })

    const { data: inventarioData, error: inventarioError } = await supabase
      .from('inventario')
      .select('id, nombre, sku, unidad, activo')
      .eq('activo', true)
      .order('nombre', { ascending: true })

    const { data: recipesData, error: recipesError } = await supabase
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
      .order('created_at', { ascending: false })

    if (productosError) console.error('Error productos:', productosError)
    if (inventarioError) console.error('Error inventario:', inventarioError)
    if (recipesError) console.error('Error recipes:', recipesError)

    setProductos(productosData || [])
    setInventario(inventarioData || [])
    setRecipes(recipesData || [])
    setLoading(false)
  }

  function handleChange(e) {
    const { name, value } = e.target

    if (name === 'inventario_id') {
      const selectedItem = inventario.find((item) => item.id === value)

      setForm((prev) => ({
        ...prev,
        inventario_id: value,
        unidad: selectedItem?.unidad || '',
      }))

      return
    }

    setForm((prev) => ({
      ...prev,
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
      alert('Selecciona producto, insumo y cantidad.')
      return
    }

    const cantidad = Number(form.cantidad)

    if (cantidad <= 0) {
      alert('La cantidad debe ser mayor a 0.')
      return
    }

setSaving(true)

let response

if (editingId) {
  response = await supabase
    .from('recipes')
    .update({
      producto_id: form.producto_id,
      inventario_id: form.inventario_id,
      cantidad,
      unidad: form.unidad || null,
    })
    .eq('id', editingId)
} else {
  response = await supabase
    .from('recipes')
    .insert([
      {
        producto_id: form.producto_id,
        inventario_id: form.inventario_id,
        cantidad,
        unidad: form.unidad || null,
      },
    ])
}

const { error } = response

    if (error) {
      console.error('Error guardando receta:', error)
      alert('No se pudo guardar la receta.')
      setSaving(false)
      return
    }

setForm({
  producto_id: form.producto_id,
  inventario_id: '',
  cantidad: '',
  unidad: '',
})

setEditingId(null)

await fetchData()
setSaving(false)
  }

  async function eliminarRecipe(id) {
    const confirmar = confirm('¿Deseas eliminar este ingrediente de la receta?')

    if (!confirmar) return

    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error eliminando receta:', error)
      alert('No se pudo eliminar.')
      return
    }

    fetchData()
  }

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-[#efcccc] bg-[#fff7f7] outline-none text-sm'

  return (
    <main className="min-h-screen bg-[#fcf8f8] p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-[42px] text-[#7a0000] ivy leading-none">
            Recipes
          </h1>

          <p className="text-[#b07a7a] mt-2">
            Define qué insumos consume cada producto vendido.
          </p>
        </div>

        <div className="bg-white border border-[#f3dede] rounded-[30px] p-8 space-y-5">
          <h2 className="text-[26px] text-[#7a0000] ivy">
            Crear receta
          </h2>

          <div className="grid grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-sm text-[#7a0000]">Producto</label>
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
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-[#7a0000]">Insumo</label>
              <select
                name="inventario_id"
                value={form.inventario_id}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Seleccionar insumo...</option>
                {inventario.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre} · {item.unidad || 'Sin unidad'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-[#7a0000]">Cantidad usada</label>
              <input
                type="number"
                step="0.01"
                name="cantidad"
                value={form.cantidad}
                onChange={handleChange}
                placeholder="Ej. 0.25"
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-sm text-[#7a0000]">Unidad</label>
              <input
                name="unidad"
                value={form.unidad}
                onChange={handleChange}
                placeholder="KG, ML, Unidades..."
                className={inputClass}
              />
            </div>
          </div>

<div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={guardarRecipe}
              disabled={saving}
              className="bg-[#8c0303] text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              <Plus size={18} />
           {saving
  ? 'Guardando...'
  : editingId
    ? 'Guardar cambios'
    : 'Agregar insumo a receta'}
            </button>
          </div>
        </div>

{editingId && (
  <button
    type="button"
    onClick={() => {
      setEditingId(null)
      setForm({
        producto_id: '',
        inventario_id: '',
        cantidad: '',
        unidad: '',
      })
    }}
    className="border border-[#efcccc] text-[#8c0303] px-6 py-3 rounded-xl font-semibold"
  >
    Cancelar edición
  </button>
)}

        <div className="bg-white border border-[#f3dede] rounded-[30px] p-8">
          <h2 className="text-[26px] text-[#7a0000] ivy mb-6">
            Recetas registradas
          </h2>

          {loading ? (
            <p className="text-[#b07a7a]">Cargando recetas...</p>
          ) : recipes.length === 0 ? (
            <p className="text-[#b07a7a]">
              Aún no hay recetas registradas.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-[#f3dede] text-[#b9a0a0] uppercase tracking-[0.15em] text-xs">
                  <th className="py-4">Producto</th>
                  <th className="py-4">Insumo</th>
                  <th className="py-4">Cantidad</th>
                  <th className="py-4">Unidad</th>
                  <th className="py-4">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {recipes.map((recipe) => (
                  <tr key={recipe.id} className="border-b border-[#f9eded]">
                    <td className="py-4 font-semibold">
                      {recipe.productos?.nombre || 'Sin producto'}
                    </td>

                    <td className="py-4">
                      {recipe.inventario?.nombre || 'Sin insumo'}
                    </td>

                    <td className="py-4">
                      {recipe.cantidad}
                    </td>

                    <td className="py-4">
                      {recipe.unidad || recipe.inventario?.unidad || '—'}
                    </td>

<td className="py-4">
  <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={() => editarRecipe(recipe)}
      className="text-[#8c0303] hover:text-[#5f0000]"
      title="Editar receta"
    >
      <Pencil size={17} />
    </button>

    <button
      type="button"
      onClick={() => eliminarRecipe(recipe.id)}
      className="text-red-500 hover:text-red-700"
      title="Eliminar receta"
    >
      <Trash2 size={17} />
    </button>
  </div>
</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  )
}