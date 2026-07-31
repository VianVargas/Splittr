"use client";

import { useCallback, useMemo, useState } from "react";
import { isValidStellarAddress } from "@/lib/stellar";

export default function DirectSendForm({
  connectedPublicKey,
  onSend,
}: {
  connectedPublicKey: string;
  onSend: (destination: string, amount: string) => void;
}) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const recipientError = useMemo(() => {
    if (!recipient) return null;
    if (recipient === connectedPublicKey) {
      return "Cannot send to yourself";
    }
    return isValidStellarAddress(recipient)
      ? null
      : "Invalid Stellar address";
  }, [recipient, connectedPublicKey]);

  const amountError = useMemo(() => {
    if (!amount) return null;
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      return "Enter an amount greater than 0";
    }
    return null;
  }, [amount]);

  const canSubmit =
    !!recipient.trim() && !!amount && !recipientError && !amountError;

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit) return;
      onSend(recipient.trim(), amount);
    },
    [canSubmit, recipient, amount, onSend]
  );

  return (
    <div className="rounded-xl border border-neutral/30 bg-tertiary p-5">
      <h3 className="mb-3 text-sm font-semibold text-white">
        Send XLM Directly
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-neutral">
            Recipient Stellar Address
          </label>
          <input
            type="text"
            placeholder="G..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full rounded-lg border border-neutral/30 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-neutral/50 outline-none focus:border-primary"
          />
          {recipientError && (
            <p className="mt-1 text-[11px] text-red-400">{recipientError}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral">
            Amount (XLM)
          </label>
          <input
            type="number"
            step="any"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-neutral/30 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-neutral/50 outline-none focus:border-primary"
          />
          {amountError && (
            <p className="mt-1 text-[11px] text-red-400">{amountError}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send XLM via Stellar
        </button>
      </form>
    </div>
  );
}
