import { cn } from "@/lib/utils";
import type { TenantStatus } from "@/lib/types";

const MAP: Record<TenantStatus, { label: string; className: string }> = {
  actif: { label: "Actif", className: "bg-success/10 text-success border-success/30" },
  suspendu: {
    label: "Suspendu",
    className: "bg-destructive/10 text-destructive border-destructive/30",
  },
  provisionning: {
    label: "En provisionnement",
    className: "bg-warning/10 text-warning border-warning/30",
  },
  archive: {
    label: "Archivé",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export function StatusBadge({ status }: { status: TenantStatus }) {
  const item = MAP[status] ?? MAP.provisionning;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        item.className,
      )}
    >
      {item.label}
    </span>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        active
          ? "bg-success/10 text-success border-success/30"
          : "bg-destructive/10 text-destructive border-destructive/30",
      )}
    >
      {active ? "Actif" : "Inactif"}
    </span>
  );
}
