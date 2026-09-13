import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: string;
  delta?: { value: number; label?: string } | undefined;
}

export function KpiCard({ label, value, icon: Icon, tone, delta }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between pt-6">
        <div>
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="text-foreground mt-1 text-2xl font-semibold">{value}</p>
          {delta !== undefined && (
            <p
              className={`mt-1 text-xs font-medium ${
                delta.value >= 0 ? "text-success" : "text-destructive"
              }`}
            >
              {delta.value >= 0 ? "+" : ""}
              {delta.value.toFixed(1)}%{delta.label ? ` ${delta.label}` : ""}
            </p>
          )}
        </div>
        <span className={`rounded-xl p-3 ${tone}`}>
          <Icon className="h-5 w-5" />
        </span>
      </CardContent>
    </Card>
  );
}
