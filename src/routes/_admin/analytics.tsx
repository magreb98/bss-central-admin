import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/admin/DateRangePicker";
import { KpiCard } from "@/components/admin/KpiCard";
import { BarChart3, Building2, CircleDollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { formatNumber, formatXAF } from "@/lib/format";
import type { AnalyticsGrowth, AnalyticsRevenue } from "@/lib/types";

export const Route = createFileRoute("/_admin/analytics")({
  head: () => ({ meta: [{ title: "Analytiques — BSS POS Admin" }] }),
  component: AnalyticsPage,
});

const today = new Date().toISOString().slice(0, 10);
const sixMonthsAgo = new Date(Date.now() - 180 * 86400_000).toISOString().slice(0, 10);

function AnalyticsPage() {
  const [range, setRange] = useState({ from: sixMonthsAgo, to: today });

  const growthQuery = useQuery<AnalyticsGrowth>({
    queryKey: ["analytics", "growth", range],
    queryFn: () =>
      api
        .get<{ data: AnalyticsGrowth }>("/admin/analytics/growth", { params: { months: 6 } })
        .then((r) => r.data.data),
  });

  const revenueQuery = useQuery<AnalyticsRevenue>({
    queryKey: ["analytics", "revenue", range],
    queryFn: () =>
      api
        .get<{ data: AnalyticsRevenue }>("/admin/analytics/revenue", {
          params: { months: 6 },
        })
        .then((r) => r.data.data),
  });

  const growth = growthQuery.data;
  const revenue = revenueQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Analytiques</h1>
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Entreprises actives"
          value={formatNumber(growth?.summary.total_active ?? 0)}
          icon={Building2}
          tone="bg-success/10 text-success"
          delta={
            growth ? { value: growth.summary.growth_rate_pct, label: "vs mois prec." } : undefined
          }
        />
        <KpiCard
          label="Nouvelles ce mois"
          value={formatNumber(growth?.summary.new_this_month ?? 0)}
          icon={TrendingUp}
          tone="bg-info/10 text-info"
        />
        <KpiCard
          label="CA mois courant"
          value={formatXAF(revenue?.comparison.current.revenue ?? 0)}
          icon={CircleDollarSign}
          tone="bg-primary/10 text-primary"
          delta={
            revenue
              ? { value: revenue.comparison.revenue_growth_pct, label: "vs mois prec." }
              : undefined
          }
        />
        <KpiCard
          label="Ventes mois courant"
          value={formatNumber(revenue?.comparison.current.sales ?? 0)}
          icon={ShoppingCart}
          tone="bg-muted text-muted-foreground"
          delta={
            revenue
              ? { value: revenue.comparison.sales_growth_pct, label: "vs mois prec." }
              : undefined
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="text-primary h-4 w-4" />
              Croissance des entreprises
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growth?.series ?? []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="new_tenants" name="Nouvelles" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar
                    dataKey="active_tenants"
                    name="Actives"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CircleDollarSign className="text-primary h-4 w-4" />
              Chiffre d'affaires mensuel (XAF)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenue?.series ?? []}>
                  <defs>
                    <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tickFormatter={(v: number) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                  />
                  <Tooltip formatter={(v: number) => [formatXAF(v), "CA"]} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="CA"
                    stroke="#f97316"
                    strokeWidth={2}
                    fill="url(#revGradient)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
