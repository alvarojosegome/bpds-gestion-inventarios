"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  checkBackendConnection,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type Product,
} from "../../lib/api";

function getStockStatus(product: Product) {
  if (product.stock === 0) {
    return { label: "Agotado", className: "bg-red-100 text-red-700" };
  }
  if (product.stock <= product.minStock) {
    return { label: "Stock bajo", className: "bg-amber-100 text-amber-700" };
  }
  return { label: "Disponible", className: "bg-green-100 text-green-700" };
}

export default function Home() {
  const router = useRouter();

  const [message, setMessage] = useState("Comprobando conexión...");
  const [status, setStatus] = useState("loading");
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("5");
  const [saving, setSaving] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  // Filtrar productos por nombre o descripción.
  const filteredProducts = products.filter((product) => {
    const search = searchTerm.trim().toLowerCase();

    const matchesSearch =
      product.name.toLowerCase().includes(search) ||
      product.description.toLowerCase().includes(search);

    const matchesStock = !onlyLowStock || product.stock <= product.minStock;

    return matchesSearch && matchesStock;
  });

  const lowStockProducts = products.filter(
    (product) => product.stock <= product.minStock
  );

  const totalProducts = products.length;

  const outOfStockCount = products.filter(
    (product) => product.stock === 0
  ).length;

  const inventoryValue = products.reduce(
    (sum, product) => sum + product.price * product.stock,
    0
  );

  useEffect(() => {
    checkBackendConnection()
      .then((data) => {
        setMessage(data.message);
        setStatus("connected");
      })
      .catch(() => {
        setMessage("No fue posible conectar con el backend.");
        setStatus("error");
      });

    getProducts()
      .then((data) => {
        setProducts(data);
      })
      .catch(() => {
        setMessage("No fue posible cargar los productos.");
        setStatus("error");
      })
      .finally(() => {
        setLoadingProducts(false);
      });
  }, []);

  // Cerrar sesión: borra la cookie en el backend y vuelve al login.
  async function handleLogout() {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.push("/login");
    }
  }

  function resetForm() {
    setName("");
    setDescription("");
    setPrice("");
    setStock("");
    setMinStock("5");
    setEditingId(null);
  }

  // Preparar el formulario para editar un producto.
  function handleEdit(product: Product) {
    setEditingId(product.id);
    setName(product.name);
    setDescription(product.description);
    setPrice(String(product.price));
    setStock(String(product.stock));
    setMinStock(String(product.minStock));
    setFormMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // Eliminar un producto del inventario.
  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "¿Estás seguro de que deseas eliminar este producto?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteProduct(id);

      setProducts((currentProducts) =>
        currentProducts.filter((product) => product.id !== id)
      );

      if (editingId === id) {
        resetForm();
      }

      setFormMessage("¡Producto eliminado correctamente!");
    } catch {
      setFormMessage("No se pudo eliminar el producto.");
    }
  }

  // Registrar o actualizar un producto.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage("");

    const numericPrice = Number(price);
    const numericStock = Number(stock);
    const numericMinStock = Number(minStock);

    if (
      !name.trim() ||
      !description.trim() ||
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0 ||
      !Number.isInteger(numericStock) ||
      numericStock < 0 ||
      !Number.isInteger(numericMinStock) ||
      numericMinStock < 0
    ) {
      setFormMessage("Verifica los datos ingresados.");
      return;
    }

    setSaving(true);

    try {
      if (editingId !== null) {
        const updatedProduct = await updateProduct({
          id: editingId,
          name: name.trim(),
          description: description.trim(),
          price: numericPrice,
          stock: numericStock,
          minStock: numericMinStock,
        });

        setProducts((currentProducts) =>
          currentProducts.map((product) =>
            product.id === editingId ? updatedProduct : product
          )
        );

        resetForm();
        setFormMessage("¡Producto actualizado correctamente!");
      } else {
        const newProduct = await createProduct({
          name: name.trim(),
          description: description.trim(),
          price: numericPrice,
          stock: numericStock,
          minStock: numericMinStock,
        });

        setProducts((currentProducts) => [...currentProducts, newProduct]);

        resetForm();
        setFormMessage("¡Producto registrado correctamente!");
      }
    } catch {
      setFormMessage(
        editingId !== null
          ? "No se pudo actualizar el producto."
          : "No se pudo registrar el producto."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <header className="flex items-center justify-between border-b bg-white px-8 py-5">
        <h1 className="text-2xl font-bold text-blue-700">InventarioPro</h1>

        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">
            Plataforma SaaS para MicroPyMEs
          </span>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-8 py-12">
        <div className="mb-10">
          <p className="mb-3 font-semibold text-blue-600">
            GESTIÓN EMPRESARIAL
          </p>

          <h2 className="mb-4 text-4xl font-bold">
            Administra tu negocio de forma sencilla
          </h2>

          <p className="max-w-2xl text-lg text-slate-600">
            Controla tus productos, organiza tus pedidos y mantén la
            información de tu negocio en un solo lugar.
          </p>
        </div>

        <div className="mb-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border bg-white p-8 shadow-sm">
            <h3 className="mb-3 text-xl font-bold">Inventario</h3>
            <p className="text-slate-600">
              Consulta y administra los productos de tu negocio.
            </p>
          </div>

          <div className="rounded-xl border bg-white p-8 shadow-sm">
            <h3 className="mb-3 text-xl font-bold">Pedidos</h3>
            <p className="text-slate-600">
              Organiza y realiza seguimiento a los pedidos.
            </p>
          </div>
        </div>

        <div className="mb-10 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total de productos</p>
            <p className="text-2xl font-bold">{totalProducts}</p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Valor del inventario</p>
            <p className="text-2xl font-bold">
              {inventoryValue.toLocaleString("es-CO", {
                style: "currency",
                currency: "COP",
                maximumFractionDigits: 0,
              })}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Con stock bajo</p>
            <p className="text-2xl font-bold text-amber-600">
              {lowStockProducts.length}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Agotados</p>
            <p className="text-2xl font-bold text-red-600">
              {outOfStockCount}
            </p>
          </div>
        </div>

        <section className="mb-10 rounded-xl border bg-white p-8 shadow-sm">
          <h3 className="mb-6 text-2xl font-bold">
            {editingId !== null
              ? "Editar producto"
              : "Registrar nuevo producto"}
          </h3>

          <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-2 block font-medium">
                Nombre del producto
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej. Monitor Samsung"
                required
                className="w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label htmlFor="description" className="mb-2 block font-medium">
                Descripción
              </label>
              <input
                id="description"
                type="text"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Descripción del producto"
                required
                className="w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label htmlFor="price" className="mb-2 block font-medium">
                Precio (COP)
              </label>
              <input
                id="price"
                type="number"
                min="1"
                step="1"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="Ej. 850000"
                required
                className="w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label htmlFor="stock" className="mb-2 block font-medium">
                Cantidad disponible
              </label>
              <input
                id="stock"
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(event) => setStock(event.target.value)}
                placeholder="Ej. 20"
                required
                className="w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label htmlFor="minStock" className="mb-2 block font-medium">
                Stock mínimo (alerta)
              </label>
              <input
                id="minStock"
                type="number"
                min="0"
                step="1"
                value={minStock}
                onChange={(event) => setMinStock(event.target.value)}
                required
                className="w-full rounded-lg border p-3"
              />
            </div>

            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving
                  ? "Guardando..."
                  : editingId !== null
                    ? "Guardar cambios"
                    : "Registrar producto"}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setFormMessage("");
                  }}
                  disabled={saving}
                  className="rounded-lg border px-6 py-3 font-semibold hover:bg-slate-100"
                >
                  Cancelar edición
                </button>
              )}
            </div>

            {formMessage && (
              <p className="md:col-span-2 text-sm font-medium">
                {formMessage}
              </p>
            )}
          </form>
        </section>

        <section className="rounded-xl border bg-white p-8 shadow-sm">
          <h3 className="mb-6 text-2xl font-bold">Productos disponibles</h3>

          {/* Buscador de productos */}
          <div className="mb-6">
            <label htmlFor="search" className="mb-2 block font-medium">
              Buscar productos
            </label>

            <input
              id="search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nombre o descripción..."
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <label className="mt-3 flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={onlyLowStock}
                onChange={(event) => setOnlyLowStock(event.target.checked)}
                className="h-4 w-4"
              />
              Mostrar solo productos con stock bajo
            </label>
          </div>

          {lowStockProducts.length > 0 && (
            <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-5">
              <p className="font-bold text-amber-800">
                ⚠️ {lowStockProducts.length} producto(s) con stock bajo
              </p>
              <ul className="mt-2 list-disc pl-5 text-sm text-amber-800">
                {lowStockProducts.map((product) => (
                  <li key={product.id}>
                    {product.name}: {product.stock} unidades (mínimo{" "}
                    {product.minStock})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {loadingProducts ? (
            <p className="text-slate-500">Cargando productos...</p>
          ) : products.length === 0 ? (
            <p className="text-slate-500">No hay productos registrados.</p>
          ) : filteredProducts.length === 0 ? (
            <p className="text-slate-500">
              No se encontraron productos que coincidan con la búsqueda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-slate-500">
                    <th className="p-3">Producto</th>
                    <th className="p-3">Descripción</th>
                    <th className="p-3">Precio</th>
                    <th className="p-3">Stock</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b">
                      <td className="p-3 font-semibold">{product.name}</td>

                      <td className="p-3">{product.description}</td>

                      <td className="p-3">
                        {product.price.toLocaleString("es-CO", {
                          style: "currency",
                          currency: "COP",
                          maximumFractionDigits: 0,
                        })}
                      </td>

                      <td className="p-3">{product.stock} unidades</td>

                      <td className="p-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStockStatus(product).className}`}
                        >
                          {getStockStatus(product).label}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(product)}
                            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(product.id)}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-3 font-bold">Estado de conexión con el backend</h3>

          <p
            className={
              status === "connected"
                ? "text-green-600"
                : status === "error"
                  ? "text-red-600"
                  : "text-slate-500"
            }
          >
            {message}
          </p>
        </div>
      </section>

      <footer className="border-t bg-white px-8 py-6 text-center text-sm text-slate-500">
        InventarioPro © 2026 - Gestión de inventarios y pedidos
      </footer>
    </main>
  );
}
