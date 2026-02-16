import type { PropsWithChildren } from "react";

export function Card({ children }: PropsWithChildren) {
  return (
    <div className="theme-card rounded-2xl">
      {children}
    </div>
  );
}

export function CardHeader({ children }: PropsWithChildren) {
  return <div className="theme-card-header p-4">{children}</div>;
}

export function CardBody({ children }: PropsWithChildren) {
  return <div className="p-4">{children}</div>;
}
