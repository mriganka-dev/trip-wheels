import { apiClient, ApiError } from "./client";
import type { PublisherProfile } from "@/types/auth";
import type { DocumentType, UpdateProfilePayload, VerificationDocument } from "@/types/verification";

export async function updatePublisherProfile(
  payload: UpdateProfilePayload
): Promise<PublisherProfile> {
  return apiClient<PublisherProfile>("/publishers/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function getOwnProfile(): Promise<PublisherProfile | null> {
  try {
    return await apiClient<PublisherProfile>("/publishers/profile/me");
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

export async function getOwnDocuments(): Promise<VerificationDocument[]> {
  try {
    return await apiClient<VerificationDocument[]>("/publishers/documents/me");
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      return [];
    }
    throw error;
  }
}

export async function uploadDocument(data: {
  type: DocumentType;
  documentNumber: string;
  file: File;
}): Promise<VerificationDocument> {
  const formData = new FormData();
  formData.append("type", data.type);
  formData.append("documentNumber", data.documentNumber);
  formData.append("file", data.file);

  return apiClient<VerificationDocument>("/publishers/documents", {
    method: "POST",
    body: formData,
  });
}

export async function deleteDocument(id: string): Promise<void> {
  return apiClient<void>(`/publishers/documents/${id}`, {
    method: "DELETE",
  });
}

export async function uploadSelfie(file: File): Promise<PublisherProfile> {
  const formData = new FormData();
  formData.append("selfie", file);

  return apiClient<PublisherProfile>("/publishers/selfie", {
    method: "POST",
    body: formData,
  });
}

export async function submitVerification(): Promise<PublisherProfile> {
  return apiClient<PublisherProfile>("/publishers/submit-verification", {
    method: "POST",
  });
}
