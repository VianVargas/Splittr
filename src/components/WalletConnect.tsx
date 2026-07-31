"use client";

import { useCallback, useEffect, useState } from "react";
import {
  wallets,
  getWalletById,
  isTestnetNetwork,
  truncatePublicKey,
  type WalletAdapter,
} from "@/lib/wallets";

type WalletState =
  | { status: "checking" }
  | { status: "unavailable" }
  | { status: "disconnected" }
  | { status: "connecting" }
  | { status: "connected"; address: string; wrongNetwork: boolean };

function installUrl(id: string): string {
  return id === "rabet" ? "https://rabet.io" : "https://freighter.app";
}

export default function WalletConnect({
  onConnected,
  onDisconnected,
  onAdapterChange,
}: {
  onConnected: (address: string) => void;
  onDisconnected: () => void;
  onAdapterChange?: (adapter: WalletAdapter) => void;
}) {
  const [adapterId, setAdapterId] = useState("freighter");
  const adapter = getWalletById(adapterId) ?? wallets[0];
  const [wallet, setWallet] = useState<WalletState>({ status: "checking" });

  const [prevAdapterId, setPrevAdapterId] = useState(adapterId);
  if (prevAdapterId !== adapterId) {
    setPrevAdapterId(adapterId);
    setWallet({ status: "checking" });
  }

  useEffect(() => {
    let active = true;
    (async () => {
      const a = getWalletById(adapterId);
      if (!a) return;
      const available = await a.isAvailable();
      if (!active) return;
      if (!available) {
        setWallet({ status: "unavailable" });
        return;
      }
      const { address } = await a.getStoredAddress();
      if (!active) return;
      if (address) {
        const wrongNetwork = !(await isTestnetNetwork(a));
        if (!active) return;
        setWallet({ status: "connected", address, wrongNetwork });
        onConnected(address);
        onAdapterChange?.(a);
      } else {
        setWallet({ status: "disconnected" });
      }
    })();
    return () => {
      active = false;
    };
  }, [adapterId, onConnected, onAdapterChange]);

  const handleConnect = useCallback(async () => {
    setWallet({ status: "connecting" });
    const { address, error } = await adapter.connect();
    if (error || !address) {
      setWallet({ status: "disconnected" });
      return;
    }
    const wrongNetwork = !(await isTestnetNetwork(adapter));
    setWallet({ status: "connected", address, wrongNetwork });
    onConnected(address);
    onAdapterChange?.(adapter);
  }, [adapter, onConnected, onAdapterChange]);

  const handleDisconnect = useCallback(async () => {
    await adapter.disconnect?.();
    setWallet({ status: "disconnected" });
    onDisconnected();
  }, [adapter, onDisconnected]);

  if (wallet.status === "checking") {
    return (
      <div className="h-10 w-56 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
    );
  }

  if (wallet.status === "unavailable") {
    return (
      <p className="text-sm text-red-500">
        {adapter.name} wallet not detected.{" "}
        <a
          href={installUrl(adapter.id)}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Install {adapter.name}
        </a>
      </p>
    );
  }

  if (wallet.status === "connected") {
    return (
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-neutral">
          {adapter.name}
        </span>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-mono text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
          {truncatePublicKey(wallet.address)}
        </span>
        {wallet.wrongNetwork && (
          <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-[11px] font-medium text-red-400">
            Wrong Network
          </span>
        )}
        <button
          onClick={handleDisconnect}
          className="rounded-lg border border-zinc-300 px-3 py-1 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={adapterId}
        onChange={(e) => setAdapterId(e.target.value)}
        disabled={wallet.status === "connecting"}
        className="rounded-lg border border-neutral/30 bg-tertiary px-2 py-2 text-sm text-white outline-none focus:border-primary disabled:opacity-60"
      >
        {wallets.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
      <button
        onClick={handleConnect}
        disabled={wallet.status === "connecting"}
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {wallet.status === "connecting" ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
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
            Connecting...
          </>
        ) : (
          `Connect ${adapter.name} Wallet`
        )}
      </button>
    </div>
  );
}
