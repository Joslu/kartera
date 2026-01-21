import type { PropsWithChildren } from "react";

export function Card({ children }: PropsWithChildren) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      {children}
    </div>
  );
}

export function CardHeader({ children }: PropsWithChildren) {
  return <div className="p-4 border-b border-zinc-100">{children}</div>;
}

export function CardBody({ children }: PropsWithChildren) {
  return <div className="p-4">{children}</div>;
}
