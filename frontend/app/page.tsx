import Link from "next/link";

export default function Landing() {
  return (
    <main>
      <header className="flex items-center justify-between px-8 py-4">
        <span className="text-xl font-bold">Gestión de Inventarios</span>
        <Link
          href="/login"
          className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700"
        >
          Login
        </Link>
      </header>

      <section className="px-5 py-32 text-center">
        <h1 className="text-4xl font-bold">Controla tu inventario fácilmente</h1>
        <p className="mt-4 text-lg opacity-80">
          Productos, entradas, salidas y stock en un solo lugar.
        </p>
      </section>
    </main>
  );
}