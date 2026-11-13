"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getCurrentUser, loginUser, logoutUser } from "@/lib/api/auth";
import { queryKeys } from "@/lib/query-keys";
import { syncPushSubscriptionQuietly, unsubscribeFromPush } from "@/lib/push";
import type { LoginPayload, User } from "@/types/auth";

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    data: user,
    isLoading,
    isError,
    refetch,
  } = useQuery<User>({
    queryKey: queryKeys.auth.me,
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => loginUser(payload),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.auth.me, response.user);
      // Quiet background push sync if already granted
      syncPushSubscriptionQuietly();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Remove push subscription from browser and backend before logout
      try {
        await unsubscribeFromPush();
      } catch {
        // Continue logout
      }
      return logoutUser();
    },
    onSuccess: () => {
      queryClient.clear();
      router.push("/");
    },
    onError: () => {
      queryClient.clear();
      router.push("/");
    },
  });

  return {
    user: isError ? null : user ?? null,
    isLoading,
    isAuthenticated: Boolean(user && !isError),
    isEmailVerified: Boolean(user?.isEmailVerified),
    isCustomer: user?.role === "customer",
    isSuspended: user?.accountStatus === "suspended",
    suspendedReason: user?.suspendedReason,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
    refreshUser: refetch,
  };
}

