"use client";

import { useCallback, useState } from "react";
import WalletConnect, { type WalletState } from "@/components/WalletConnect";
import BalanceDisplay from "@/components/BalanceDisplay";

export default function Home() {
  const [wallet, setWallet] = useState<WalletState>({ status: "checking" });
  const [balance, setBalance] = useState<string | null>(null);

  const handleAddressChange = useCallback((address: string) => {
    setBalance(null);
    if (!address) {
      setWallet({ status: "disconnected" });
    } else {
      setWallet({ status: "connected", address });
    }
  }, []);

  const handleBalanceChange = useCallback((b: string) => {
    setBalance(b);
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white px-4 dark:bg-zinc-950">
      <header className="flex w-full max-w-3xl items-center justify-between py-4">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Splittr
        </h1>
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

      <main className="flex flex-1 flex-col items-center justify-center gap-4">
        {balance === "0" && (
          <div className="max-w-md rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-200">
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
      </main>
    </div>
  );
}
