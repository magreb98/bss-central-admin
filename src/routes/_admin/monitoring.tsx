import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Info, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import type { HealthCheck, SystemHealth } from "@/lib/types";

export const Route = createFileRoute("/_admin/monitoring")({
  head: () => ({ meta: [{ title: "Monitoring — BSS POS Admin" }] }),
  component: MonitoringPage,
});

function StatusIcon({ status }: { status: HealthCheck["status"] }) {
  if (status === "ok") return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  if (status === "warning") return <AlertCircle className="h-5 w-5 text-amber-500" />;
  if (status === "error") return <AlertCircle className="h-5 w-5 text-red-500" />;
  return <Info className="h-5 w-5 text-blue-500" />;
}

function MonitoringPage() {
  const healthQuery = useQuery<SystemHealth>({
    queryKey: ["health"],
    queryFn: () =>
      api.get<{ data: SystemHealth }>("/admin/health").then((r) => r.data.data),
    refetchInterval: 30_000,
  });

  const health = healthQuery.data;
  const checks = Object.entries(health?.checks ?? {});

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">Monitoring</h1>
          {health && (
            <p className="text-muted-foreground mt-1 text-sm">
              Vérifié {formatRelative(health.checked_at)} ·{" "}
              <span
                className={
                  health.status === "healthy" ? "text-green-600" : "text-amber-600"
                }
              >
                {health.status === "healthy" ? "Système opérationnel" : "Dégradé"}
              </span>
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => healthQuery.refetch()}
          disabled={healthQuery.isFetching}
        >
          {healthQuery.isFetching ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Actualiser
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {checks.map(([key, check]) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium capitalize">
                <StatusIcon status={check.status} />
                {key.replace(/_/g, " ")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">{check.message}</p>
              {Object.entries(check)
                .filter(([k]) => !["status", "message"].includes(k))
                .map(([k, v]) => (
                  <p key={k} className="text-muted-foreground mt-1 text-xs">
                    <span className="font-medium">{k}:</span> {String(v)}
                  </p>
                ))}
            </CardContent>
          </Card>
        ))}
        {healthQuery.isLoading && (
          <div className="col-span-full flex items-center justify-center py-16">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
