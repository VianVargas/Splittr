"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchXlmBalance } from "@/lib/stellar";

export default function BalanceDisplay({
  publicKey,
  onBalanceChange,
}: {
  publicKey: string;
  onBalanceChange?: (balance: string) => void;
}) {
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const loadBalance = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const b = await fetchXlmBalance(publicKey);
      setBalance(b);
      onBalanceChange?.(b);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [publicKey, onBalanceChange]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  return (
    <div className="flex items-center gap-2 rounded-lg bg-tertiary px-4 py-2 text-sm text-white">
      <span className="text-neutral">XLM Balance:</span>
      {loading ? (
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
      ) : error ? (
        <span className="text-red-400">Error</span>
      ) : (
        <span className="font-medium text-secondary">
          {new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(Number(balance))} XLM
        </span>
      )}
      <button
        onClick={loadBalance}
        disabled={loading}
        className="ml-1 rounded p-1 text-neutral transition-colors hover:text-white disabled:opacity-50"
        title="Refresh balance"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0115.36-5.36M20 15a9 9 0 01-15.36 5.36"
          />
        </svg>
      </button>
    </div>
  );
}
