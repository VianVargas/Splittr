"use client";

import { useCallback, useRef, useState } from "react";
import { parseReceiptImage } from "@/lib/ocr";
import type { ReceiptItem } from "@/lib/ocr";

const ACCEPTED = "image/png,image/jpeg,image/webp";

export default function ReceiptUploader({
  onItems,
  onSkip,
}: {
  onItems: (items: ReceiptItem[]) => void;
  onSkip: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((f: File) => {
    if (!ACCEPTED.includes(f.type)) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [preview]);

  const handleExtract = useCallback(async () => {
    if (!file) return;
    setParsing(true);
    setError(null);
    try {
      const items = await parseReceiptImage(file);
      onItems(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse receipt");
    } finally {
      setParsing(false);
    }
  }, [file, onItems]);

  return (
    <div className="rounded-xl border border-neutral/30 bg-tertiary p-5">
      <h3 className="mb-3 text-sm font-semibold text-white">
        Upload Receipt
      </h3>

      {!preview ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral/30 px-4 py-10 text-center transition-colors hover:border-primary"
        >
          <svg
            className="h-8 w-8 text-neutral"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.38-1.71 3.75 3.75 0 013.262 3.876A3.002 3.002 0 0118 19.5H6.75z"
            />
          </svg>
          <p className="text-sm text-neutral">
            Drop a receipt image here, or click to browse
          </p>
          <p className="text-xs text-neutral/60">PNG, JPG, WebP</p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            onChange={handleChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-lg">
            <img
              src={preview}
              alt="Receipt preview"
              className="max-h-48 w-full object-contain"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-xs text-neutral">{file?.name}</p>
            <button
              onClick={handleRemove}
              className="shrink-0 text-xs text-neutral transition-colors hover:text-red-400"
            >
              Remove Image
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          <button
            onClick={handleExtract}
            disabled={parsing}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {parsing ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Extracting Items...
              </>
            ) : (
              "Extract Items"
            )}
          </button>
        </div>
      )}

      <button
        onClick={onSkip}
        className="mt-3 w-full rounded-lg border border-neutral/30 px-4 py-2 text-sm text-neutral transition-colors hover:border-primary hover:text-primary"
      >
        Skip & Enter Amount Manually
      </button>
    </div>
  );
}
