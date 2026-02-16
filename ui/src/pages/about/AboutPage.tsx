export default function AboutPage() {
  return (
    <div className="min-h-screen theme-app-bg">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-zinc-900">About</h1>
        <div className="mt-6 rounded-2xl border border-purple-900/60 bg-zinc-950 p-4 font-mono text-sm text-purple-200">
          <div className="text-xs text-purple-400">kartera@local:~$</div>
          <div className="mt-2">
            Kartera es una app sencilla para organizar gastos, ingresos y el
            estado de tus tarjetas en un solo lugar.
          </div>
          <div className="mt-2">
            Captura, categoriza y revisa tu mes con una vista clara y rapida.
          </div>
          <div className="mt-5 text-xs text-purple-400">Guia rapida (usuario final)</div>
          <div className="mt-2 space-y-1 text-purple-100">
            <div>1) En Settings crea tu mes y verifica categorías/metodos de pago.</div>
            <div>2) En Inbox registra ingresos, gastos o transferencias del día.</div>
            <div>3) Recategoriza “No identificado” hasta dejar el inbox limpio.</div>
            <div>4) En Presupuesto asigna montos por categoría y revisa avance.</div>
            <div>5) En Transacciones corrige fechas/categorías y elimina errores.</div>
            <div>6) En Tarjetas revisa deuda del ciclo y tus cuentas de débito.</div>
          </div>
          <div className="mt-4 text-xs text-purple-300">
            Recomendación: usa la app a diario y deja “No identificado” en cero al
            cierre de cada semana.
          </div>
          <pre className="mt-6 text-purple-300 whitespace-pre overflow-x-auto">
{`$$\\   $$\\                     $$\\
$$ | $$  |                    $$ |
$$ |$$  / $$$$$$\\   $$$$$$\\ $$$$$$\\    $$$$$$\\   $$$$$$\\  $$$$$$\\
$$$$$  /  \\____$$\\ $$  __$$\\\\_$$  _|  $$  __$$\\ $$  __$$\\ \\____$$\\
$$  $$<   $$$$$$$ |$$ |  \\__| $$ |    $$$$$$$$ |$$ |  \\__|$$$$$$$ |
$$ |\\$$\\ $$  __$$ |$$ |       $$ |$$\\ $$   ____|$$ |     $$  __$$ |
$$ | \\$$\\\\$$$$$$$ |$$ |       \\$$$$  |\\$$$$$$$\\ $$ |     \\$$$$$$$ |
\\__|  \\__|\\_______|\\__|        \\____/  \\_______|\\__|      \\_______|`}
          </pre>
          <div className="mt-6 text-xs text-purple-400">by @joslu</div>
        </div>
      </div>
    </div>
  );
}
