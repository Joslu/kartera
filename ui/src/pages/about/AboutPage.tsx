export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-zinc-900">About</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Mi wallet es un dashboard minimalista para llevar tu presupuesto
          mensual, registrar ingresos, asignaciones y transacciones.
        </p>
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
          Inspirado en un flujo tipo inbox: primero capturas, después categorizas
          y finalmente revisas tu resumen mensual.
        </div>
      </div>
    </div>
  );
}
