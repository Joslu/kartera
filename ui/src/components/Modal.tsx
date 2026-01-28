export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-5 shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-zinc-900">{title}</div>
          <button
            className="rounded-lg px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
