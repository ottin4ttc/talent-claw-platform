"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function Dialog({ open, children }: { open: boolean; children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
    >
      <div
        className="w-full max-w-md overflow-y-auto rounded-xl border border-border bg-card p-6 text-card-foreground"
        style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)", maxHeight: "90vh" }}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg font-semibold", className)} {...props} />;
}

export function DialogContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-4", className)} {...props} />;
}
