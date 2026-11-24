
"use client";

import { useEffect, useState } from "react";
import {
  checkBackendConnection,
  getProducts,
  type Product,
} from "../lib/api";

export default function Home() {
  const [message, setMessage] = useState("Comprobando conexión...");
  const [status, setStatus] = useState("loading");
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

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

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <header className="flex items-center justify-between border-b bg-white px-8 py-5">
        <h1 className="text-2xl font-bold text-blue-700">
          InventarioPro
        </h1>

        <span className="text-sm text-slate-500">
          Plataforma SaaS para MicroPyMEs
        </span>
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
            Controla tus productos, organiza tus pedidos y
            mantén la información de tu negocio en un solo lugar.
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

        <section className="rounded-xl border bg-white p-8 shadow-sm">
          <h3 className="mb-6 text-2xl font-bold">
            Productos disponibles
          </h3>

          {loadingProducts ? (
            <p className="text-slate-500">
              Cargando productos...
            </p>
          ) : products.length === 0 ? (
            <p className="text-slate-500">
              No hay productos registrados.
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
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b">
                      <td className="p-3 font-semibold">
                        {product.name}
                      </td>

                      <td className="p-3">
                        {product.description}
                      </td>

                      <td className="p-3">
                        {product.price.toLocaleString("es-CO", {
                          style: "currency",
                          currency: "COP",
                          maximumFractionDigits: 0,
                        })}
                      </td>

                      <td className="p-3">
                        {product.stock} unidades
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-3 font-bold">
            Estado de conexión con el backend
          </h3>

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
