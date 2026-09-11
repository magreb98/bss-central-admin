import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Download, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { defaultRange, formatDateTime } from "@/lib/format";
import type { AuditLog, Paginated, Tenant } from "@/lib/types";

export const Route = createFileRoute("/_admin/audit-logs")({
  head: () => ({
    meta: [
      { title: "Journaux d'audit MCP — BSS POS Admin" },
      {
        name: "description",
        content: "Consultez les appels d'outils MCP effectués par les entreprises clientes.",
      },
      { property: "og:title", content: "Journaux d'audit MCP — BSS POS Admin" },
      {
        property: "og:description",
        content: "Consultez les appels d'outils MCP effectués par les entreprises clientes.",
      },
    ],
  }),
  component: AuditLogsPage,
});

const PER_PAGE = 25;

function AuditLogsPage() {
  const initial = defaultRange(7);
  const [tenantId, setTenantId] = useState("all");
  const [tool, setTool] = useState("");
  const [range, setRange] = useState(initial);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await api.get("/admin/audit-logs/export", {
        params: {
          tenant_id: tenantId === "all" ? "" : tenantId,
          tool: tool || "",
          from: range.from,
          to: range.to,
        },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${range.from}-${range.to}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Erreur lors de l'export CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  const tenantsQuery = useQuery({
    queryKey: ["admin", "tenants", "active-options"],
    queryFn: async () => {
      const { data } = await api.get<{ data: Tenant[] }>("/admin/tenants", {
        params: { status: "actif", per_page: 100 },
      });
      return data.data;
    },
  });

  const logsQuery = useQuery({
    queryKey: ["admin", "audit-logs", { tenantId, tool, range, page }],
    queryFn: async () => {
      const { data } = await api.get<Paginated<AuditLog>>("/admin/audit-logs", {
        params: {
          tenant_id: tenantId === "all" ? "" : tenantId,
          tool,
          from: range.from,
          to: range.to,
          page,
          per_page: PER_PAGE,
        },
      });
      return data;
    },
  });

  const logs = logsQuery.data?.data ?? [];
  const meta = logsQuery.data?.meta;

  return (
    <div className="space-y-6">
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">Journaux d'audit MCP</h1>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label>Entreprise</Label>
            <Select
              value={tenantId}
              onValueChange={(value) => {
                setTenantId(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-60 bg-white">
                <SelectValue placeholder="Toutes les entreprises" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les entreprises</SelectItem>
                {(tenantsQuery.data ?? []).map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="tool">Outil MCP</Label>
            <Input
              id="tool"
              value={tool}
              onChange={(e) => {
                setTool(e.target.value);
                setPage(1);
              }}
              placeholder="Filtrer par outil…"
              className="w-52 bg-white"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="from">Du</Label>
            <Input
              id="from"
              type="date"
              value={range.from}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
              className="w-44 bg-white"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="to">Au</Label>
            <Input
              id="to"
              type="date"
              value={range.to}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
              className="w-44 bg-white"
            />
          </div>
        </div>

        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Exporter CSV
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entreprise</TableHead>
                <TableHead>Outil</TableHead>
                <TableHead>Appelé le</TableHead>
                <TableHead className="text-right">Détails</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log, index) => {
                const key = `${log.tenant_id}-${log.called_at}-${index}`;
                const isOpen = expanded === key;
                return (
                  <>
                    <TableRow key={key}>
                      <TableCell>
                        <span className="bg-muted text-foreground rounded-full px-2.5 py-0.5 text-xs font-medium">
                          {log.tenant_name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <code className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-xs">
                          {log.tool}
                        </code>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDateTime(log.called_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Voir les détails"
                          onClick={() => setExpanded(isOpen ? null : key)}
                        >
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {isOpen && (
                      <TableRow key={`${key}-details`}>
                        <TableCell colSpan={4}>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <p className="text-muted-foreground mb-1 text-xs font-semibold">
                                Entrée
                              </p>
                              <pre className="bg-muted max-h-64 overflow-y-auto rounded-lg p-3 font-mono text-xs">
                                {JSON.stringify(log.input, null, 2) ?? "null"}
                              </pre>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1 text-xs font-semibold">
                                Sortie
                              </p>
                              <pre className="bg-muted max-h-64 overflow-y-auto rounded-lg p-3 font-mono text-xs">
                                {JSON.stringify(log.output, null, 2) ?? "null"}
                              </pre>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
              {!logsQuery.isLoading && logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground text-center text-sm">
                    Aucun journal trouvé pour les filtres sélectionnés.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              {meta ? `${meta.total} entrée(s) · page ${meta.current_page}/${meta.last_page}` : ""}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta || meta.current_page >= meta.last_page}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
