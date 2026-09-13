import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ImpersonationToken, Tenant } from "@/lib/types";

export function useTenant(id: string) {
  return useQuery<Tenant>({
    queryKey: ["tenant", id],
    queryFn: () => api.get<Tenant>(`/admin/tenants/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  });
}

export function useToggleTenantUser(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, active }: { userId: string; active: boolean }) =>
      api.patch(`/admin/tenants/${tenantId}/users/${userId}`, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tenant", tenantId] }),
  });
}

export function useImpersonate(tenantId: string) {
  return useMutation({
    mutationFn: () =>
      api
        .post<{ data: ImpersonationToken }>(`/admin/tenants/${tenantId}/impersonate`)
        .then((r) => r.data.data),
  });
}
