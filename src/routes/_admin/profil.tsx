import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api, applyValidationErrors } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useCurrentAdmin, useChangePassword, type ChangePasswordPayload } from "@/hooks/use-admin-auth";

export const Route = createFileRoute("/_admin/profil")({
  head: () => ({ meta: [{ title: "Mon profil — BSS POS Admin" }] }),
  component: ProfilPage,
});

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

function ProfilPage() {
  const { data: admin, isLoading } = useCurrentAdmin();

  return (
    <div className="space-y-6">
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">Mon profil</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : admin ? (
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full">
                <span className="text-primary text-lg font-semibold">{initials(admin.name)}</span>
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-foreground text-base font-medium">{admin.name}</p>
                  <Badge variant={admin.is_super_admin ? "default" : "secondary"}>
                    {admin.is_super_admin ? "Super administrateur" : "Administrateur"}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">{admin.email}</p>
                <p className="text-muted-foreground text-xs">
                  Dernière connexion : {formatDateTime(admin.last_connected_at)}
                </p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <ChangePasswordCard />
    </div>
  );
}

function ChangePasswordCard() {
  const changePassword = useChangePassword();
  const { register, handleSubmit, reset, setError, watch, formState } = useForm<ChangePasswordPayload>();

  const mutation = useMutation({
    mutationFn: (values: ChangePasswordPayload) => changePassword.mutateAsync(values),
    onSuccess: () => {
      toast.success("Mot de passe mis à jour.");
      reset();
    },
    onError: (error) => {
      const handled = applyValidationErrors(error, setError as never);
      if (handled) return;

      const axiosError = error as { response?: { data?: { code?: string; message?: string } } };
      if (axiosError.response?.data?.code === "INVALID_CURRENT_PASSWORD") {
        setError("current_password", {
          message: axiosError.response.data.message ?? "Mot de passe actuel incorrect.",
        });
        return;
      }
      toast.error("Une erreur est survenue. Réessayez.");
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mot de passe</CardTitle>
        <CardDescription>Utilisez un mot de passe d'au moins 8 caractères.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="max-w-sm space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="current_password">Mot de passe actuel</Label>
            <Input
              id="current_password"
              type="password"
              autoComplete="current-password"
              {...register("current_password", { required: true })}
            />
            {formState.errors.current_password && (
              <p className="text-destructive text-xs">{formState.errors.current_password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new_password">Nouveau mot de passe</Label>
            <Input
              id="new_password"
              type="password"
              autoComplete="new-password"
              {...register("new_password", { required: true, minLength: 8 })}
            />
            {formState.errors.new_password && (
              <p className="text-destructive text-xs">{formState.errors.new_password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new_password_confirmation">Confirmer le nouveau mot de passe</Label>
            <Input
              id="new_password_confirmation"
              type="password"
              autoComplete="new-password"
              {...register("new_password_confirmation", {
                required: true,
                validate: (value) => value === watch("new_password") || "Les mots de passe ne correspondent pas.",
              })}
            />
            {formState.errors.new_password_confirmation && (
              <p className="text-destructive text-xs">
                {formState.errors.new_password_confirmation.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={mutation.isPending} className="gap-2">
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            Mettre à jour le mot de passe
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
