"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import WalletConnect, { type WalletState } from "@/components/WalletConnect";
import BalanceDisplay from "@/components/BalanceDisplay";
import ReceiptUploader from "@/components/ReceiptUploader";
import ManualBillInput from "@/components/ManualBillInput";
import ItemizedSplitter, {
  type ParticipantTotal,
} from "@/components/ItemizedSplitter";
import type { ReceiptItem } from "@/lib/ocr";
import logoSrc from "@/asset/img/Splittr Logo.png";

type InputMode = "upload" | "manual" | null;

export default function Home() {
  const [wallet, setWallet] = useState<WalletState>({ status: "checking" });
  const [balance, setBalance] = useState<string | null>(null);
  const [mode, setMode] = useState<InputMode>(null);
  const [items, setItems] = useState<ReceiptItem[] | null>(null);
  const [totals, setTotals] = useState<ParticipantTotal[]>([]);

  const handleAddressChange = useCallback((address: string) => {
    setBalance(null);
    setMode(null);
    setItems(null);
    setTotals([]);
    if (!address) {
      setWallet({ status: "disconnected" });
    } else {
      setWallet({ status: "connected", address });
    }
  }, []);

  const handleBalanceChange = useCallback((b: string) => {
    setBalance(b);
  }, []);

  const handleItems = useCallback((parsed: ReceiptItem[]) => {
    setItems(parsed);
    setTotals([]);
    setMode(null);
  }, []);

  const handleSkip = useCallback(() => {
    setMode("manual");
  }, []);

  const handleClear = useCallback(() => {
    setItems(null);
    setTotals([]);
    setMode(null);
  }, []);

  const handleTotalsChange = useCallback((t: ParticipantTotal[]) => {
    setTotals(t);
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center bg-white px-4 dark:bg-zinc-950">
      <header className="flex w-full max-w-3xl items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Image
            src={logoSrc}
            alt="Splittr logo"
            width={48}
            height={48}
            className="rounded-full"
          />
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Splittr
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {wallet.status === "connected" && (
            <BalanceDisplay
              publicKey={wallet.address}
              onBalanceChange={handleBalanceChange}
            />
          )}
          <WalletConnect
            wallet={wallet}
            onAddressChange={handleAddressChange}
          />
        </div>
      </header>

      <main className="flex w-full max-w-3xl flex-1 flex-col items-center py-8">
        {wallet.status !== "connected" && (
          <p className="mt-20 text-center text-sm text-neutral">
            Connect your Freighter wallet to get started.
          </p>
        )}

        {balance === "0" && !items && (
          <div className="mb-6 w-full rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-200">
            Your account has 0 XLM.{" "}
            <a
              href="https://laboratory.stellar.org/#account-creator"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline"
            >
              Fund it via Friendbot
            </a>{" "}
            to get started.
          </div>
        )}

        {wallet.status === "connected" && !mode && !items && (
          <div className="mt-8 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              onClick={() => setMode("upload")}
              className="flex flex-col items-center gap-3 rounded-xl border border-neutral/30 bg-tertiary px-6 py-10 text-center transition-colors hover:border-primary"
            >
              <svg
                className="h-8 w-8 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <span className="text-sm font-semibold text-white">
                Upload Receipt
              </span>
              <span className="text-xs text-neutral">
                Parse items from an image
              </span>
            </button>

            <button
              onClick={() => setMode("manual")}
              className="flex flex-col items-center gap-3 rounded-xl border border-neutral/30 bg-tertiary px-6 py-10 text-center transition-colors hover:border-primary"
            >
              <svg
                className="h-8 w-8 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                />
              </svg>
              <span className="text-sm font-semibold text-white">
                Enter Manually
              </span>
              <span className="text-xs text-neutral">
                Type bill total or line items
              </span>
            </button>
          </div>
        )}

        {wallet.status === "connected" && mode === "upload" && (
          <div className="w-full max-w-md">
            <button
              onClick={() => setMode(null)}
              className="mb-3 flex items-center gap-1 text-xs text-neutral transition-colors hover:text-primary"
            >
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>
            <ReceiptUploader onItems={handleItems} onSkip={handleSkip} />
          </div>
        )}

        {wallet.status === "connected" && mode === "manual" && (
          <div className="w-full max-w-md">
            <button
              onClick={() => setMode(null)}
              className="mb-3 flex items-center gap-1 text-xs text-neutral transition-colors hover:text-primary"
            >
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>
            <ManualBillInput onItems={handleItems} />
          </div>
        )}

        {items && items.length > 0 && (
          <div className="w-full max-w-lg">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Split Bill</h2>
              <button
                onClick={handleClear}
                className="text-xs text-neutral transition-colors hover:text-primary"
              >
                Clear & Start Over
              </button>
            </div>
            <ItemizedSplitter
              items={items}
              onTotalsChange={handleTotalsChange}
            />
          </div>
        )}
      </main>
    </div>
  );
}
