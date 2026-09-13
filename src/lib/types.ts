export type TenantStatus = "actif" | "suspendu" | "provisionning" | "archive";

export interface Domain {
  id: string;
  domain: string;
  tenant_id: string;
  created_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  status: TenantStatus;
  provisioning_step: 0 | 1 | 2 | 3 | 4 | 5;
  provisioning_error: string | null;
  domains: Domain[];
  created_at: string;
}

export interface PlatformStats {
  total_tenants: number;
  active_tenants: number;
  tenants_in_provisioning: number;
  suspended_tenants: number;
  new_this_month: number;
  total_revenue_xaf: number;
  total_sales: number;
  period: { from: string; to: string };
}

export interface DailyStat {
  date: string;
  sale_count: number;
  total_including_tax: number;
}

export interface TenantMetrics {
  tenant_id: string;
  total_including_tax: number;
  sale_count: number;
  average_basket: number;
  active_users: number;
  last_activity_date: string | null;
  period: { from: string; to: string };
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  active: boolean;
  is_super_admin: boolean;
  last_connected_at: string | null;
  created_at: string;
}

export interface TenantUser {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  active: boolean;
  last_connected_at: string | null;
  created_at: string;
}

export interface AuditLog {
  tenant_id: string;
  tenant_name: string;
  tool: string;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  called_at: string;
}

export interface Paginated<T> {
  data: T[];
  meta: { total: number; current_page: number; per_page: number; last_page: number };
}

export interface GrowthPoint {
  month: string;
  label: string;
  new_tenants: number;
  active_tenants: number;
}

export interface RevenuePoint {
  month: string;
  label: string;
  revenue: number;
  sales: number;
}

export interface AnalyticsGrowth {
  series: GrowthPoint[];
  summary: {
    total_active: number;
    total_suspended: number;
    growth_rate_pct: number;
    new_this_month: number;
  };
}

export interface AnalyticsRevenue {
  series: RevenuePoint[];
  comparison: {
    current: { from: string; to: string; revenue: number; sales: number };
    previous: { from: string; to: string; revenue: number; sales: number };
    revenue_growth_pct: number;
    sales_growth_pct: number;
  };
}

export interface HealthCheck {
  status: "ok" | "warning" | "info" | "error";
  message: string;
  [key: string]: unknown;
}

export interface SystemHealth {
  status: "healthy" | "degraded";
  checks: Record<string, HealthCheck>;
  checked_at: string;
}

export interface PlatformSettings {
  platform_name: string;
  contact_email: string;
  max_tenants: number;
  maintenance_mode: boolean;
  provisioning_auto: boolean;
  support_url: string;
}

export interface ImpersonationToken {
  token: string;
  expires_at: string;
  user: { id: string; name: string; email: string };
  tenant: { id: string; name: string };
}

export const PROVISIONING_STEPS = [
  "Initialisé",
  "Base de données créée",
  "Migrations appliquées",
  "Données de référence chargées",
  "Administrateur créé",
  "Abonnement activé",
];
