import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Eye, PauseCircle, PlayCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { NewTenantDialog } from "@/components/admin/NewTenantDialog";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Paginated, Tenant, TenantStatus } from "@/lib/types";

const searchSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["actif", "suspendu", "provisionning"]).optional(),
  sort: z.enum(["created_at", "name", "status", "provisioning_step"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.number().default(1),
});

export const Route = createFileRoute("/_admin/tenants/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Entreprises — BSS POS Admin" },
      {
        name: "description",
        content: "Gérez les entreprises clientes de la plateforme BSS POS et leur provisionnement.",
      },
      { property: "og:title", content: "Entreprises — BSS POS Admin" },
      {
        property: "og:description",
        content: "Gérez les entreprises clientes de la plateforme BSS POS et leur provisionnement.",
      },
    ],
  }),
  component: TenantsPage,
});

const PER_PAGE = 15;

function TenantsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();
  const [term, setTerm] = useState(search.search ?? "");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toArchive, setToArchive] = useState<Tenant | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if ((search.search ?? "") !== term) {
        navigate({
          search: (prev) => ({ ...prev, search: term || undefined, page: 1 }),
          replace: true,
        });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [term, search.search, navigate]);

  const listQuery = useQuery({
    queryKey: ["admin", "tenants", "list", search],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Tenant>>("/admin/tenants", {
        params: {
          search: search.search ?? "",
          status: search.status ?? "",
          sort: search.sort,
          order: search.order,
          page: search.page,
          per_page: PER_PAGE,
        },
      });
      return data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TenantStatus }) => {
      await api.patch(`/admin/tenants/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tenants"] });
      toast.success("Statut mis à jour.");
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/tenants/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tenants"] });
      toast.success("Entreprise archivée.");
      setToArchive(null);
    },
  });

  const meta = listQuery.data?.meta;
  const tenants = listQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">Entreprises</h1>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Rechercher une entreprise..."
            className="w-64 bg-white"
          />
          <Select
            value={search.status ?? "all"}
            onValueChange={(value) =>
              navigate({
                search: (prev) => ({
                  ...prev,
                  status: value === "all" ? undefined : (value as TenantStatus),
                  page: 1,
                }),
              })
            }
          >
            <SelectTrigger className="w-52 bg-white">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="actif">Actif</SelectItem>
              <SelectItem value="suspendu">Suspendu</SelectItem>
              <SelectItem value="provisionning">En provisionnement</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={search.sort}
            onValueChange={(value) =>
              navigate({ search: (prev) => ({ ...prev, sort: value as never, page: 1 }) })
            }
          >
            <SelectTrigger className="w-64 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Trier par : Date de création</SelectItem>
              <SelectItem value="name">Trier par : Nom</SelectItem>
              <SelectItem value="status">Trier par : Statut</SelectItem>
              <SelectItem value="provisioning_step">Trier par : Progression</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="bg-white"
            aria-label="Inverser l'ordre de tri"
            onClick={() =>
              navigate({
                search: (prev) => ({ ...prev, order: prev.order === "asc" ? "desc" : "asc" }),
              })
            }
          >
            {search.order === "asc" ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle entreprise
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entreprise</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Progression</TableHead>
                <TableHead>Domaine</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => {
                const domain = tenant.domains?.[0]?.domain;
                return (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div className="font-medium">{tenant.name}</div>
                      {domain && (
                        <span className="bg-muted text-muted-foreground mt-1 inline-block rounded px-1.5 py-0.5 font-mono text-[11px]">
                          {domain}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={tenant.status} />
                    </TableCell>
                    <TableCell>
                      <div className="w-28 space-y-1">
                        <Progress value={(tenant.provisioning_step / 5) * 100} className="h-1.5" />
                        <span className="text-muted-foreground text-xs">
                          {tenant.provisioning_step}/5
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{domain ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(tenant.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Voir l'entreprise"
                          onClick={() => navigate({ to: "/tenants/$id", params: { id: tenant.id } })}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={
                            tenant.status === "actif" ? "Suspendre" : "Réactiver"
                          }
                          disabled={statusMutation.isPending}
                          onClick={() =>
                            statusMutation.mutate({
                              id: tenant.id,
                              status: tenant.status === "actif" ? "suspendu" : "actif",
                            })
                          }
                        >
                          {tenant.status === "actif" ? (
                            <PauseCircle className="h-4 w-4" />
                          ) : (
                            <PlayCircle className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Archiver"
                          onClick={() => setToArchive(tenant)}
                        >
                          <Trash2 className="text-destructive h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!listQuery.isLoading && tenants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground text-center text-sm">
                    Aucune entreprise trouvée.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              {meta ? `${meta.total} entreprise(s) · page ${meta.current_page}/${meta.last_page}` : ""}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={(meta?.current_page ?? 1) <= 1}
                onClick={() => navigate({ search: (p) => ({ ...p, page: (p.page ?? 1) - 1 }) })}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta || meta.current_page >= meta.last_page}
                onClick={() => navigate({ search: (p) => ({ ...p, page: (p.page ?? 1) + 1 }) })}
              >
                Suivant
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <NewTenantDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      <AlertDialog open={!!toArchive} onOpenChange={(open) => !open && setToArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archiver {toArchive?.name} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette entreprise ne sera plus accessible. L'action est réversible manuellement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (toArchive) archiveMutation.mutate(toArchive.id);
              }}
            >
              Archiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
