export type TenantStatus = "actif" | "suspendu" | "provisionning";

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

export const PROVISIONING_STEPS = [
  "Initialisé",
  "Base de données créée",
  "Migrations appliquées",
  "Données de référence chargées",
  "Administrateur créé",
  "Abonnement activé",
];
