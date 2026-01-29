export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-zinc-900">About</h1>
        <div className="mt-4 rounded-2xl border border-purple-900/60 bg-zinc-950 p-4 font-mono text-sm text-purple-200">
          <div className="text-xs text-purple-400">kartera@local:~$</div>
          <div className="mt-2">
            Kartera es una app sencilla para organizar gastos, ingresos y el
            estado de tus tarjetas en un solo lugar.
          </div>
          <div className="mt-2">
            Captura, categoriza y revisa tu mes con una vista clara y rapida.
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
