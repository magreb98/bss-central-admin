import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, ClipboardList, LayoutDashboard, LogOut, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, clearToken } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useCurrentAdmin } from "@/hooks/use-admin-auth";

const LINKS = [
  { to: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/tenants", label: "Entreprises", icon: Building2 },
  { to: "/admin-users", label: "Administrateurs", icon: Users },
  { to: "/audit-logs", label: "Journaux d'audit", icon: ClipboardList },
] as const;

export function AdminSidebar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentAdmin();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const handleLogout = async () => {
    try {
      await api.post("/admin/logout");
    } catch {
      /* la session est purgée quoi qu'il arrive */
    }
    clearToken();
    await queryClient.cancelQueries();
    queryClient.clear();
    navigate({ to: "/login", replace: true });
  };

  return (
    <aside className="bg-sidebar text-sidebar-foreground fixed inset-y-0 left-0 flex w-60 flex-col">
      <div className="flex items-center gap-2 px-5 py-6">
        <span className="text-lg font-bold tracking-tight text-white">BSS POS</span>
        <span className="bg-primary/20 text-primary rounded-full px-2 py-0.5 text-[11px] font-semibold">
          Admin
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {LINKS.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/20 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-sidebar-border space-y-3 border-t px-4 py-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{user?.name ?? "—"}</p>
          <p className="text-sidebar-ring truncate text-xs">{user?.email ?? ""}</p>
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="text-sidebar-foreground hover:bg-sidebar-accent w-full justify-start gap-2 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </Button>
      </div>
    </aside>
  );
}
