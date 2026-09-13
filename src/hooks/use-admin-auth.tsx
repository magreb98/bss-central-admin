import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface CurrentAdmin {
  id: string;
  name: string;
  email: string;
  is_super_admin: boolean;
  last_connected_at: string | null;
}

export function useCurrentAdmin() {
  return useQuery({
    queryKey: ["admin", "me"],
    queryFn: async () => {
      const { data } = await api.get<{ data: CurrentAdmin }>("/admin/me");
      return data.data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: ChangePasswordPayload) => {
      const { data } = await api.post("/admin/change-password", values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "me"] });
    },
  });
}
