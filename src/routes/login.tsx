import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api, setToken } from "@/lib/api";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Connexion — BSS POS Admin" },
      {
        name: "description",
        content: "Espace d'administration de la plateforme BSS POS pour les opérateurs.",
      },
      { property: "og:title", content: "Connexion — BSS POS Admin" },
      {
        property: "og:description",
        content: "Espace d'administration de la plateforme BSS POS pour les opérateurs.",
      },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().email("Adresse e-mail invalide."),
  password: z.string().min(1, "Mot de passe requis."),
});

type FormValues = z.infer<typeof schema>;

function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const { data } = await api.post<{ token: string }>("/admin/login", values);
      setToken(data.token);
      navigate({ to: "/", replace: true });
    } catch {
      setError("Identifiants invalides. Veuillez réessayer.");
    }
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="border-border w-full max-w-sm rounded-2xl border bg-white p-8 shadow-lg">
        <h1 className="text-foreground text-center text-2xl font-bold tracking-tight">BSS POS</h1>
        <p className="text-muted-foreground mt-1 text-center text-sm">Espace administration</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Adresse e-mail</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-destructive text-xs">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Se connecter
          </Button>
        </form>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
