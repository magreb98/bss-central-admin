import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  Building2,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api, clearToken } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useCurrentAdmin } from "@/hooks/use-admin-auth";

const LINKS = [
  { to: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/tenants", label: "Entreprises", icon: Building2 },
  { to: "/admin-users", label: "Administrateurs", icon: Users },
  { to: "/audit-logs", label: "Journaux d'audit", icon: ClipboardList },
  { to: "/analytics", label: "Analytiques", icon: BarChart3 },
  { to: "/monitoring", label: "Monitoring", icon: Activity },
  { to: "/settings", label: "Paramètres", icon: Settings },
] as const;

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      return (localStorage.getItem("bss-theme") as "light" | "dark") ?? "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("bss-theme", theme);
    } catch {}
  }, [theme]);

  return { theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) };
}

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AdminSidebar({ mobileOpen = false, onMobileClose }: AdminSidebarProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentAdmin();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggle } = useTheme();

  const handleLogout = async () => {
    try {
      await api.post("/admin/logout");
    } catch {
      /* session purgée quoi qu'il arrive */
    }
    clearToken();
    await queryClient.cancelQueries();
    queryClient.clear();
    navigate({ to: "/login", replace: true });
  };

  const sidebarContent = (
    <aside className="bg-sidebar text-sidebar-foreground flex h-full w-60 flex-col">
      <div className="flex items-center justify-between px-5 py-6">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-white">BSS POS</span>
          <span className="bg-primary/20 text-primary rounded-full px-2 py-0.5 text-[11px] font-semibold">
            Admin
          </span>
        </div>
        {onMobileClose && (
          <button onClick={onMobileClose} className="text-sidebar-foreground hover:text-white lg:hidden">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {LINKS.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={onMobileClose}
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
        <div className="flex items-center justify-between">
          <Link
            to="/profil"
            onClick={onMobileClose}
            className="hover:bg-sidebar-accent -mx-1 min-w-0 flex-1 rounded-lg px-1 py-1 transition-colors"
          >
            <p className="truncate text-sm font-medium text-white">{user?.name ?? "—"}</p>
            <p className="text-sidebar-ring truncate text-xs">{user?.email ?? ""}</p>
          </Link>
          <button
            onClick={toggle}
            className="text-sidebar-foreground hover:bg-sidebar-accent ml-2 rounded-lg p-1.5 transition-colors"
            aria-label="Basculer le thème"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
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

  return (
    <>
      {/* Desktop */}
      <div className="fixed inset-y-0 left-0 hidden lg:block">{sidebarContent}</div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onMobileClose}
          />
          <div className="relative z-50 h-full w-60">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-foreground hover:bg-muted rounded-lg p-2 lg:hidden"
      aria-label="Ouvrir le menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
