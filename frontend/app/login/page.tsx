"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ usuario, password }),
      });

      if (!res.ok) {
        setError("Usuario o contraseña incorrectos");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl border border-gray-500/30 p-8"
      >
        <h1 className="text-2xl font-bold">Iniciar sesión</h1>

        <input
          className="w-full rounded-lg border border-gray-500/40 bg-transparent px-3 py-2"
          placeholder="Usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          required
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            className="w-full rounded-lg border border-gray-500/40 bg-transparent px-3 py-2 pr-20"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-500 hover:text-blue-400"
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={cargando}
          className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {cargando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}