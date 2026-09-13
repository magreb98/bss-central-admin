import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PlatformStats } from "@/lib/types";

export function usePlatformStats() {
  return useQuery<PlatformStats>({
    queryKey: ["platform-stats"],
    queryFn: () => api.get<PlatformStats>("/admin/stats").then((r) => r.data),
    staleTime: 60_000,
  });
}
