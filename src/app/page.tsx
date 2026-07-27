"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import WalletConnect from "@/components/WalletConnect";
import BalanceDisplay from "@/components/BalanceDisplay";
import ReceiptUploader from "@/components/ReceiptUploader";
import ManualBillInput from "@/components/ManualBillInput";
import ItemizedSplitter, {
  type ParticipantTotal,
} from "@/components/ItemizedSplitter";
import PaymentModal from "@/components/PaymentModal";
import type { ReceiptItem } from "@/lib/ocr";
import logoSrc from "@/asset/img/Splittr Logo.png";

type InputMode = "upload" | "manual" | null;

interface TxRecord {
  hash: string;
  amount: string;
  destination: string;
  memo?: string;
  timestamp: number;
  source: string;
}

const TX_KEY = "splittr_tx_history";

function loadTxs(): TxRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(TX_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveTxs(txs: TxRecord[]) {
  try {
    localStorage.setItem(TX_KEY, JSON.stringify(txs));
  } catch {}
}

interface CompletedSplit {
  id: string;
  timestamp: number;
  total: number;
  items: ReceiptItem[];
  participants: { name: string; address: string; total: number }[];
  payments: { destination: string; amount: string; hash: string }[];
  source: string;
}

const SPLITS_KEY = "splittr_completed_splits";

function loadSplits(): CompletedSplit[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SPLITS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveSplits(splits: CompletedSplit[]) {
  try {
    localStorage.setItem(SPLITS_KEY, JSON.stringify(splits));
  } catch {}
}

export default function Home() {
  const [addr, setAddr] = useState("");
  const [balance, setBalance] = useState<string | null>(null);
  const [mode, setMode] = useState<InputMode>(null);
  const [items, setItems] = useState<ReceiptItem[] | null>(null);
  const [totals, setTotals] = useState<ParticipantTotal[]>([]);
  const [payTarget, setPayTarget] = useState<ParticipantTotal | null>(
    null
  );
  const [copied, setCopied] = useState<string | null>(null);
  const [pasteInput, setPasteInput] = useState("");
  const [pasteRequest, setPasteRequest] = useState<{
    to: string;
    amount: string;
    memo: string;
  } | null>(null);
  const [txHistory, setTxHistory] = useState<TxRecord[]>([]);
  const [sessionPayments, setSessionPayments] = useState<
    { destination: string; amount: string; hash: string }[]
  >([]);
  const [completedSplits, setCompletedSplits] = useState<
    CompletedSplit[]
  >([]);
  const balanceKey = useRef(0);

  useEffect(() => {
    const all = loadTxs();
    setTxHistory(addr ? all.filter((t) => t.source === addr) : []);
  }, [addr]);

  useEffect(() => {
    const all = loadSplits();
    setCompletedSplits(
      addr ? all.filter((s) => s.source === addr) : []
    );
  }, [addr]);

  const refreshBalance = useCallback(() => {
    balanceKey.current += 1;
  }, []);

  const handleConnected = useCallback((address: string) => {
    setAddr(address);
  }, []);

  const handleDisconnected = useCallback(() => {
    setAddr("");
    setBalance(null);
    setMode(null);
    setItems(null);
    setTotals([]);
    setPayTarget(null);
    setCopied(null);
    setPasteInput("");
    setPasteRequest(null);
    setSessionPayments([]);
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
    setPayTarget(null);
    setCopied(null);
    setSessionPayments([]);
  }, []);

  const handleTotalsChange = useCallback((t: ParticipantTotal[]) => {
    setTotals(t);
  }, []);

  const handlePaymentSuccess = useCallback(
    (hash: string) => {
      if (payTarget) {
        const record: TxRecord = {
          hash,
          amount: payTarget.total.toFixed(2),
          destination: payTarget.address,
          memo: `Splittr: ${payTarget.name}`,
          timestamp: Date.now(),
          source: addr,
        };
        const updated = [record, ...loadTxs()];
        setTxHistory(updated);
        saveTxs(updated);
        setSessionPayments((prev) => [
          ...prev,
          {
            destination: payTarget.address,
            amount: payTarget.total.toFixed(2),
            hash,
          },
        ]);
      }
      setPayTarget(null);
      setCopied(null);
      refreshBalance();
    },
    [payTarget, addr, refreshBalance]
  );

  const handlePayModalClose = useCallback(() => {
    setPayTarget(null);
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
          {addr && (
            <BalanceDisplay
              key={balanceKey.current}
              publicKey={addr}
              onBalanceChange={handleBalanceChange}
            />
          )}
          <WalletConnect
            address={addr}
            onConnected={handleConnected}
            onDisconnected={handleDisconnected}
          />
        </div>
      </header>

      <main className="flex w-full max-w-3xl flex-1 flex-col items-center py-8">
        {!addr && (
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

        {!!addr && !mode && !items && (
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

        {!!addr && mode === "upload" && (
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

        {!!addr && mode === "manual" && (
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
              <h2 className="text-sm font-semibold text-white">
                Split Bill
              </h2>
              <button
                onClick={handleClear}
                className="text-xs text-neutral transition-colors hover:text-primary"
              >
                Clear & Start Over
              </button>
            </div>
            <ItemizedSplitter
              items={items}
              connectedPublicKey={addr}
              onTotalsChange={handleTotalsChange}
            />

            {totals.length > 0 &&
              totals.some((t) => t.address && t.address !== addr) && (
                <div className="mt-4 space-y-3">
                  <p className="text-xs font-medium text-neutral">
                    Settle Up
                  </p>
                  {totals
                    .filter((t) => t.address && t.address !== addr && t.total > 0)
                    .map((t) => {
                      const selfTotal = totals.find(
                        (s) => s.address === addr
                      )?.total ?? 0;
                      return (
                        <div
                          key={t.id}
                          className="rounded-xl border border-neutral/30 bg-tertiary px-5 py-3"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium text-white">
                                {t.name}
                              </span>
                              <p className="text-[11px] text-neutral">
                                {t.address.slice(0, 4)}...
                                {t.address.slice(-4)}
                              </p>
                            </div>
                            <span className="text-sm text-neutral">
                              owes{" "}
                              <span className="font-semibold text-secondary">
                                {t.total.toFixed(2)} XLM
                              </span>
                            </span>
                          </div>
                          <div className="flex gap-2">
                            {selfTotal > 0 && (
                              <button
                                onClick={() =>
                                  setPayTarget({
                                    ...t,
                                    total: selfTotal,
                                  })
                                }
                                className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-teal-600"
                              >
                                Pay Your Share ({selfTotal.toFixed(2)} XLM)
                              </button>
                            )}
                            <button
                              onClick={() => {
                                const payload = {
                                  to: addr,
                                  amount: t.total.toFixed(2),
                                  memo: `Splittr: ${t.name}`,
                                };
                                const code = btoa(
                                  JSON.stringify(payload)
                                );
                                navigator.clipboard.writeText(code);
                                setCopied(t.id);
                                setTimeout(
                                  () => setCopied(null),
                                  2000
                                );
                              }}
                              className="flex-1 rounded-lg border border-neutral/30 px-3 py-2 text-xs text-neutral transition-colors hover:border-primary hover:text-primary"
                            >
                              {copied === t.id
                                ? "Copied!"
                                : `Request ${t.total.toFixed(2)} XLM`}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

            {items && (
              <button
                onClick={() => {
                  const split: CompletedSplit = {
                    id: Math.random().toString(36).slice(2, 9),
                    timestamp: Date.now(),
                    total: items.reduce((s, i) => s + i.price, 0),
                    items: JSON.parse(JSON.stringify(items)),
                    participants: JSON.parse(
                      JSON.stringify(
                        totals.map((t) => ({
                          name: t.name,
                          address: t.address,
                          total: t.total,
                        }))
                      )
                    ),
                    payments: sessionPayments.map((p) => ({ ...p })),
                    source: addr,
                  };
                  const updated = [split, ...loadSplits()];
                  setCompletedSplits(updated);
                  saveSplits(updated);
                  setSessionPayments([]);
                  setItems(null);
                  setTotals([]);
                  setMode(null);
                }}
                className="mt-4 w-full rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-tertiary transition-colors hover:opacity-90"
              >
                Complete Split
              </button>
            )}
          </div>
        )}

        {!!addr && (
          <details className="mt-8 w-full max-w-lg">
            <summary className="cursor-pointer text-xs font-medium text-neutral transition-colors hover:text-primary">
              Have a payment code?
            </summary>
            <div className="mt-3 rounded-xl border border-neutral/30 bg-tertiary p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste request code here..."
                  value={pasteInput}
                  onChange={(e) => {
                    setPasteInput(e.target.value);
                    try {
                      const decoded = JSON.parse(atob(e.target.value));
                      if (decoded.to && decoded.amount) {
                        setPasteRequest(decoded);
                      } else {
                        setPasteRequest(null);
                      }
                    } catch {
                      setPasteRequest(null);
                    }
                  }}
                  className="min-w-0 flex-1 rounded-lg border border-neutral/30 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-neutral/50 outline-none focus:border-primary"
                />
                {pasteRequest && (
                  <button
                    onClick={() => {
                      setPayTarget({
                        id: "paste",
                        name: pasteRequest.memo || "Payment Request",
                        address: pasteRequest.to,
                        items: [],
                        total: parseFloat(pasteRequest.amount),
                      });
                      setPasteInput("");
                      setPasteRequest(null);
                    }}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-600"
                  >
                    Pay
                  </button>
                )}
              </div>
              {pasteRequest && (
                <div className="mt-2 rounded-lg bg-white/5 p-2 text-xs text-neutral">
                  Send{" "}
                  <span className="font-medium text-secondary">
                    {pasteRequest.amount} XLM
                  </span>{" "}
                  to{" "}
                  <span className="font-mono text-white">
                    {pasteRequest.to.slice(0, 4)}...
                    {pasteRequest.to.slice(-4)}
                  </span>
                </div>
              )}
            </div>
          </details>
        )}

        {completedSplits.length > 0 && (
          <details className="mt-4 w-full max-w-lg">
            <summary className="cursor-pointer text-xs font-medium text-neutral transition-colors hover:text-primary">
              Bill Splits ({completedSplits.length})
            </summary>
            <div className="mt-3 space-y-3">
              {completedSplits.slice(0, 10).map((split) => (
                <div
                  key={split.id}
                  className="rounded-xl border border-neutral/30 bg-tertiary p-4"
                >
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-white">
                      {new Date(split.timestamp).toLocaleDateString()}
                    </span>
                    <span className="font-semibold text-secondary">
                      {split.total.toFixed(2)} XLM
                    </span>
                  </div>
                  <div className="mb-2 space-y-1">
                    {split.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs text-neutral"
                      >
                        <span>{item.item}</span>
                        <span>{item.price.toFixed(2)} XLM</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-neutral/20 pt-2">
                    <p className="mb-1 text-[10px] font-medium text-neutral">
                      Participants
                    </p>
                    {split.participants.map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-white">{p.name}</span>
                        <span className="text-neutral">
                          {p.address
                            ? `${p.address.slice(0, 4)}...${p.address.slice(-4)}`
                            : "No address"}
                          <span className="ml-1 text-secondary">
                            {p.total.toFixed(2)} XLM
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                  {split.payments.length > 0 && (
                    <div className="mt-2 border-t border-neutral/20 pt-2">
                      <p className="mb-1 text-[10px] font-medium text-neutral">
                        Payments
                      </p>
                      {split.payments.map((pmt, i) => (
                        <a
                          key={i}
                          href={`https://stellar.expert/explorer/testnet/tx/${pmt.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-[10px] text-primary underline"
                        >
                          {pmt.amount} XLM →{" "}
                          {pmt.destination.slice(0, 4)}...
                          {pmt.destination.slice(-4)}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </details>
        )}

        {txHistory.length > 0 && (
          <details className="mt-4 w-full max-w-lg">
            <summary className="cursor-pointer text-xs font-medium text-neutral transition-colors hover:text-primary">
              Transaction History ({txHistory.length})
            </summary>
            <div className="mt-3 space-y-2">
              {txHistory.slice(0, 20).map((tx) => (
                <div
                  key={tx.hash}
                  className="rounded-xl border border-neutral/30 bg-tertiary px-4 py-3"
                >
                  <div className="flex items-center justify-between text-sm">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-white">
                        {tx.destination.slice(0, 4)}...
                        {tx.destination.slice(-4)}
                      </span>
                      {tx.memo && (
                        <p className="truncate text-[11px] text-neutral">
                          {tx.memo}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-secondary">
                        -{tx.amount} XLM
                      </p>
                      <p className="text-[10px] text-neutral">
                        {new Date(tx.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-[10px] text-primary underline"
                  >
                    View on Stellar Expert
                  </a>
                </div>
              ))}
            </div>
          </details>
        )}
      </main>

      {payTarget && addr && payTarget.address !== addr && (
        <PaymentModal
            source={addr}
            destination={payTarget.address}
            amount={payTarget.total.toFixed(2)}
            memo={`Splittr: ${payTarget.name}`}
            onClose={handlePayModalClose}
            onSuccess={handlePaymentSuccess}
          />
        )}
    </div>
  );
}
