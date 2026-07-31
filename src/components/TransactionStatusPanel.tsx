"use client";

import { useEffect, useState } from "react";
import { getTransactionStatus, type TxStatus } from "@/lib/contract";
import type { TransactionError } from "@/lib/errors";

export default function TransactionStatusPanel({
  hash,
  error,
  onSuccess,
}: {
  hash: string | null;
  error?: TransactionError;
  onSuccess?: (hash: string) => void;
}) {
  const [status, setStatus] = useState<
    "pending" | "success" | "failed" | null
  >(null);
  const [prevHash, setPrevHash] = useState(hash);
  if (prevHash !== hash) {
    setPrevHash(hash);
    setStatus(hash ? "pending" : null);
  }

  useEffect(() => {
    if (!hash || status !== "pending") return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      try {
        const s: TxStatus = await getTransactionStatus(hash);
        if (!active) return;
        if (s === "SUCCESS") {
          setStatus("success");
          onSuccess?.(hash);
        } else if (s === "FAILED") setStatus("failed");
        else timer = setTimeout(poll, 1500);
      } catch {
        if (active) setStatus("failed");
      }
    };
    poll();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [hash, status, onSuccess]);

  if (!hash || !status) return null;

  if (status === "pending") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-neutral/30 bg-tertiary px-4 py-3 text-sm text-white">
        <svg
          className="h-4 w-4 animate-spin text-secondary"
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
        <span>Awaiting confirmation on Stellar Testnet...</span>
        <span className="ml-auto font-mono text-[10px] text-neutral">
          {hash.slice(0, 12)}...
        </span>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-secondary/40 bg-secondary/10 px-4 py-3 text-sm">
        <svg
          className="mt-0.5 h-4 w-4 shrink-0 text-secondary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
        <div className="min-w-0">
          <p className="font-semibold text-white">Transaction Confirmed</p>
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-[11px] text-primary underline"
          >
            {hash}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
      <svg
        className="h-5 w-5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{error?.message ?? "Transaction failed"}</span>
    </div>
  );
}
