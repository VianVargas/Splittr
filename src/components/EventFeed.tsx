"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchSplitEvents, type SplitEvent } from "@/lib/contract";

const POLL_INTERVAL_MS = 3000;

const START_LEDGER = Number(
  process.env.NEXT_PUBLIC_CONTRACT_START_LEDGER || ""
);

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-neutral transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

function RefreshIcon({ spinning }: { spinning?: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 ${spinning ? "animate-spin" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

export default function EventFeed({
  onEvent,
}: {
  onEvent?: (event: SplitEvent) => void;
}) {
  const [events, setEvents] = useState<SplitEvent[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const seen = useRef<Set<string>>(new Set());
  const cursorRef = useRef<string | null>(null);
  const didInitialFetch = useRef(false);
  const retryCount = useRef(0);
  const isLoadingRef = useRef(false);
  const mountedRef = useRef(true);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      setIsHidden(document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const load = useCallback(async (isInitial = false) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    if (mountedRef.current) setIsRefreshing(true);

    try {
      const isFirst = isInitial || !didInitialFetch.current;
      const cursor = cursorRef.current ?? undefined;
      const startLedger =
        isFirst && !cursor && !Number.isNaN(START_LEDGER)
          ? START_LEDGER
          : undefined;

      const { events: fresh, cursor: next } = await fetchSplitEvents(
        cursor,
        startLedger
      );
      if (!mountedRef.current) return;

      cursorRef.current = next;
      didInitialFetch.current = true;
      retryCount.current = 0;
      setError(null);

      const isNew = fresh.filter((e) => !seen.current.has(e.id));
      if (isNew.length > 0) {
        seen.current = new Set([
          ...seen.current,
          ...isNew.map((e) => e.id),
        ]);
        setEvents((prev) => [...isNew, ...prev].slice(0, 50));
        isNew.forEach((e) => onEventRef.current?.(e));
      }
    } catch (e) {
      if (!mountedRef.current) return;
      retryCount.current += 1;
      const message = e instanceof Error ? e.message : "RPC error";
      setError(
        `Event poll failed (attempt ${retryCount.current}): ${message}`
      );
    } finally {
      isLoadingRef.current = false;
      if (mountedRef.current) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const tick = () => {
      if (active) load(true);
    };

    tick();
    const interval = setInterval(() => {
      if (!document.hidden) {
        load(false);
      }
    }, POLL_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [load]);

  const handleRefresh = useCallback(async () => {
    if (isLoadingRef.current) return;
    setEvents([]);
    setError(null);
    seen.current = new Set();
    cursorRef.current = null;
    didInitialFetch.current = false;
    await load(true);
  }, [load]);

  return (
    <div className="rounded-xl border border-neutral/30 bg-tertiary p-5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-white transition-colors hover:text-primary"
        >
          <ChevronIcon open={open} />
          <span>Live Activity</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isHidden}
            aria-label="Refresh events"
            title="Refresh events"
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
              isRefreshing || isHidden
                ? "cursor-not-allowed text-neutral/50"
                : "text-neutral hover:bg-white/5 hover:text-primary"
            }`}
          >
            <RefreshIcon spinning={isRefreshing} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <span className="flex items-center gap-2 text-xs text-neutral">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isHidden ? "bg-yellow-400" : "bg-secondary"
              }`}
            />
            {isHidden
              ? "Paused"
              : `${events.length} event${events.length === 1 ? "" : "s"}`}
          </span>
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </p>
      )}

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
