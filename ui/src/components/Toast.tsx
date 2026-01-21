import { useEffect } from "react";

export function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={[
        "fixed bottom-4 left-1/2 -translate-x-1/2 rounded-xl px-4 py-3 text-sm shadow-lg border",
        type === "success"
          ? "bg-white border-emerald-200 text-emerald-700"
          : "bg-white border-rose-200 text-rose-700",
      ].join(" ")}
      role="status"
    >
      {message}
    </div>
  );
}
