"use client";

import { useCallback, useState } from "react";
import { sendXlmPayment } from "@/lib/stellar";

type PaymentState =
  | { status: "confirm" }
  | { status: "processing"; message: string }
  | { status: "success"; hash: string }
  | { status: "error"; error: string };

export default function PaymentModal({
  source,
  destination,
  amount,
  memo,
  onClose,
  onSuccess,
}: {
  source: string;
  destination: string;
  amount: string;
  memo?: string;
  onClose: () => void;
  onSuccess: (hash: string) => void;
}) {
  const [state, setState] = useState<PaymentState>({
    status: "confirm",
  });

  const handleConfirm = useCallback(async () => {
    setState({ status: "processing", message: "Awaiting signature in Freighter..." });
    try {
      const { hash } = await sendXlmPayment({
        source,
        destination,
        amount,
        memo,
      });
      setState({ status: "success", hash });
      onSuccess(hash);
    } catch (e) {
      setState({
        status: "error",
        error: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }, [source, destination, amount, memo, onSuccess]);

  const handleRetry = useCallback(() => {
    setState({ status: "confirm" });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-xl border border-neutral/30 bg-tertiary p-6 shadow-xl">
        {state.status === "confirm" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">
              Confirm Payment
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral">Recipient</span>
                <span className="font-mono text-white">
                  {destination.slice(0, 4)}...{destination.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral">Amount</span>
                <span className="font-semibold text-secondary">
                  {amount} XLM
                </span>
              </div>
              {memo && (
                <div className="flex justify-between">
                  <span className="text-neutral">Memo</span>
                  <span className="text-white">{memo}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-neutral/30 px-4 py-2 text-sm text-neutral transition-colors hover:border-primary hover:text-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-600"
              >
                Send Payment
              </button>
            </div>
          </div>
        )}

        {state.status === "processing" && (
          <div className="space-y-4 text-center">
            <svg
              className="mx-auto h-8 w-8 animate-spin text-secondary"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <p className="text-sm text-white">{state.message}</p>
            <p className="text-xs text-neutral">
              Please check your Freighter extension.
            </p>
          </div>
        )}

        {state.status === "success" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary/20">
              <svg className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-white">
              Payment Sent
            </p>
            <p className="break-all text-xs text-neutral">{state.hash}</p>
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${state.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm text-primary underline transition-colors hover:text-teal-400"
            >
              View on Stellar Expert
            </a>
            <button
              onClick={onClose}
              className="mt-2 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-600"
            >
              Done
            </button>
          </div>
        )}

        {state.status === "error" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {state.error}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-neutral/30 px-4 py-2 text-sm text-neutral transition-colors hover:border-primary hover:text-primary"
              >
                Close
              </button>
              <button
                onClick={handleRetry}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-600"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
