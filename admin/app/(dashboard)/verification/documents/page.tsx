"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Plus, ShieldAlert, Trash2, Upload } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { deleteDocument, getOwnDocuments, uploadDocument, uploadSelfie } from "@/lib/api/publisher";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { FileInput } from "@/components/ui/file-input";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { AppShell } from "@/components/layout/app-shell";
import type { DocumentType, VerificationDocument } from "@/types/verification";

export default function VerificationDocumentsPage() {
  const { user, profile, refetchProfile, isLoading: isAuthLoading } = useAuth();
  const { showToast } = useToast();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSelfieOpen, setIsSelfieOpen] = useState(false);

  // Form states for document upload
  const [selectedType, setSelectedType] = useState<DocumentType>("aadhar");
  const [documentNumber, setDocumentNumber] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form state for selfie upload
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfieError, setSelfieError] = useState<string | null>(null);
  const [isUploadingSelfie, setIsUploadingSelfie] = useState(false);

  const isAgent = user?.role === "agent";
  const isPending = profile?.verificationStatus === "pending";

  const { data: documents = [], refetch: refetchDocs, isLoading: isDocsLoading } = useQuery<VerificationDocument[]>({
    queryKey: queryKeys.publisher.documents,
    queryFn: getOwnDocuments,
    enabled: Boolean(user),
  });

  const availableTypes: { value: DocumentType; label: string }[] = isAgent
    ? [
        { value: "aadhar", label: "Aadhar Card (Owner ID)" },
        { value: "pan", label: "PAN Card (Owner ID)" },
        { value: "gst_certificate", label: "GST Certificate" },
        { value: "business_registration", label: "Business Registration / Trade License" },
      ]
    : [
        { value: "aadhar", label: "Aadhar Card" },
        { value: "driving_license", label: "Driving License" },
      ];

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentNumber.trim()) {
      setUploadError("Document number is required.");
      return;
    }
    if (!selectedFile) {
      setUploadError("Please choose a file to upload.");
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      await uploadDocument({
        type: selectedType,
        documentNumber: documentNumber.trim(),
        file: selectedFile,
      });

      showToast("Document uploaded successfully", "brand");
      setIsUploadOpen(false);
      setDocumentNumber("");
      setSelectedFile(null);
      await Promise.all([refetchDocs(), refetchProfile()]);
    } catch (err) {
      if (err instanceof ApiError) {
        setUploadError(err.message || "Upload failed. Please check file format and size.");
      } else {
        setUploadError("Network error. Please try again.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelfieSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selfieFile) {
      setSelfieError("Please select or capture a selfie photo.");
      return;
    }

    setSelfieError(null);
    setIsUploadingSelfie(true);

    try {
      await uploadSelfie(selfieFile);
      showToast("Selfie photo updated", "brand");
      setIsSelfieOpen(false);
      setSelfieFile(null);
      await refetchProfile();
    } catch (err) {
      if (err instanceof ApiError) {
        setSelfieError(err.message || "Failed to upload selfie photo.");
      } else {
        setSelfieError("Network error. Please try again.");
      }
    } finally {
      setIsUploadingSelfie(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (isPending) return;
    try {
      await deleteDocument(docId);
      showToast("Document deleted", "neutral");
      await Promise.all([refetchDocs(), refetchProfile()]);
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(err.message || "Cannot delete this document", "negative");
      }
    }
  };

  const formatDocType = (type: string) => {
    const map: Record<string, string> = {
      aadhar: "Aadhar Card",
      pan: "PAN Card",
      driving_license: "Driving License",
      gst_certificate: "GST Certificate",
      business_registration: "Business Registration",
      passport: "Passport",
      voter_id: "Voter ID",
      other: "Other Document",
    };
    return map[type] || type;
  };

  if (isAuthLoading || isDocsLoading) {
    return (
      <div className="p-8 text-center text-sm text-(--ink-soft)">
        Loading document records...
      </div>
    );
  }

  return (
    <AppShell title="Documents" subtitle="Manage identity and business verification documents">
      <div className="flex flex-col gap-6 max-w-3xl">
        {/* Back button and title */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/verification"
            className="p-2 rounded-md hover:bg-(--paper) text-(--ink-soft) hover:text-(--ink) transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Back to verification checklist"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold font-display text-(--ink)">
              Verification documents
            </h1>
            <p className="text-xs text-(--ink-soft)">
              Upload your official identity and business verification documents.
            </p>
          </div>
        </div>

        {!isPending && (
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Upload document
              </Button>
            </DialogTrigger>
            <DialogContent
              title="Upload verification document"
              description="Upload PDF, JPG, PNG or WEBP up to 8 MB. Document numbers are masked automatically."
            >
              {uploadError && (
                <div className="p-3 mb-4 rounded bg-red-50 border border-red-200 text-xs text-(--negative)">
                  {uploadError}
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4">
                <Field label="Document type" htmlFor="doc-type-select" required>
                  <Select
                    id="doc-type-select"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as DocumentType)}
                  >
                    {availableTypes.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field
                  label="Document number"
                  htmlFor="doc-number-input"
                  required
                  hint="Enter document number (only masked digits are shown after upload)"
                >
                  <Input
                    id="doc-number-input"
                    placeholder="e.g. XXXX-XXXX-1234"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                  />
                </Field>

                <Field label="Document file (PDF or Photo)" required>
                  <FileInput
                    maxSizeMb={8}
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={setSelectedFile}
                  />
                </Field>

                <div className="pt-2 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsUploadOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isUploading}
                    disabled={isUploading || !documentNumber || !selectedFile}
                  >
                    Upload document
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Guidance Box */}
      <div className="p-4 rounded-md border border-(--line) bg-(--surface) text-xs text-(--ink-soft) leading-relaxed">
        <strong className="text-(--ink) block mb-1">Required verification documents:</strong>
        {isAgent ? (
          <span>
            Rental agents must provide an Owner ID (Aadhar or PAN) and business proof (GST certificate or shop trade license). Files are stored privately and verified by the admin team.
          </span>
        ) : (
          <span>
            Individual owners must provide personal identification (Aadhar or Driving License) and a selfie photo holding the ID.
          </span>
        )}
      </div>

      {/* Documents List */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-bold font-display text-(--ink)">
          Uploaded documents ({documents.length})
        </h2>

        {documents.length === 0 ? (
          <div className="p-8 text-center rounded-md border border-dashed border-(--line) bg-(--surface)">
            <FileText className="w-8 h-8 text-(--ink-soft) mx-auto mb-2" />
            <p className="text-sm font-medium text-(--ink)">No documents uploaded yet</p>
            <p className="text-xs text-(--ink-soft) mt-1">
              Add your required identification documents to proceed with verification.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-(--line) rounded-md border border-(--line) bg-(--surface)">
            {documents.map((doc) => {
              const tone =
                doc.status === "approved"
                  ? "brand"
                  : doc.status === "rejected"
                  ? "negative"
                  : "warning";

              const label =
                doc.status === "approved"
                  ? "Approved"
                  : doc.status === "rejected"
                  ? "Rejected"
                  : "In review";

              const canDelete = !isPending && doc.status !== "approved";

              return (
                <div key={doc._id} className="p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-(--ink-soft) mt-0.5 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-(--ink)">
                            {formatDocType(doc.type)}
                          </span>
                          <Badge tone={tone}>{label}</Badge>
                        </div>
                        <p className="text-xs font-mono text-(--ink-soft) mt-1">
                          Number: {doc.documentNumberMasked}
                        </p>
                        <p className="text-[11px] text-(--ink-soft) mt-0.5">
                          Uploaded on {formatDate(doc.uploadedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={doc.file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-(--brand) hover:underline p-1.5"
                      >
                        View file
                      </a>

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDelete(doc._id)}
                          aria-label={`Delete ${formatDocType(doc.type)}`}
                          className="p-1.5 text-(--ink-soft) hover:text-(--negative) transition-colors rounded min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rejection remarks */}
                  {doc.status === "rejected" && doc.remarks && (
                    <div className="p-3 rounded bg-red-50 border border-red-200 text-xs text-(--negative) flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <strong>Reason for rejection:</strong> {doc.remarks}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Individual selfie section */}
      {!isAgent && (
        <section className="p-6 rounded-md border border-(--line) bg-(--surface) flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold font-display text-(--ink)">
                Selfie holding personal ID
              </h2>
              <p className="text-xs text-(--ink-soft) mt-1 leading-relaxed">
                Take a clear front-facing photo holding your personal ID next to you. This verifies your physical ownership and prevents fraudulent accounts.
              </p>
            </div>

            {profile?.selfieWithId?.url && (
              <Badge tone="brand">Uploaded</Badge>
            )}
          </div>

          {profile?.selfieWithId?.url && (
            <div className="flex items-center gap-4 p-3 rounded border border-(--line) bg-(--paper)">
              <div className="flex-1 text-xs text-(--ink)">
                <span className="font-semibold block">Selfie image attached</span>
                <span className="text-(--ink-soft)">Verified with your account credentials</span>
              </div>
              <a
                href={profile.selfieWithId.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-(--brand) underline"
              >
                View photo
              </a>
            </div>
          )}

          {!isPending && (
            <div>
              <Dialog open={isSelfieOpen} onOpenChange={setIsSelfieOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary" size="sm">
                    <Upload className="w-4 h-4 mr-1" />
                    {profile?.selfieWithId?.url ? "Replace selfie" : "Upload selfie with ID"}
                  </Button>
                </DialogTrigger>
                <DialogContent
                  title="Upload selfie holding ID"
                  description="Take a clear photo with your face and ID clearly visible. Max size 5 MB."
                >
                  {selfieError && (
                    <div className="p-3 mb-4 rounded bg-red-50 border border-red-200 text-xs text-(--negative)">
                      {selfieError}
                    </div>
                  )}

                  <form onSubmit={handleSelfieSubmit} className="flex flex-col gap-4">
                    <Field label="Selfie photo" required>
                      <FileInput
                        maxSizeMb={5}
                        accept="image/jpeg,image/png,image/webp"
                        capture="user"
                        onChange={setSelfieFile}
                      />
                    </Field>

                    <div className="pt-2 flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setIsSelfieOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        isLoading={isUploadingSelfie}
                        disabled={isUploadingSelfie || !selfieFile}
                      >
                        Upload photo
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </section>
      )}

      {/* Done button back to checklist */}
      <div className="pt-2">
        <Link href="/verification">
          <Button variant="primary" size="md">
            Return to checklist
          </Button>
        </Link>
      </div>
      </div>
    </AppShell>
  );
}
