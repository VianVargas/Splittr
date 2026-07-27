"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { isValidStellarAddress } from "@/lib/stellar";
import type { ReceiptItem } from "@/lib/ocr";

export interface Participant {
  id: string;
  name: string;
  address: string;
}

export interface ParticipantTotal {
  id: string;
  name: string;
  address: string;
  items: { itemId: string; share: number }[];
  total: number;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export default function ItemizedSplitter({
  items,
  onTotalsChange,
}: {
  items: ReceiptItem[];
  onTotalsChange?: (totals: ParticipantTotal[]) => void;
}) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");

  const [assignments, setAssignments] = useState<
    Record<string, string[]>
  >({});

  const addressError = useMemo(() => {
    if (!newAddress) return null;
    return isValidStellarAddress(newAddress)
      ? null
      : "Invalid Stellar address";
  }, [newAddress]);

  const addParticipant = useCallback(() => {
    const name = newName.trim();
    if (!name) return;
    setParticipants((prev) => [
      ...prev,
      { id: generateId(), name, address: newAddress.trim() },
    ]);
    setNewName("");
    setNewAddress("");
  }, [newName, newAddress]);

  const removeParticipant = useCallback((id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
    setAssignments((prev) => {
      const next: Record<string, string[]> = {};
      for (const [itemId, pIds] of Object.entries(prev)) {
        const filtered = pIds.filter((pid) => pid !== id);
        if (filtered.length > 0) next[itemId] = filtered;
      }
      return next;
    });
  }, []);

  const toggleAssignment = useCallback(
    (itemId: string, participantId: string) => {
      setAssignments((prev) => {
        const current = prev[itemId] ?? [];
        const next = current.includes(participantId)
          ? current.filter((id) => id !== participantId)
          : [...current, participantId];
        return { ...prev, [itemId]: next };
      });
    },
    []
  );

  const totals = useMemo(() => {
    const map = new Map<
      string,
      { name: string; address: string; items: { itemId: string; share: number }[]; total: number }
    >();

    for (const p of participants) {
      map.set(p.id, { name: p.name, address: p.address, items: [], total: 0 });
    }

    for (const item of items) {
      const assigned = assignments[item.id] ?? [];
      if (assigned.length === 0) continue;
      const share = item.price / assigned.length;
      for (const pid of assigned) {
        const entry = map.get(pid);
        if (entry) {
          entry.items.push({ itemId: item.id, share });
          entry.total += share;
        }
      }
    }

    const result: ParticipantTotal[] = [];
    for (const p of participants) {
      const entry = map.get(p.id)!;
      result.push({
        id: p.id,
        name: p.name,
        address: p.address,
        items: entry.items,
        total: entry.total,
      });
    }
    return result;
  }, [participants, assignments, items]);

  useEffect(() => {
    onTotalsChange?.(totals);
  }, [totals, onTotalsChange]);

  const grandTotal = items.reduce((s, i) => s + i.price, 0);
  const assignedTotal = totals.reduce((s, t) => s + t.total, 0);

  const itemAssignments = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const [itemId, pIds] of Object.entries(assignments)) {
      m.set(itemId, new Set(pIds));
    }
    return m;
  }, [assignments]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-neutral/30 bg-tertiary p-5">
        <h3 className="mb-3 text-sm font-semibold text-white">
          Participants
        </h3>

        <div className="mb-3 flex flex-wrap gap-2">
          {participants.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm"
            >
              <span className="text-white">{p.name}</span>
              {p.address && (
                <span className="text-[10px] text-neutral">
                  {p.address.slice(0, 4)}...{p.address.slice(-4)}
                </span>
              )}
              <button
                onClick={() => removeParticipant(p.id)}
                className="text-neutral transition-colors hover:text-red-400"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-neutral">Name</label>
            <input
              type="text"
              placeholder="e.g. Alice"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addParticipant()}
              className="w-full rounded-lg border border-neutral/30 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-neutral/50 outline-none focus:border-primary"
            />
          </div>
          <div className="flex-[2]">
            <label className="mb-1 block text-xs text-neutral">
              Stellar Address{" "}
              <span className="text-neutral/50">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="G..."
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !addressError && addParticipant()}
              className="w-full rounded-lg border border-neutral/30 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-neutral/50 outline-none focus:border-primary"
            />
            {addressError && (
              <p className="mt-1 text-[11px] text-red-400">{addressError}</p>
            )}
          </div>
          <button
            onClick={addParticipant}
            disabled={!newName.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      {participants.length > 0 && (
        <div className="rounded-xl border border-neutral/30 bg-tertiary p-5">
          <h3 className="mb-3 text-sm font-semibold text-white">
            Assign Items
          </h3>
          <div className="space-y-2">
            {items.map((item) => {
              const assigned = itemAssignments.get(item.id) ?? new Set();
              return (
                <div
                  key={item.id}
                  className="rounded-lg border border-neutral/20 p-3"
                >
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-white">{item.item}</span>
                    <span className="font-medium text-secondary">
                      {item.price.toFixed(2)} XLM
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {participants.map((p) => {
                      const isOn = assigned.has(p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => toggleAssignment(item.id, p.id)}
                          className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                            isOn
                              ? "bg-primary text-white"
                              : "border border-neutral/30 text-neutral hover:border-primary hover:text-primary"
                          }`}
                        >
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {participants.length > 0 && (
        <div className="rounded-xl border border-neutral/30 bg-tertiary p-5">
          <h3 className="mb-3 text-sm font-semibold text-white">
            Split Summary
          </h3>

          {totals.length === 0 || assignedTotal === 0 ? (
            <p className="text-sm text-neutral">
              Assign items to participants above to see the breakdown.
            </p>
          ) : (
            <div className="space-y-3">
              {totals.map((t) => (
                <div key={t.id} className="rounded-lg bg-white/5 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-white">
                        {t.name}
                      </span>
                      {t.address && (
                        <span className="ml-2 text-[11px] text-neutral">
                          {t.address.slice(0, 4)}...{t.address.slice(-4)}
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-secondary">
                      {t.total.toFixed(2)} XLM
                    </span>
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {t.items.map((li) => {
                      const item = items.find((i) => i.id === li.itemId);
                      return (
                        <div
                          key={li.itemId}
                          className="flex items-center justify-between text-xs text-neutral"
                        >
                          <span>{item?.item ?? "Unknown"}</span>
                          <span>{li.share.toFixed(2)} XLM</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between border-t border-neutral/20 pt-3 text-sm">
                <span className="text-white">Grand Total</span>
                <span className="font-semibold text-secondary">
                  {assignedTotal.toFixed(2)} / {grandTotal.toFixed(2)} XLM
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
