import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface CurrentAdmin {
  id: string;
  name: string;
  email: string;
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
