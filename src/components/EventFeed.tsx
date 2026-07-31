"use client";

import { useEffect, useRef, useState } from "react";
import { fetchSplitEvents, type SplitEvent } from "@/lib/contract";

export default function EventFeed({
  onEvent,
}: {
  onEvent?: (event: SplitEvent) => void;
}) {
  const [events, setEvents] = useState<SplitEvent[]>([]);
  const [open, setOpen] = useState(false);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    let cursor: string | null = null;
    const tick = async () => {
      try {
        const { events: fresh, cursor: next } = await fetchSplitEvents(
          cursor ?? undefined
        );
        if (!active) return;
        cursor = next;
        const isNew = fresh.filter((e) => !seen.current.has(e.id));
        if (isNew.length > 0) {
          seen.current = new Set([
            ...seen.current,
            ...isNew.map((e) => e.id),
          ]);
          setEvents((prev) => [...isNew, ...prev].slice(0, 50));
          isNew.forEach((e) => onEvent?.(e));
        }
      } catch {
        // transient RPC errors are ignored; the interval keeps polling
      }
    };
    tick();
    const interval = setInterval(tick, 8000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [onEvent]);

  return (
    <div className="rounded-xl border border-neutral/30 bg-tertiary p-5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between"
      >
        <span className="text-sm font-semibold text-white">
          Live Activity
        </span>
        <span className="flex items-center gap-2 text-xs text-neutral">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
          {events.length} event{events.length === 1 ? "" : "s"}
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {events.length === 0 && (
            <p className="text-xs text-neutral">
              No contract events yet. Create an on-chain split to see activity.
            </p>
          )}
          {events.map((e) => (
            <div
              key={e.id}
              className="rounded-lg bg-white/5 px-3 py-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-white">{e.name}</span>
                <span className="text-neutral">
                  {new Date(e.ledgerClosedAt).toLocaleTimeString()}
                </span>
              </div>
              {e.splitId && (
                <p className="mt-0.5 text-neutral">
                  Split ID:{" "}
                  <span className="font-mono text-secondary">
                    #{e.splitId}
                  </span>
                </p>
              )}
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${e.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 inline-block text-[10px] text-primary underline"
              >
                View tx on Stellar Expert
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
