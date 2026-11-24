
"use client";

import { useEffect, useState } from "react";
import { checkBackendConnection } from "../lib/api";

export default function Home() {
  const [message, setMessage] = useState("Comprobando conexión...");
  const [status, setStatus] = useState("loading");

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
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-8">
      <h1 className="mb-4 text-3xl font-bold text-gray-900">
        Gestión de Inventarios y Pedidos
      </h1>

      <p className="mb-4 text-gray-700">
        Plataforma SaaS para MicroPyMEs
      </p>

      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          Estado del backend
        </h2>

        <p
          className={
            status === "connected"
              ? "text-green-600"
              : status === "error"
                ? "text-red-600"
                : "text-gray-600"
          }
        >
          {message}
        </p>
      </div>
    </main>
  );
}
