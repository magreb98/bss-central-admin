import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueries } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Building2, CircleDollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { KpiCard } from "@/components/admin/KpiCard";
import { api } from "@/lib/api";
import { defaultRange, formatDate, formatNumber, formatXAF } from "@/lib/format";
import type { DailyStat, PlatformStats, Tenant } from "@/lib/types";

export const Route = createFileRoute("/_admin/")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — BSS POS Admin" },
      {
        name: "description",
        content: "Statistiques de la plateforme BSS POS : entreprises, chiffre d'affaires, ventes.",
      },
      { property: "og:title", content: "Tableau de bord — BSS POS Admin" },
      {
        property: "og:description",
        content: "Statistiques de la plateforme BSS POS : entreprises, chiffre d'affaires, ventes.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const range = defaultRange(30);

  const [statsQuery, tenantsQuery, dailyQuery] = useQueries({
    queries: [
      {
        queryKey: ["admin", "stats", range],
        queryFn: async () => {
          const { data } = await api.get<{ data: PlatformStats }>("/admin/stats", {
            params: range,
          });
          return data.data;
        },
      },
      {
        queryKey: ["admin", "tenants", "latest"],
        queryFn: async () => {
          const { data } = await api.get<{ data: Tenant[] }>("/admin/tenants", {
            params: { sort: "created_at", order: "desc", per_page: 5 },
          });
          return data.data;
        },
      },
      {
        queryKey: ["admin", "stats", "daily", range],
        queryFn: async () => {
          const { data } = await api.get<{ data: DailyStat[] }>("/admin/stats/daily", {
            params: range,
          });
          return data.data;
        },
      },
    ],
  });

  const stats = statsQuery.data;
  const chartData = (dailyQuery.data ?? []).map((d) => ({
    ...d,
    label: formatDate(d.date).slice(0, 5),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">Tableau de bord</h1>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Entreprises actives"
          value={formatNumber(stats?.active_tenants ?? 0)}
          icon={Building2}
          tone="bg-success/10 text-success"
        />
        <KpiCard
          label="Ce mois"
          value={formatNumber(stats?.new_this_month ?? 0)}
          icon={TrendingUp}
          tone="bg-info/10 text-info"
        />
        <KpiCard
          label="CA global"
          value={formatXAF(stats?.total_revenue_xaf ?? 0)}
          icon={CircleDollarSign}
          tone="bg-primary/10 text-primary"
        />
        <KpiCard
          label="Ventes totales"
          value={formatNumber(stats?.total_sales ?? 0)}
          icon={ShoppingCart}
          tone="bg-muted text-muted-foreground"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Dernières entreprises</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entreprise</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Créé le</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(tenantsQuery.data ?? []).map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">
                      <Link to="/tenants/$id" params={{ id: tenant.id }} className="hover:underline">
                        {tenant.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={tenant.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right text-sm">
                      {formatDate(tenant.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
                {!tenantsQuery.isLoading && (tenantsQuery.data ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground text-center text-sm">
                      Aucune entreprise.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Activité (30 derniers jours)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                  <Tooltip
                    formatter={(value: number) => [formatNumber(value), "Ventes"]}
                    labelFormatter={(label: string) => `Le ${label}`}
                  />
                  <Bar dataKey="sale_count" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
