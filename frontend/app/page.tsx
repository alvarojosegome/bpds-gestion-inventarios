
import Link from "next/link";

const features = [
  {
    icon: "📦",
    title: "Control de inventario",
    description:
      "Administra tus productos, cantidades disponibles y existencias desde un solo lugar.",
  },
  {
    icon: "📊",
    title: "Información organizada",
    description:
      "Consulta el estado de tu inventario y toma decisiones con información clara.",
  },
  {
    icon: "🔔",
    title: "Alertas de stock",
    description:
      "Identifica los productos con pocas existencias y evita quedarte sin mercancía.",
  },
  {
    icon: "🏢",
    title: "Tu empresa, tu espacio",
    description:
      "Registra tu empresa y gestiona la información de tu negocio desde tu propia cuenta.",
  },
];

export default function Landing() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-800">
      {/* ENCABEZADO */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl text-white">
              📦
            </span>

            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Inventario<span className="text-blue-600">Pro</span>
            </span>
          </Link>

          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
            >
              Iniciar sesión
            </Link>

            <Link
              href="/register"
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Crear cuenta
            </Link>
          </nav>
        </div>
      </header>

      {/* SECCIÓN PRINCIPAL */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-bold text-blue-700 shadow-sm">
              ✨ Gestión inteligente para tu negocio
            </span>

            <h1 className="mt-7 text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-6xl">
              Tu inventario bajo control.
              <span className="block text-blue-600">
                Tu negocio en crecimiento.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Simplifica la administración de tu empresa. Registra productos,
              controla existencias y organiza tu inventario en una plataforma
              fácil de utilizar.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/register"
                className="rounded-xl bg-blue-600 px-7 py-4 font-bold text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-1 hover:bg-blue-700"
              >
                Crear mi empresa →
              </Link>

              <Link
                href="/login"
                className="rounded-xl border border-slate-200 bg-white px-7 py-4 font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
              >
                Ya tengo una cuenta
              </Link>
            </div>

            <p className="mt-5 text-sm text-slate-500">
              Una solución práctica para MicroPyMEs.
            </p>
          </div>

          {/* VISTA PREVIA DEL PANEL */}
          <div className="relative min-w-0">
            <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-blue-200 to-indigo-200 opacity-50 blur-2xl" />

            <div className="relative min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl shadow-blue-900/10 sm:p-6">
              <div className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-100 pb-5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-500">
                    Panel de administración
                  </p>

                  <h2 className="mt-1 text-lg font-extrabold text-slate-900 sm:text-xl">
                    Resumen de inventario
                  </h2>
                </div>

                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                  📊
                </span>
              </div>

              {/* TARJETAS CORREGIDAS */}
              <div className="mt-6 grid min-w-0 grid-cols-2 gap-3">
                <div className="min-w-0 rounded-2xl bg-blue-50 p-4 sm:p-5">
                  <p className="text-sm font-semibold text-blue-700">
                    Productos
                  </p>

                  <p className="mt-2 break-words text-xl font-black leading-tight text-blue-900 sm:text-2xl">
                    Gestionados
                  </p>

                  <p className="mt-2 text-xs text-blue-700">
                    En un solo lugar
                  </p>
                </div>

                <div className="min-w-0 rounded-2xl bg-emerald-50 p-4 sm:p-5">
                  <p className="text-sm font-semibold text-emerald-700">
                    Existencias
                  </p>

                  <p className="mt-2 break-words text-xl font-black leading-tight text-emerald-900 sm:text-2xl">
                    Controladas
                  </p>

                  <p className="mt-2 text-xs text-emerald-700">
                    Actualizadas
                  </p>
                </div>
              </div>

              {/* INFORMACIÓN DE EMPRESA */}
              <div className="mt-5 min-w-0 rounded-2xl border border-slate-100 p-4 sm:p-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xl">
                    🏢
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900">
                      Tu empresa
                    </p>

                    <p className="text-sm text-slate-500">
                      Tu información organizada
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700 sm:px-3">
                    Activo
                  </span>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-slate-50 p-4 text-center text-sm font-medium text-slate-600">
                Administra tu negocio de forma sencilla.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-extrabold uppercase tracking-widest text-blue-600">
            Todo lo que necesitas
          </span>

          <h2 className="mt-3 text-3xl font-black text-slate-900 md:text-4xl">
            Herramientas para hacer crecer tu empresa
          </h2>

          <p className="mt-4 leading-7 text-slate-600">
            InventarioPro te ayuda a organizar las tareas diarias de tu negocio
            sin complicaciones.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
                {feature.icon}
              </span>

              <h3 className="mt-5 text-lg font-extrabold text-slate-900">
                {feature.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* LLAMADO A LA ACCIÓN */}
      <section className="bg-slate-900 px-6 py-16 text-center text-white">
        <h2 className="text-3xl font-black">
          Comienza a organizar tu negocio hoy
        </h2>

        <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-300">
          Crea la cuenta de tu empresa y descubre una forma más sencilla de
          administrar tus inventarios.
        </p>

        <Link
          href="/register"
          className="mt-8 inline-flex rounded-xl bg-blue-500 px-8 py-4 font-bold text-white transition hover:bg-blue-400"
        >
          Registrar mi empresa →
        </Link>
      </section>

      {/* PIE DE PÁGINA */}
      <footer className="border-t border-slate-200 bg-white px-6 py-7 text-center text-sm text-slate-500">
        © 2026 InventarioPro. Gestión inteligente para
        MicroPyMEs.
      </footer>
    </main>
  );
}
