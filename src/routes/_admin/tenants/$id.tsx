import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Trash2, X } from "lucide-react";
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
import type { Domain, Tenant, TenantMetrics, TenantUser } from "@/lib/types";
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

  const submitDomain = (event: React.FormEvent) => {
    event.preventDefault();
    if (!DOMAIN_REGEX.test(newDomain)) {
      setDomainError("Domaine invalide (ex: acme.bsspos.cm).");
      return;
    }
    setDomainError(null);
    addDomainMutation.mutate(newDomain);
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
              <CardTitle className="text-lg">{tenant?.name ?? "—"}</CardTitle>
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
