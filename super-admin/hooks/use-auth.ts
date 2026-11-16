"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  changePassword as changePasswordApi,
  getCurrentUser,
  loginUser,
  logoutUser,
  updateUserProfile,
  uploadAvatar as uploadAvatarApi,
} from "@/lib/api/auth";
import { queryKeys } from "@/lib/query-keys";
import type {
  ChangePasswordPayload,
  LoginPayload,
  LoginResponse,
  UpdateProfilePayload,
  User,
} from "@/types/auth";

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

  const loginMutation = useMutation<LoginResponse, Error, LoginPayload>({
    mutationFn: loginUser,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.auth.me, data.user);
    },
  });

  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      try {
        await logoutUser();
      } catch {
        // Continue clearing cache even if network error
      }
    },
    onSuccess: () => {
      queryClient.clear();
      router.push("/login");
    },
  });

  const updateProfileMutation = useMutation<User, Error, UpdateProfilePayload>({
    mutationFn: updateUserProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.auth.me, updated);
    },
  });

  const uploadAvatarMutation = useMutation<User, Error, FormData>({
    mutationFn: uploadAvatarApi,
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.auth.me, updated);
    },
  });

  const changePasswordMutation = useMutation<void, Error, ChangePasswordPayload>({
    mutationFn: changePasswordApi,
  });

  return {
    user,
    isLoading: userQuery.isLoading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === "admin",
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending,
    uploadAvatar: uploadAvatarMutation.mutateAsync,
    isUploadingAvatar: uploadAvatarMutation.isPending,
    changePassword: changePasswordMutation.mutateAsync,
    isChangingPassword: changePasswordMutation.isPending,
    refetchUser: userQuery.refetch,
  };
}
