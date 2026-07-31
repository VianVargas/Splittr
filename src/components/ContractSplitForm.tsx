"use client";

import { useCallback, useMemo, useState } from "react";
import {
  submitCreateSplit,
  submitSettleSplit,
  isContractConfigured,
  getSplitContractId,
} from "@/lib/contract";
import {
  classifyTransactionError,
  type TransactionError,
} from "@/lib/errors";
import type { WalletAdapter } from "@/lib/wallets";
import TransactionStatusPanel from "./TransactionStatusPanel";

export default function ContractSplitForm({
  connectedAddress,
  signer,
  participants,
  onCreated,
  onSettled,
}: {
  connectedAddress: string;
  signer: WalletAdapter;
  participants: { name: string; address: string; total: number }[];
  onCreated?: (splitId: string, hash: string) => void;
  onSettled?: (splitId: string, hash: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [createHash, setCreateHash] = useState<string | null>(null);
  const [splitId, setSplitId] = useState<string | null>(null);
  const [error, setError] = useState<TransactionError | null>(null);

  const [settling, setSettling] = useState(false);
  const [settleHash, setSettleHash] = useState<string | null>(null);
  const [settleError, setSettleError] = useState<TransactionError | null>(
    null
  );

  const configured = isContractConfigured();
  const contractId = getSplitContractId();

  const eligible = useMemo(
    () => participants.filter((p) => p.address && p.total > 0),
    [participants]
  );

  const total = useMemo(
    () => eligible.reduce((sum, p) => sum + p.total, 0),
    [eligible]
  );

  const handleCreate = useCallback(async () => {
    if (creating || !configured || eligible.length === 0) return;
    setCreating(true);
    setError(null);
    setCreateHash(null);
    setSplitId(null);
    setSettleHash(null);
    setSettleError(null);
    try {
      const { hash, splitId: id } = await submitCreateSplit({
        source: connectedAddress,
        signer,
        participants: eligible.map((p) => ({
          address: p.address,
          amountXlm: p.total,
        })),
      });
      setCreateHash(hash);
      setSplitId(id);
    } catch (e) {
      setError(classifyTransactionError(e));
    } finally {
      setCreating(false);
    }
  }, [creating, configured, eligible, connectedAddress, signer]);

  const handleSettle = useCallback(async () => {
    if (settling || !splitId || !configured) return;
    setSettling(true);
    setSettleError(null);
    setSettleHash(null);
    try {
      const { hash } = await submitSettleSplit({
        source: connectedAddress,
        signer,
        id: splitId,
      });
      setSettleHash(hash);
    } catch (e) {
      setSettleError(classifyTransactionError(e));
    } finally {
      setSettling(false);
    }
  }, [settling, splitId, configured, connectedAddress, signer]);

  const handleCreateSuccess = useCallback(
    (hash: string) => {
      if (splitId) onCreated?.(splitId, hash);
    },
    [splitId, onCreated]
  );

  const handleSettleSuccess = useCallback(
    (hash: string) => {
      if (splitId) onSettled?.(splitId, hash);
    },
    [splitId, onSettled]
  );

  return (
    <div className="rounded-xl border border-neutral/30 bg-tertiary p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">On-Chain Split</h3>
        {contractId && (
          <a
            href={`https://stellar.expert/explorer/testnet/contract/${contractId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-primary underline"
          >
            {contractId.slice(0, 10)}...
          </a>
        )}
      </div>

      {!configured && (
        <p className="mb-3 rounded-lg bg-yellow-500/10 px-3 py-2 text-xs text-yellow-300">
          The Split contract is not deployed yet. Contract calls are disabled.
        </p>
      )}

      {eligible.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {eligible.map((p) => (
            <div
              key={p.address}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-white">
                {p.name}{" "}
                <span className="text-neutral">
                  {p.address.slice(0, 4)}...{p.address.slice(-4)}
                </span>
              </span>
              <span className="font-medium text-secondary">
                {p.total.toFixed(2)} XLM
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-neutral/20 pt-1.5 text-xs">
            <span className="text-neutral">Total</span>
            <span className="font-semibold text-secondary">
              {total.toFixed(2)} XLM
            </span>
          </div>
        </div>
      )}

      <button
        onClick={handleCreate}
        disabled={creating || !configured || eligible.length === 0}
        className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {creating ? "Submitting..." : "Create Split on Testnet"}
      </button>

      {(createHash || error) && (
        <div className="mt-3">
          <TransactionStatusPanel
            hash={createHash}
            error={error ?? undefined}
            onSuccess={handleCreateSuccess}
          />
        </div>
      )}

      {splitId && (
        <div className="mt-3 rounded-lg bg-white/5 p-3 text-xs text-neutral">
          Split ID:{" "}
          <span className="font-mono text-secondary">#{splitId}</span>
        </div>
      )}

      {splitId && !settleHash && (
        <button
          onClick={handleSettle}
          disabled={settling}
          className="mt-3 w-full rounded-lg border border-secondary/40 px-4 py-2 text-sm font-medium text-secondary transition-colors hover:bg-secondary/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {settling ? "Submitting..." : "Mark Settled"}
        </button>
      )}

      {(settleHash || settleError) && (
        <div className="mt-3">
          <TransactionStatusPanel
            hash={settleHash}
            error={settleError ?? undefined}
            onSuccess={handleSettleSuccess}
          />
        </div>
      )}
    </div>
  );
}
