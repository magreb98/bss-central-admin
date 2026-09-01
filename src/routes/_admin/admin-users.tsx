import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Pencil, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ActiveBadge } from "@/components/admin/StatusBadge";
import { api, applyValidationErrors } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import { useCurrentAdmin } from "@/hooks/use-admin-auth";
import type { AdminUser } from "@/lib/types";

export const Route = createFileRoute("/_admin/admin-users")({
  head: () => ({
    meta: [
      { title: "Administrateurs — BSS POS Admin" },
      {
        name: "description",
        content: "Créez et gérez les comptes administrateurs de la plateforme BSS POS.",
      },
      { property: "og:title", content: "Administrateurs — BSS POS Admin" },
      {
        property: "og:description",
        content: "Créez et gérez les comptes administrateurs de la plateforme BSS POS.",
      },
    ],
  }),
  component: AdminUsersPage,
});

const addSchema = z.object({
  name: z.string().min(1, "Nom requis."),
  email: z.string().email("Adresse e-mail invalide."),
  password: z.string().min(8, "8 caractères minimum."),
});
type AddValues = z.infer<typeof addSchema>;

const editSchema = z.object({
  name: z.string().min(1, "Nom requis."),
  email: z.string().email("Adresse e-mail invalide."),
  active: z.boolean(),
  password: z.union([z.string().min(8, "8 caractères minimum."), z.literal("")]),
});
type EditValues = z.infer<typeof editSchema>;

function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentAdmin();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [toDelete, setToDelete] = useState<AdminUser | null>(null);
  const [showAddPassword, setShowAddPassword] = useState(false);

  const listQuery = useQuery({
    queryKey: ["admin", "admin-users"],
    queryFn: async () => {
      const { data } = await api.get<{ data: AdminUser[] }>("/admin/admin-users");
      return data.data;
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "admin-users"] });

  const addForm = useForm<AddValues>({
    resolver: zodResolver(addSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: "", email: "", active: true, password: "" },
  });

  useEffect(() => {
    if (editing) {
      editForm.reset({
        name: editing.name,
        email: editing.email,
        active: editing.active,
        password: "",
      });
    }
  }, [editing, editForm]);

  const createMutation = useMutation({
    mutationFn: async (values: AddValues) => {
      await api.post("/admin/admin-users", values);
    },
    onSuccess: () => {
      invalidate();
      setAddOpen(false);
      addForm.reset();
      toast.success("Administrateur créé.");
    },
    onError: (error) => {
      const handled = applyValidationErrors(error, addForm.setError as never);
      if (!handled) return;
      const message = addForm.getFieldState("email").error?.message ?? "";
      if (/duplicate|déjà|unique/i.test(message)) {
        addForm.setError("email", { message: "Cette adresse e-mail est déjà utilisée." });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: EditValues) => {
      if (!editing) return;
      const payload: Record<string, unknown> = {};
      if (values.name !== editing.name) payload['name'] = values.name;
      if (values.email !== editing.email) payload['email'] = values.email;
      if (values.active !== editing.active) payload['active'] = values.active;
      if (values.password) payload['password'] = values.password;
      await api.patch(`/admin/admin-users/${editing.id}`, payload);
    },
    onSuccess: () => {
      invalidate();
      setEditing(null);
      toast.success("Administrateur mis à jour.");
    },
    onError: (error) => applyValidationErrors(error, editForm.setError as never),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/admin-users/${id}`);
    },
    onSuccess: () => {
      invalidate();
      setToDelete(null);
      toast.success("Administrateur supprimé.");
    },
  });

  const isSelf = !!toDelete && toDelete.id === currentUser?.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Administrateurs</h1>
        <Button onClick={() => setAddOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Ajouter un administrateur
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière connexion</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(listQuery.data ?? []).map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <ActiveBadge active={user.active} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatRelative(user.last_connected_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Modifier"
                        onClick={() => setEditing(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Supprimer"
                        onClick={() => setToDelete(user)}
                      >
                        <Trash2 className="text-destructive h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!listQuery.isLoading && (listQuery.data ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground text-center text-sm">
                    Aucun administrateur.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ajout */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un administrateur</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={addForm.handleSubmit((values) => createMutation.mutate(values))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="add-name">Nom</Label>
              <Input id="add-name" {...addForm.register("name")} />
              {addForm.formState.errors.name && (
                <p className="text-destructive text-xs">
                  {addForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-email">Adresse e-mail</Label>
              <Input id="add-email" type="email" {...addForm.register("email")} />
              {addForm.formState.errors.email && (
                <p className="text-destructive text-xs">
                  {addForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="add-password"
                  type={showAddPassword ? "text" : "password"}
                  {...addForm.register("password")}
                />
                <button
                  type="button"
                  aria-label="Afficher le mot de passe"
                  onClick={() => setShowAddPassword((v) => !v)}
                  className="text-muted-foreground absolute inset-y-0 right-3 flex items-center"
                >
                  {showAddPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {addForm.formState.errors.password && (
                <p className="text-destructive text-xs">
                  {addForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Édition */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l'administrateur</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit((values) => updateMutation.mutate(values))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom</Label>
              <Input id="edit-name" {...editForm.register("name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Adresse e-mail</Label>
              <Input id="edit-email" type="email" {...editForm.register("email")} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-active">Actif</Label>
              <Switch
                id="edit-active"
                checked={editForm.watch("active")}
                onCheckedChange={(checked) => editForm.setValue("active", checked)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Nouveau mot de passe</Label>
              <Input id="edit-password" type="password" {...editForm.register("password")} />
              {editForm.formState.errors.password && (
                <p className="text-destructive text-xs">
                  {editForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Annuler
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Suppression */}
      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'administrateur {toDelete?.name} ?</AlertDialogTitle>
            <AlertDialogDescription>
              {isSelf
                ? "Vous ne pouvez pas supprimer votre propre compte."
                : "Tous ses tokens d'accès seront révoqués immédiatement."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSelf || deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (toDelete && !isSelf) deleteMutation.mutate(toDelete.id);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
