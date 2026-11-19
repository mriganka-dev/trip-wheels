"use client";

import React, { useState } from "react";
import { Download, FileSpreadsheet, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { usePageTitle } from "@/hooks/use-page-title";
import { downloadResourceCsv } from "@/lib/api/users";

interface ExportCardConfig {
  id: "users" | "vehicles" | "bookings" | "issues";
  title: string;
  description: string;
  contents: string;
}

const EXPORT_RESOURCES: ExportCardConfig[] = [
  {
    id: "users",
    title: "Users Export",
    description: "Export all user accounts across customers, rental agents, individuals, and admins.",
    contents: "Columns: ID, Full Name, Email, Phone, Role, Status, Email Verified, Created At.",
  },
  {
    id: "vehicles",
    title: "Vehicles Export",
    description: "Export full fleet catalogue including moderation and live listings status.",
    contents: "Columns: ID, Type, Brand, Model, Year, Status, Per Day Price, Publisher ID, Created At.",
  },
  {
    id: "bookings",
    title: "Bookings Export",
    description: "Export booking requests, journeys, status histories, and scheduled timeframes.",
    contents: "Columns: ID, Code, Customer ID, Publisher ID, Vehicle ID, Status, Start At, End At, Duration Hours, Estimated Total, Created At.",
  },
  {
    id: "issues",
    title: "Issues Export",
    description: "Export dispute reports, severity ratings, resolution outcomes, and admin notes.",
    contents: "Columns: ID, Booking ID, Raised By, Raised Against, Type, Severity, Status, Outcome, Created At.",
  },
];

export default function ExportsPage() {
  usePageTitle("Exports");
  const { showToast } = useToast();

  const [downloadingResource, setDownloadingResource] = useState<string | null>(null);

  const handleDownload = async (resource: string) => {
    try {
      setDownloadingResource(resource);
      const blob = await downloadResourceCsv(resource);

      // Create temporary download anchor
      const timestamp = new Date().getTime();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${resource}-${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast(`${resource.charAt(0).toUpperCase() + resource.slice(1)} CSV downloaded successfully`, "brand");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to download export";
      showToast(msg, "negative");
    } finally {
      setDownloadingResource(null);
    }
  };

  return (
    <AppShell
      title="Exports"
      contextLine="Download comma-separated value (CSV) reports for offline analysis and record keeping."
    >
      <div className="space-y-6 max-w-4xl">
        {/* Compliance Warning Notice */}
        <div className="p-4 bg-paper border border-line rounded text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-ink">
            <ShieldAlert className="w-4 h-4 text-warning" />
            <span>Sensitive Data & Privacy Notice</span>
          </div>
          <p className="text-ink-soft">
            Exports contain personal data. Keep the files private, do not share them, and delete them when you are done. Every export is recorded in the audit log.
          </p>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EXPORT_RESOURCES.map((r) => {
            const isDownloading = downloadingResource === r.id;

            return (
              <div
                key={r.id}
                className="p-5 bg-surface border border-line rounded flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-brand" />
                    <h3 className="text-sm font-semibold text-ink font-display">{r.title}</h3>
                  </div>
                  <p className="text-xs text-ink">{r.description}</p>
                  <p className="text-[11px] text-ink-soft bg-paper/50 p-2 rounded border border-line font-mono">
                    {r.contents}
                  </p>
                </div>

                <div className="pt-2 border-t border-line flex items-center justify-end">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={Boolean(downloadingResource)}
                    isLoading={isDownloading}
                    onClick={() => handleDownload(r.id)}
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Download CSV
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
