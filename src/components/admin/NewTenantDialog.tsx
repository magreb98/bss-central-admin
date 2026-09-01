import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, applyValidationErrors } from "@/lib/api";
import type { Tenant } from "@/lib/types";

const schema = z.object({
  name: z.string().min(1, "Nom requis."),
  domain: z
    .string()
    .regex(/^[a-z0-9][a-z0-9\-.]+\.[a-z]{2,}$/, "Domaine invalide (ex: acme.bsspos.cm)."),
  first_name: z.string().min(1, "Prénom requis."),
  last_name: z.string().min(1, "Nom de famille requis."),
  phone: z.string().min(1, "Téléphone requis."),
  password: z.string().min(8, "8 caractères minimum."),
});

type FormValues = z.infer<typeof schema>;

export function NewTenantDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    trigger,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      domain: "",
      first_name: "",
      last_name: "",
      phone: "",
      password: "",
    },
  });

  const close = () => {
    onOpenChange(false);
    setStep(1);
    reset();
  };

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { data } = await api.post<{ data: Tenant }>("/admin/tenants", {
        name: values.name,
        domain: values.domain,
        initial_admin: {
          first_name: values.first_name,
          last_name: values.last_name,
          phone: values.phone,
          password: values.password,
        },
      });
      return data.data;
    },
    onSuccess: (tenant) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tenants"] });
      toast.success("Entreprise créée. Le provisionnement est lancé en arrière-plan.");
      close();
      navigate({ to: "/tenants/$id", params: { id: tenant.id } });
    },
    onError: (error) => {
      applyValidationErrors(error, setError as never);
    },
  });

  const goNext = async () => {
    const valid = await trigger(["name", "domain"]);
    if (valid) setStep(2);
  };

  return (
    <Dialog open={open} onOpenChange={(value) => (value ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle entreprise</DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Étape 1 sur 2 — Informations de l'entreprise"
              : "Étape 2 sur 2 — Administrateur initial"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
          {step === 1 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Nom de l'entreprise</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domaine principal</Label>
                <Input id="domain" {...register("domain")} />
                <p className="text-muted-foreground text-xs">Ex: monentreprise.bsspos.cm</p>
                {errors.domain && (
                  <p className="text-destructive text-xs">{errors.domain.message}</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Prénom</Label>
                  <Input id="first_name" {...register("first_name")} />
                  {errors.first_name && (
                    <p className="text-destructive text-xs">{errors.first_name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Nom de famille</Label>
                  <Input id="last_name" {...register("last_name")} />
                  {errors.last_name && (
                    <p className="text-destructive text-xs">{errors.last_name.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" placeholder="+237 6XX XXX XXX" {...register("phone")} />
                {errors.phone && <p className="text-destructive text-xs">{errors.phone.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe temporaire</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-muted-foreground absolute inset-y-0 right-3 flex items-center"
                    aria-label="Afficher le mot de passe"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-destructive text-xs">{errors.password.message}</p>
                )}
              </div>
            </>
          )}

          <DialogFooter>
            {step === 1 ? (
              <>
                <Button type="button" variant="ghost" onClick={close}>
                  Annuler
                </Button>
                <Button type="button" onClick={goNext}>
                  Suivant →
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  ← Retour
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Provisionner
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
