import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { useCurrentAdmin } from "@/hooks/use-admin-auth";
import type { PlatformSettings } from "@/lib/types";

export const Route = createFileRoute("/_admin/settings")({
  head: () => ({ meta: [{ title: "Paramètres — BSS POS Admin" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { data: currentUser } = useCurrentAdmin();
  const isSuperAdmin = currentUser?.is_super_admin ?? false;
  const qc = useQueryClient();

  const settingsQuery = useQuery<PlatformSettings>({
    queryKey: ["settings"],
    queryFn: () =>
      api.get<{ data: PlatformSettings }>("/admin/settings").then((r) => r.data.data),
  });

  const { register, handleSubmit, reset, setValue, watch } = useForm<PlatformSettings>();

  useEffect(() => {
    if (settingsQuery.data) reset(settingsQuery.data);
  }, [settingsQuery.data, reset]);

  const maintenance = watch("maintenance_mode");
  const provisioning = watch("provisioning_auto");

  const saveMutation = useMutation({
    mutationFn: (values: PlatformSettings) =>
      api.patch("/admin/settings", values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Paramètres enregistrés.");
    },
    onError: () => toast.error("Erreur lors de la sauvegarde."),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">Paramètres</h1>

      {!isSuperAdmin && (
        <p className="text-muted-foreground text-sm">
          Ces paramètres sont en lecture seule. Seul un super administrateur peut les modifier.
        </p>
      )}

      <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Général</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="platform_name">Nom de la plateforme</Label>
              <Input
                id="platform_name"
                {...register("platform_name")}
                disabled={!isSuperAdmin}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact_email">Email de contact</Label>
              <Input
                id="contact_email"
                type="email"
                {...register("contact_email")}
                disabled={!isSuperAdmin}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="support_url">URL du support</Label>
              <Input
                id="support_url"
                type="url"
                {...register("support_url")}
                disabled={!isSuperAdmin}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="max_tenants">Limit d'entreprises (0 = illimité)</Label>
              <Input
                id="max_tenants"
                type="number"
                min={0}
                {...register("max_tenants", { valueAsNumber: true })}
                disabled={!isSuperAdmin}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comportement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Mode maintenance</p>
                <p className="text-muted-foreground text-xs">
                  Bloque l'accès au POS pour tous les locataires.
                </p>
              </div>
              <Switch
                checked={maintenance}
                onCheckedChange={(v) => setValue("maintenance_mode", v)}
                disabled={!isSuperAdmin}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Provisionnement automatique</p>
                <p className="text-muted-foreground text-xs">
                  Démarre le provisionnement dès la création d'une entreprise.
                </p>
              </div>
              <Switch
                checked={provisioning}
                onCheckedChange={(v) => setValue("provisioning_auto", v)}
                disabled={!isSuperAdmin}
              />
            </div>
          </CardContent>
        </Card>

        {isSuperAdmin && (
          <div className="flex justify-end">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Enregistrer
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
