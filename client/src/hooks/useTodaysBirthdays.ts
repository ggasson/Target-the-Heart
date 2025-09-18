import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useTodaysBirthdays(groupId: string | undefined, enabled: boolean = true) {
  return useQuery<User[]>({
    queryKey: ["/api/groups", groupId, "birthdays", "today"],
    enabled: !!groupId && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes - birthdays don't change often during the day
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}