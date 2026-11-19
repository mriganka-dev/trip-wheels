"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Search, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { FilterBar } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { usePageTitle } from "@/hooks/use-page-title";
import { getAdminUsers } from "@/lib/api/users";
import { getAccountStatusMeta, getRoleLabel } from "@/lib/constants";
import { formatDateOnly, formatDateTime } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import type { AdminUserItem } from "@/types/users";

export default function UsersListPage() {
  usePageTitle("Users");

  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  const usersQuery = useQuery({
    queryKey: queryKeys.users.list({
      role: roleFilter,
      accountStatus: statusFilter,
      search: searchQuery,
      page,
      limit: 20,
    }),
    queryFn: () =>
      getAdminUsers({
        role: roleFilter,
        accountStatus: statusFilter,
        search: searchQuery.trim() || undefined,
        page,
        limit: 20,
      }),
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const usersData = usersQuery.data;
  const items = usersData?.items || [];
  const totalItems = usersData?.totalItems || 0;
  const totalPages = usersData?.totalPages || 1;
  const limit = usersData?.limit || 20;

  const columns: Column<AdminUserItem>[] = [
    {
      key: "name",
      header: "Name & Contact",
      render: (u) => (
        <div className="space-y-0.5 text-xs">
          <Link
            href={`/users/${u._id}`}
            className="font-semibold text-ink hover:text-brand"
          >
            {u.fullName}
          </Link>
          <p className="text-ink-soft text-[11px]">{u.email}</p>
          <p className="text-ink-soft font-mono text-[11px]">{u.phone}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (u) => {
        const isCustomer = u.role === "customer";
        const isAdmin = u.role === "admin";
        const isAgent = u.role === "agent";
        const tone = isAdmin ? "negative" : isAgent ? "brand" : isCustomer ? "neutral" : "warning";

        return <Badge tone={tone}>{getRoleLabel(u.role)}</Badge>;
      },
    },
    {
      key: "phoneConfirmed",
      header: "Phone Confirmed",
      render: (u) => (
        <div className="flex items-center gap-1 text-xs">
          {u.phoneConfirmedByAdmin ? (
            <span className="text-brand font-medium inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Confirmed
            </span>
          ) : (
            <span className="text-ink-soft">Not confirmed</span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Account Status",
      render: (u) => {
        const meta = getAccountStatusMeta(u.accountStatus);
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      key: "createdAt",
      header: "Created Date",
      render: (u) => (
        <span className="text-xs text-ink-soft">{formatDateOnly(u.createdAt)}</span>
      ),
    },
    {
      key: "lastLogin",
      header: "Last Sign In",
      render: (u) => (
        <span className="text-xs text-ink-soft">
          {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Never"}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (u) => (
        <Link
          href={`/users/${u._id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
        >
          <span>View</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      ),
    },
  ];

  return (
    <AppShell
      title="Users"
      contextLine="All user accounts across customers, rental agents, individual owners, and administrators."
    >
      <div className="space-y-4">
        {/* Filter Bar */}
        <FilterBar>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full">
            {/* Role Filter */}
            <div>
              <label htmlFor="user-role-filter" className="block text-xs font-semibold text-ink-soft mb-1">
                Role
              </label>
              <Select
                id="user-role-filter"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { label: "All Roles", value: "all" },
                  { label: "Customer", value: "customer" },
                  { label: "Agent", value: "agent" },
                  { label: "Individual", value: "individual" },
                  { label: "Admin", value: "admin" },
                ]}
              />
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="user-status-filter" className="block text-xs font-semibold text-ink-soft mb-1">
                Account Status
              </label>
              <Select
                id="user-status-filter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { label: "All Statuses", value: "all" },
                  { label: "Active", value: "active" },
                  { label: "Suspended", value: "suspended" },
                ]}
              />
            </div>

            {/* Keyword Search */}
            <div>
              <label htmlFor="user-search" className="block text-xs font-semibold text-ink-soft mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-ink-soft absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="user-search"
                  placeholder="Name, email or phone..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </FilterBar>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={items}
          keyExtractor={(u) => u._id}
          isLoading={usersQuery.isLoading}
          emptyMessage="No users match the selected filters or search query."
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            page={page}
            limit={limit}
            totalItems={totalItems}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </AppShell>
  );
}
