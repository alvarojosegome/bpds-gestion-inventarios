
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
    return {
      label: "Agotado",
      className: "bg-red-100 text-red-700 ring-red-200",
    };
  }

  if (product.stock <= product.minStock) {
    return {
      label: "Stock bajo",
      className: "bg-amber-100 text-amber-700 ring-amber-200",
    };
  }

  return {
    label: "Disponible",
    className: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  };
}

export default function Home() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("Cargando empresa...");
  const [username, setUsername] = useState("Cargando usuario...");

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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter((product) => {
    const search = searchTerm.trim().toLowerCase();

    const matchesSearch =
      product.name.toLowerCase().includes(search) ||
      product.description.toLowerCase().includes(search);

    const matchesStock =
      !onlyLowStock || product.stock <= product.minStock;

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

  const formatCurrency = (value: number) =>
    value.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    });

  useEffect(() => {
    async function loadDashboard() {
      try {
        // Verificar la sesión y obtener la empresa del usuario autenticado.
        const sessionResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
          {
            credentials: "include",
          }
        );

        if (sessionResponse.status === 401) {
          router.replace("/login");
          return;
        }

        if (!sessionResponse.ok) {
          throw new Error("No se pudo consultar la sesión");
        }

        const account = await sessionResponse.json();

        setCompanyName(account.company.nombre);
        setUsername(account.user.usuario);

        // Comprobar la conexión con el backend.
        try {
          const healthData = await checkBackendConnection();
          setMessage(healthData.message);
          setStatus("connected");
        } catch {
          setMessage("No fue posible conectar con el backend.");
          setStatus("error");
        }

        // Cargar únicamente los productos de la empresa autenticada.
        try {
          const productData = await getProducts();
          setProducts(productData);
        } catch {
          setMessage("No fue posible cargar los productos.");
          setStatus("error");
        }
      } catch {
        setMessage("No fue posible verificar la sesión.");
        setStatus("error");
        router.replace("/login");
      } finally {
        setLoadingProducts(false);
      }
    }

    loadDashboard();
  }, [router]);

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

    // Exportar el inventario actual a un archivo CSV (compatible con Excel en español).
  function handleExportCSV() {
    if (products.length === 0) {
      alert("No hay productos en el inventario para exportar.");
      return;
    }

    const headers = [
      "ID",
      "Nombre",
      "Descripción",
      "Precio (COP)",
      "Stock Actual",
      "Stock Mínimo",
      "Estado",
    ];

    const rows = products.map((product) => {
      const estado =
        product.stock === 0
          ? "Agotado"
          : product.stock <= product.minStock
          ? "Stock bajo"
          : "Disponible";

      return [
        product.id,
        product.name.replace(/;/g, ","),
        product.description.replace(/;/g, ","),
        product.price,
        product.stock,
        product.minStock,
        estado,
      ].join(";");
    });

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `inventario_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }


  // Preparar el formulario para editar un producto.
  function handleViewDetails(product: Product) {
  setSelectedProduct(product);
}

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

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "¿Estás seguro de que deseas eliminar este producto?"
    );

    if (!confirmed) return;

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

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100";

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800">
      <header className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-blue-950 to-blue-800 text-white shadow-xl">
        <div className="absolute -right-20 -top-32 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-6 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl shadow-inner ring-1 ring-white/20">
              📦
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                InventarioPro
              </h1>
              <p className="text-xs font-medium text-blue-200">
                Plataforma SaaS para MicroPyMEs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-extrabold">
                {companyName}
              </p>

              <div className="mt-1 flex items-center justify-end gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-sm ring-1 ring-white/20">
                  👤
                </span>

                <div>
                  <p className="text-xs font-bold text-white">
                    {username}
                  </p>
                  <p className="text-xs text-blue-200">
                    Administrador de empresa
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
            >
              ↪ Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-9 lg:px-10">
        <section className="mb-9 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
              Panel principal
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              ¡Bienvenido a tu inventario!
            </h2>
            <p className="mt-3 max-w-2xl text-slate-500">
              Administra tus productos, consulta existencias y mantén el
              control de tu negocio desde un solo lugar.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-full border border-white bg-white px-4 py-2 shadow-sm md:self-auto">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                status === "connected"
                  ? "bg-emerald-500"
                  : status === "error"
                    ? "bg-red-500"
                    : "animate-pulse bg-amber-500"
              }`}
            />
            <span className="text-xs font-bold text-slate-600">
              {status === "connected"
                ? "Sistema conectado"
                : status === "error"
                  ? "Sin conexión"
                  : "Conectando..."}
            </span>
          </div>
        </section>

        {/* Accesos rápidos */}
        <section className="mb-8 grid gap-5 md:grid-cols-2">
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-6 text-white shadow-lg shadow-blue-900/10 transition hover:-translate-y-1 hover:shadow-xl">
            <div className="absolute -right-6 -top-8 text-8xl opacity-15 transition group-hover:scale-110">
              📦
            </div>
            <p className="text-sm font-semibold text-blue-100">
              MÓDULO PRINCIPAL
            </p>
            <h3 className="mt-2 text-2xl font-extrabold">Inventario</h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-blue-100">
              Consulta, registra, edita y controla los productos de tu negocio.
            </p>
            <a
              href="#inventario"
              className="mt-5 inline-block rounded-lg bg-white/20 px-4 py-2 text-xs font-bold ring-1 ring-white/30 transition hover:bg-white/30"
            >
              Gestionar productos →
            </a>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-800 p-6 text-white shadow-lg shadow-indigo-900/10 transition hover:-translate-y-1 hover:shadow-xl">
            <div className="absolute -right-6 -top-8 text-8xl opacity-15 transition group-hover:scale-110">
              🛒
            </div>
            <p className="text-sm font-semibold text-indigo-100">
              MÓDULO COMPLEMENTARIO
            </p>
            <h3 className="mt-2 text-2xl font-extrabold">Pedidos</h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-indigo-100">
              Organiza y realiza seguimiento a los pedidos de tu negocio.
            </p>
            <a
              href="#pedidos"
              className="mt-5 inline-block rounded-lg bg-white/20 px-4 py-2 text-xs font-bold ring-1 ring-white/30 transition hover:bg-white/30"
            >
              Ver módulo de pedidos →
            </a>
          </div>
        </section>

        {/* Indicadores */}
        <section className="mb-9">
          <div className="mb-4">
            <h3 className="text-lg font-extrabold text-slate-900">
              Resumen de inventario
            </h3>
            <p className="text-sm text-slate-500">
              Indicadores generales de tus productos
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-500">
                  Total de productos
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-xl">
                  📦
                </span>
              </div>
              <p className="mt-4 text-3xl font-extrabold text-slate-900">
                {totalProducts}
              </p>
              <p className="mt-1 text-xs font-medium text-blue-600">
                Productos registrados
              </p>
            </div>

            <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-500">
                  Valor del inventario
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-xl">
                  💰
                </span>
              </div>
              <p className="mt-4 break-words text-2xl font-extrabold text-slate-900">
                {formatCurrency(inventoryValue)}
              </p>
              <p className="mt-1 text-xs font-medium text-violet-600">
                Valor total de existencias
              </p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-500">
                  Stock bajo
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-xl">
                  ⚠️
                </span>
              </div>
              <p className="mt-4 text-3xl font-extrabold text-amber-600">
                {lowStockProducts.length}
              </p>
              <p className="mt-1 text-xs font-medium text-amber-600">
                Requieren atención
              </p>
            </div>

            <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-500">
                  Productos agotados
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-xl">
                  🚨
                </span>
              </div>
              <p className="mt-4 text-3xl font-extrabold text-red-600">
                {outOfStockCount}
              </p>
              <p className="mt-1 text-xs font-medium text-red-600">
                Sin unidades disponibles
              </p>
            </div>
          </div>
        </section>

        {/* Formulario */}
        <section
          id="formulario"
          className="mb-9 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-2xl">
                {editingId !== null ? "✏️" : "➕"}
              </span>
              <div>
                <h3 className="text-xl font-extrabold">
                  {editingId !== null
                    ? "Editar producto"
                    : "Registrar nuevo producto"}
                </h3>
                <p className="mt-1 text-sm text-blue-100">
                  {editingId !== null
                    ? "Actualiza la información del producto seleccionado."
                    : "Completa los datos para agregar un producto al inventario."}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-5 p-6 md:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-bold text-slate-700">
                Nombre del producto
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej. Monitor Samsung"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-bold text-slate-700">
                Descripción
              </label>
              <input
                id="description"
                type="text"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Descripción del producto"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="price" className="mb-2 block text-sm font-bold text-slate-700">
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
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="stock" className="mb-2 block text-sm font-bold text-slate-700">
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
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="minStock" className="mb-2 block text-sm font-bold text-slate-700">
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
                className={inputClass}
              />
              <p className="mt-2 text-xs text-slate-400">
                Recibirás una alerta cuando las existencias lleguen a este nivel.
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Guardando..."
                  : editingId !== null
                    ? "✓ Guardar cambios"
                    : "＋ Registrar producto"}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setFormMessage("");
                  }}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
                >
                  Cancelar
                </button>
              )}
            </div>

            {formMessage && (
              <p
                role="status"
                className={`rounded-xl p-3 text-sm font-semibold md:col-span-2 ${
                  formMessage.includes("correctamente")
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {formMessage}
              </p>
            )}
          </form>
        </section>

        <section className="rounded-xl border bg-white p-8 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-2xl font-bold">
              Productos disponibles
            </h3>

            <button
              type="button"
              onClick={handleExportCSV}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              Exportar CSV
            </button>
          </div>

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
          </div>
        </section>
        {/* Inventario */}
        <section
          id="inventario"
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm scroll-mt-6"
        >
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Inventario de productos
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Consulta y administra todos tus productos registrados.
              </p>
            </div>
            <span className="w-fit rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700">
              {products.length} productos
            </span>
          </div>

          <div className="p-6">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="w-full md:max-w-md">
                <label htmlFor="search" className="mb-2 block text-sm font-bold text-slate-700">
                  Buscar productos
                </label>
                <input
                  id="search"
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="🔎 Buscar por nombre o descripción..."
                  className={inputClass}
                />
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-100">
                <input
                  type="checkbox"
                  checked={onlyLowStock}
                  onChange={(event) => setOnlyLowStock(event.target.checked)}
                  className="h-4 w-4 accent-amber-600"
                />
                Mostrar solo stock bajo
              </label>
            </div>

            {lowStockProducts.length > 0 && (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="font-extrabold text-amber-900">
                      Atención: {lowStockProducts.length} producto(s) necesitan revisión
                    </p>
                    <p className="mt-1 text-sm text-amber-800">
                      Estos productos tienen existencias iguales o inferiores
                      a su stock mínimo.
                    </p>
                    <ul className="mt-3 space-y-1 text-sm text-amber-900">
                      {lowStockProducts.map((product) => (
                        <li key={product.id}>
                          • <strong>{product.name}</strong>: {product.stock} unidades
                          (mínimo: {product.minStock})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {loadingProducts ? (
              <div className="py-12 text-center">
                <p className="font-semibold text-slate-500">
                  Cargando productos...
                </p>
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center">
                <p className="text-4xl">📦</p>
                <p className="mt-3 font-bold text-slate-700">
                  Aún no tienes productos registrados
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Utiliza el formulario para agregar tu primer producto.
                </p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-xl bg-slate-50 py-10 text-center">
                <p className="text-3xl">🔎</p>
                <p className="mt-2 font-bold text-slate-700">
                  No se encontraron productos
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Prueba con otro término o cambia los filtros.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-extrabold">Producto</th>
                      <th className="px-5 py-4 font-extrabold">Descripción</th>
                      <th className="px-5 py-4 font-extrabold">Precio</th>
                      <th className="px-5 py-4 font-extrabold">Stock</th>
                      <th className="px-5 py-4 font-extrabold">Estado</th>
                      <th className="px-5 py-4 font-extrabold">Acciones</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product);

                      return (
                        <tr
                          key={product.id}
                          className="transition hover:bg-blue-50/50"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-lg">
                                📦
                              </span>
                              <span className="font-bold text-slate-800">
                                {product.name}
                              </span>
                            </div>
                          </td>

                          <td className="max-w-xs px-5 py-4 text-slate-500">
                            {product.description}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-700">
                            {formatCurrency(product.price)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-700">
                            {product.stock} unidades
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${stockStatus.className}`}
                            >
                              {stockStatus.label}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleEdit(product)}
                                className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-bold text-amber-800 transition hover:bg-amber-200"
                              >
                                ✏️ Editar
                              </button>
                              <button
                              type="button"
                              onClick={()=> handleViewDetails(product)}
                              className="rounded-lg bg-blue-100 px-3 py-2 text-xs font-bolt text-blue-800 transition hover:bg-blue-200"
                              >
                                👁 Ver
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(product.id)}
                                className="rounded-lg bg-red-100 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-200"
                              >
                                🗑 Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <p className="mt-4 text-xs text-slate-400">
              Mostrando {filteredProducts.length} de {products.length} productos.
            </p>
          </div>
        </section>

        {/* Módulo de pedidos */}
        <section
          id="pedidos"
          className="mt-9 scroll-mt-6 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm"
        >
          <div className="bg-gradient-to-r from-indigo-700 to-violet-700 px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-2xl">
                🛒
              </span>
              <div>
                <h3 className="text-xl font-extrabold">
                  Gestión de pedidos
                </h3>
                <p className="mt-1 text-sm text-indigo-100">
                  Organiza los pedidos de tu negocio desde un solo lugar.
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 text-center">
            <span className="text-5xl">📋</span>
            <h4 className="mt-4 text-lg font-extrabold text-slate-800">
              Módulo de pedidos
            </h4>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
              Esta sección está preparada para incorporar el registro,
              consulta y seguimiento de pedidos. Sus funcionalidades se
              implementarán en una siguiente etapa.
            </p>
            <span className="mt-5 inline-flex rounded-full bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700">
              Próximamente
            </span>
          </div>
        </section>

        {/* Estado del backend */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xl">
              🔌
            </span>
            <div>
              <h3 className="font-extrabold text-slate-800">
                Estado de conexión con el backend
              </h3>
              <p
                className={`mt-1 text-sm font-medium ${
                  status === "connected"
                    ? "text-emerald-600"
                    : status === "error"
                      ? "text-red-600"
                      : "text-slate-500"
                }`}
              >
                {message}
              </p>
            </div>
          </div>
        </section>
      </div>

            {/* Ventana de detalles del producto */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-details-title"
            className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 to-indigo-800 px-6 py-7 text-white">
              <div className="absolute -right-8 -top-10 text-9xl opacity-10">
                📦
              </div>

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
                    Información del producto
                  </p>
                  <h3
                    id="product-details-title"
                    className="mt-2 text-2xl font-extrabold"
                  >
                    {selectedProduct.name}
                  </h3>
                  <p className="mt-2 text-sm text-blue-100">
                    Consulta todos los datos de este producto.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  aria-label="Cerrar detalles"
                  className="rounded-xl bg-white/15 px-3 py-2 text-xl transition hover:bg-white/25"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Descripción
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">
                  {selectedProduct.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-blue-50 p-4">
                  <p className="text-xs font-semibold text-blue-600">
                    Precio unitario
                  </p>
                  <p className="mt-2 text-lg font-extrabold text-blue-900">
                    {formatCurrency(selectedProduct.price)}
                  </p>
                </div>

                <div className="rounded-2xl bg-violet-50 p-4">
                  <p className="text-xs font-semibold text-violet-600">
                    Stock disponible
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-violet-900">
                    {selectedProduct.stock}
                  </p>
                  <p className="text-xs text-violet-600">unidades</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-500">
                    Stock mínimo
                  </p>
                  <p className="mt-2 text-xl font-extrabold text-slate-800">
                    {selectedProduct.minStock}
                  </p>
                  <p className="text-xs text-slate-500">unidades</p>
                </div>

                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-xs font-semibold text-emerald-600">
                    Valor en inventario
                  </p>
                  <p className="mt-2 text-lg font-extrabold text-emerald-900">
                    {formatCurrency(
                      selectedProduct.price * selectedProduct.stock
                    )}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Estado del inventario
                </p>

                <span
                  className={`inline-flex rounded-full px-4 py-2 text-sm font-extrabold ring-1 ring-inset ${
                    getStockStatus(selectedProduct).className
                  }`}
                >
                  {getStockStatus(selectedProduct).label}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:from-blue-700 hover:to-indigo-700"
              >
                Cerrar detalles
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-10 border-t border-slate-200 bg-white px-6 py-6 text-center">
        <p className="text-sm font-semibold text-slate-600">
          InventarioPro © 2026
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Gestión inteligente de inventarios y pedidos para MicroPyMEs
        </p>
      </footer>
    </main>
  ); 
}