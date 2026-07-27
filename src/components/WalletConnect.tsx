"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isFreighterAvailable,
  connectWallet,
  getStoredPublicKey,
  truncatePublicKey,
} from "@/lib/freighter";

type WalletState =
  | { status: "checking" }
  | { status: "unavailable" }
  | { status: "disconnected" }
  | { status: "connecting" }
  | { status: "connected"; address: string };

export default function WalletConnect({
  address,
  onConnected,
  onDisconnected,
}: {
  address: string;
  onConnected: (address: string) => void;
  onDisconnected: () => void;
}) {
  const [wallet, setWallet] = useState<WalletState>({ status: "checking" });

  useEffect(() => {
    isFreighterAvailable().then((available) => {
      if (!available) {
        setWallet({ status: "unavailable" });
        return;
      }
      getStoredPublicKey().then(({ address: addr }) => {
        if (addr) {
          setWallet({ status: "connected", address: addr });
          onConnected(addr);
        } else {
          setWallet({ status: "disconnected" });
        }
      });
    });
  }, [onConnected]);

  const handleConnect = useCallback(async () => {
    setWallet({ status: "connecting" });
    const { address: addr, error } = await connectWallet();
    if (error || !addr) {
      setWallet({ status: "disconnected" });
      return;
    }
    setWallet({ status: "connected", address: addr });
    onConnected(addr);
  }, [onConnected]);

  const handleDisconnect = useCallback(() => {
    setWallet({ status: "disconnected" });
    onDisconnected();
  }, [onDisconnected]);

  if (wallet.status === "checking") {
    return (
      <div className="h-10 w-48 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
    );
  }

  if (wallet.status === "unavailable") {
    return (
      <p className="text-sm text-red-500">
        Freighter wallet not detected.{" "}
        <a
          href="https://freighter.app"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Install Freighter
        </a>
      </p>
    );
  }

  if (wallet.status === "connected") {
    return (
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-mono text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
          {truncatePublicKey(wallet.address)}
        </span>
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
        "Connect Freighter Wallet"
      )}
    </button>
  );
}
