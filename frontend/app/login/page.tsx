
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ usuario, password }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Usuario o contraseña incorrectos.");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-extrabold text-blue-700">
            InventarioPro
          </Link>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Bienvenido de nuevo
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Ingresa a tu cuenta para administrar tu inventario.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="usuario"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Nombre de usuario
            </label>

            <input
              id="usuario"
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Ingresa tu usuario"
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-20 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>
          
          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cargando ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          ¿Todavía no tienes una cuenta?{" "}
          <Link
            href="/register"
            className="font-semibold text-blue-600 hover:text-blue-800"
          >
            Registra tu empresa
          </Link>
        </p>
      </section>
    </main>
  );
}
