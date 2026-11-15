"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { FileText, Upload, X } from "lucide-react";
import clsx from "clsx";
import { Button } from "./button";

export interface FileInputProps {
  id?: string;
  name?: string;
  accept?: string;
  maxSizeMb?: number;
  capture?: boolean | "user" | "environment";
  onChange?: (file: File | null) => void;
  hasError?: boolean;
  disabled?: boolean;
  className?: string;
}

export function FileInput({
  id,
  name,
  accept = "image/jpeg,image/png,image/webp,application/pdf",
  maxSizeMb = 5,
  capture,
  onChange,
  hasError = false,
  disabled = false,
  className,
}: FileInputProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLocalError(null);

    if (!file) {
      handleRemove();
      return;
    }

    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      setLocalError(`File size must be under ${maxSizeMb} MB`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
    onChange?.(file);

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setLocalError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onChange?.(null);
  };

  return (
    <div className={clsx("flex flex-col gap-2", className)}>
      <input
        ref={inputRef}
        type="file"
        id={id}
        name={name}
        accept={accept}
        capture={capture}
        disabled={disabled}
        onChange={handleFileChange}
        className="sr-only"
      />

      {!selectedFile ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className={clsx(
            "flex flex-col items-center justify-center p-6 rounded-md border border-dashed bg-(--surface) cursor-pointer transition-colors text-center min-h-[120px]",
            hasError || localError
              ? "border-(--negative)"
              : "border-(--line) hover:border-(--ink-soft)",
            disabled && "cursor-not-allowed opacity-60"
          )}
        >
          <Upload className="w-6 h-6 text-(--ink-soft) mb-2" />
          <span className="text-sm font-medium text-(--ink)">
            Choose a file or take a photo
          </span>
          <span className="text-xs text-(--ink-soft) mt-1">
            Max size: {maxSizeMb} MB
          </span>
        </button>
      ) : (
        <div className="flex items-center gap-3 p-3 rounded-md border border-(--line) bg-(--surface)">
          {previewUrl ? (
            <div className="relative w-14 h-14 rounded overflow-hidden border border-(--line) shrink-0 bg-(--paper)">
              <Image
                src={previewUrl}
                alt="File preview"
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-14 h-14 rounded border border-(--line) bg-(--paper) flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-(--ink-soft)" />
            </div>
          )}

          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-medium text-(--ink) truncate">
              {selectedFile.name}
            </span>
            <span className="text-xs text-(--ink-soft)">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </span>
          </div>

          <Button
            type="button"
            variant="quiet"
            size="sm"
            onClick={handleRemove}
            aria-label="Remove file"
            className="shrink-0 p-2 min-h-[36px]"
          >
            <X className="w-4 h-4 text-(--ink-soft)" />
          </Button>
        </div>
      )}

      {localError && (
        <p role="alert" className="text-xs text-(--negative)">
          {localError}
        </p>
      )}
    </div>
  );
}
