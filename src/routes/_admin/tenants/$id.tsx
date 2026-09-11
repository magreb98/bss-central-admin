import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Check, Loader2, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ActiveBadge, StatusBadge } from "@/components/admin/StatusBadge";
import { api } from "@/lib/api";
import { defaultRange, formatDate, formatNumber, formatRelative, formatXAF } from "@/lib/format";
import { PROVISIONING_STEPS } from "@/lib/types";
import type { DailyStat, Domain, Tenant, TenantMetrics, TenantUser } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_admin/tenants/$id")({
  head: () => ({
    meta: [
      { title: "Détail entreprise — BSS POS Admin" },
      {
        name: "description",
        content:
          "Provisionnement, statistiques, utilisateurs et domaines d'une entreprise cliente BSS POS.",
      },
      { property: "og:title", content: "Détail entreprise — BSS POS Admin" },
      {
        property: "og:description",
        content:
          "Provisionnement, statistiques, utilisateurs et domaines d'une entreprise cliente BSS POS.",
      },
    ],
  }),
  component: TenantDetailPage,
});

const DOMAIN_REGEX = /^[a-z0-9][a-z0-9\-.]+\.[a-z]{2,}$/;

function TenantDetailPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const initialRange = defaultRange(30);
  const [range, setRange] = useState(initialRange);
  const [newDomain, setNewDomain] = useState("");
  const [domainError, setDomainError] = useState<string | null>(null);
  const [nameEdit, setNameEdit] = useState<string | null>(null);

  const tenantQuery = useQuery({
    queryKey: ["admin", "tenants", id],
    queryFn: async () => {
      const { data } = await api.get<{ data: Tenant }>(`/admin/tenants/${id}`);
      return data.data;
    },
  });

  const metricsQuery = useQuery({
    queryKey: ["admin", "tenants", id, "metrics", range],
    queryFn: async () => {
      const { data } = await api.get<{ data: TenantMetrics }>(`/admin/tenants/${id}/metrics`, {
        params: range,
      });
      return data.data;
    },
  });

  const dailyQuery = useQuery({
    queryKey: ["admin", "tenants", id, "daily", range],
    queryFn: async () => {
      const { data } = await api.get<{ data: DailyStat[] }>(`/admin/tenants/${id}/metrics/daily`, {
        params: range,
      });
      return data.data;
    },
  });

  const usersQuery = useQuery({
    queryKey: ["admin", "tenants", id, "users"],
    queryFn: async () => {
      const { data } = await api.get<{ data: TenantUser[] }>(`/admin/tenants/${id}/users`);
      return data.data;
    },
  });

  const invalidateTenant = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "tenants", id] });

  const statusMutation = useMutation({
    mutationFn: async (status: "actif" | "suspendu") => {
      await api.patch(`/admin/tenants/${id}`, { status });
    },
    onSuccess: () => {
      invalidateTenant();
      toast.success("Statut mis à jour.");
    },
  });

  const renameMutation = useMutation({
    mutationFn: async (name: string) => {
      await api.patch(`/admin/tenants/${id}`, { name });
    },
    onSuccess: () => {
      invalidateTenant();
      setNameEdit(null);
      toast.success("Nom mis à jour.");
    },
  });

  const reprovisionMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/admin/tenants/${id}/reprovision`);
    },
    onSuccess: () => {
      invalidateTenant();
      toast.success("Provisionnement relancé.");
    },
  });

  const addDomainMutation = useMutation({
    mutationFn: async (domain: string) => {
      const { data } = await api.post<{ data: Domain }>(`/admin/tenants/${id}/domains`, { domain });
      return data.data;
    },
    onSuccess: () => {
      invalidateTenant();
      setNewDomain("");
      toast.success("Domaine ajouté.");
    },
  });

  const deleteDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      await api.delete(`/admin/tenants/${id}/domains/${domainId}`);
    },
    onSuccess: () => {
      invalidateTenant();
      toast.success("Domaine supprimé.");
    },
  });

  const tenant = tenantQuery.data;
  const metrics = metricsQuery.data;
  const chartData = (dailyQuery.data ?? []).map((d) => ({
    ...d,
    label: formatDate(d.date).slice(0, 5),
  }));

  const submitDomain = (event: React.FormEvent) => {
    event.preventDefault();
    if (!DOMAIN_REGEX.test(newDomain)) {
      setDomainError("Domaine invalide (ex: acme.bsspos.cm).");
      return;
    }
    setDomainError(null);
    addDomainMutation.mutate(newDomain);
  };

  const submitRename = () => {
    const trimmed = (nameEdit ?? "").trim();
    if (!trimmed) return;
    renameMutation.mutate(trimmed);
  };

  return (
    <div className="space-y-6">
      <Link to="/tenants" className="text-muted-foreground hover:text-foreground text-sm">
        ← Entreprises
      </Link>
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">
        {tenant?.name ?? "Chargement…"}
      </h1>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="lg:w-1/3">
          <Card className="lg:sticky lg:top-24">
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg">
                {nameEdit !== null ? (
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={nameEdit}
                      onChange={(e) => setNameEdit(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitRename();
                        if (e.key === "Escape") setNameEdit(null);
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={submitRename}
                      disabled={renameMutation.isPending}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={() => setNameEdit(null)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>{tenant?.name ?? "—"}</span>
                    <button
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Modifier le nom"
                      onClick={() => setNameEdit(tenant?.name ?? "")}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </CardTitle>
              {tenant && <StatusBadge status={tenant.status} />}
              <p className="text-muted-foreground text-sm">
                Créé le {formatDate(tenant?.created_at)}
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <h3 className="text-foreground mb-3 text-sm font-semibold">Provisionnement</h3>
                <ol className="space-y-3">
                  {PROVISIONING_STEPS.map((label, index) => {
                    const step = tenant?.provisioning_step ?? 0;
                    const failed = index === step && !!tenant?.provisioning_error;
                    const completed = index < step;
                    const current = index === step && !failed;
                    return (
                      <li key={label} className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px]",
                            completed && "bg-primary border-primary text-white",
                            failed && "bg-destructive border-destructive text-white",
                            current && "border-primary text-primary ring-primary/30 ring-2",
                            !completed && !failed && !current && "border-border text-muted-foreground",
                          )}
                        >
                          {completed ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : failed ? (
                            <X className="h-3.5 w-3.5" />
                          ) : (
                            index
                          )}
                        </span>
                        <span
                          className={cn(
                            "text-sm",
                            failed && "text-destructive",
                            current && "text-primary font-medium",
                            !completed && !failed && !current && "text-muted-foreground",
                          )}
                        >
                          {label}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {tenant?.provisioning_error && (
                <Alert variant="destructive">
                  <AlertTitle>Échec du provisionnement</AlertTitle>
                  <AlertDescription className="space-y-3">
                    <p>{tenant.provisioning_error}</p>
                    <Button
                      size="sm"
                      onClick={() => reprovisionMutation.mutate()}
                      disabled={reprovisionMutation.isPending}
                    >
                      {reprovisionMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Relancer le provisionnement
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <Separator />

              {tenant && (
                <Button
                  className="w-full"
                  variant={tenant.status === "actif" ? "destructive" : "default"}
                  disabled={statusMutation.isPending}
                  onClick={() =>
                    statusMutation.mutate(tenant.status === "actif" ? "suspendu" : "actif")
                  }
                >
                  {tenant.status === "actif" ? "Suspendre ce compte" : "Réactiver ce compte"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:w-2/3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1">
                  <Label htmlFor="from">Du</Label>
                  <Input
                    id="from"
                    type="date"
                    value={range.from}
                    onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
                    className="w-44"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="to">Au</Label>
                  <Input
                    id="to"
                    type="date"
                    value={range.to}
                    onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
                    className="w-44"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "CA période", value: formatXAF(metrics?.total_including_tax ?? 0) },
                  { label: "Ventes", value: formatNumber(metrics?.sale_count ?? 0) },
                  { label: "Panier moyen", value: formatXAF(metrics?.average_basket ?? 0) },
                  { label: "Utilisateurs actifs", value: formatNumber(metrics?.active_users ?? 0) },
                ].map((item) => (
                  <div key={item.label} className="border-border rounded-xl border p-4">
                    <p className="text-muted-foreground text-xs">{item.label}</p>
                    <p className="text-foreground mt-1 text-lg font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>

              <p className="text-muted-foreground text-sm">
                Dernière activité : {formatDate(metrics?.last_activity_date)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activité quotidienne — CA (XAF)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="caGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      allowDecimals={false}
                      tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatXAF(value), "CA"]}
                      labelFormatter={(label: string) => `Le ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="total_including_tax"
                      stroke="#f97316"
                      strokeWidth={2}
                      fill="url(#caGradient)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Utilisateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom complet</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Dernière connexion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(usersQuery.data ?? []).map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <ActiveBadge active={user.active} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatRelative(user.last_connected_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!usersQuery.isLoading && (usersQuery.data ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground text-center text-sm">
                        Aucun utilisateur trouvé.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Domaines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {(tenant?.domains ?? []).map((domain) => (
                  <li
                    key={domain.id}
                    className="border-border flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <span className="font-mono text-sm">{domain.domain}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Supprimer le domaine"
                      onClick={() => deleteDomainMutation.mutate(domain.id)}
                    >
                      <Trash2 className="text-destructive h-4 w-4" />
                    </Button>
                  </li>
                ))}
                {(tenant?.domains ?? []).length === 0 && (
                  <li className="text-muted-foreground text-sm">Aucun domaine.</li>
                )}
              </ul>

              <form onSubmit={submitDomain} className="flex items-start gap-2">
                <div className="flex-1">
                  <Input
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="acme.bsspos.cm"
                  />
                  {domainError && <p className="text-destructive mt-1 text-xs">{domainError}</p>}
                </div>
                <Button type="submit" disabled={addDomainMutation.isPending}>
                  {addDomainMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Ajouter
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
