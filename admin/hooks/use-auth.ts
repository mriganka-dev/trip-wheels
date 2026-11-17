"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getCurrentUser, getPublisherProfile, loginUser, logoutUser } from "@/lib/api/auth";
import { queryKeys } from "@/lib/query-keys";
import { syncPushSubscriptionIfGranted, unsubscribeFromPush } from "@/lib/push";
import type { LoginPayload, LoginResponse, PublisherProfile, User, VerificationStatus } from "@/types/auth";

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const userQuery = useQuery<User | null>({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      try {
        return await getCurrentUser();
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const user = userQuery.data ?? null;

  const profileQuery = useQuery<PublisherProfile | null>({
    queryKey: queryKeys.publisher.profile,
    queryFn: getPublisherProfile,
    enabled: Boolean(user && (user.role === "agent" || user.role === "individual")),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const profile = profileQuery.data ?? null;

  const loginMutation = useMutation<LoginResponse, Error, LoginPayload>({
    mutationFn: loginUser,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.auth.me, data.user);
      queryClient.invalidateQueries({ queryKey: queryKeys.publisher.profile });
      syncPushSubscriptionIfGranted().catch(() => {});
    },
  });

  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      try {
        await unsubscribeFromPush();
      } catch {
        // Non-blocking cleanup
      }
      return logoutUser();
    },
    onSuccess: () => {
      queryClient.clear();
      router.push("/login");
    },
  });

  const verificationStatus: VerificationStatus =
    profile?.verificationStatus ?? "not_submitted";

  return {
    user,
    profile,
    isLoading: userQuery.isLoading || (Boolean(user) && profileQuery.isLoading),
    isAuthenticated: Boolean(user),
    isEmailVerified: Boolean(user?.isEmailVerified),
    profileComplete: user ? (user.profileComplete ?? true) : true,
    authProviders: user?.authProviders ?? [],
    hasPassword: user ? (user.hasPassword ?? true) : true,
    verificationStatus,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
    refetchUser: userQuery.refetch,
    refetchProfile: profileQuery.refetch,
  };
}
