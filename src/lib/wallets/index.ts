import { freighterAdapter } from "./freighter";
import { rabetAdapter } from "./rabet";
import type { WalletAdapter } from "./types";

export const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";

export const wallets: WalletAdapter[] = [freighterAdapter, rabetAdapter];

export function getWalletById(id: string): WalletAdapter | undefined {
  return wallets.find((w) => w.id === id);
}

export function truncatePublicKey(key: string): string {
  if (key.length <= 12) return key;
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

export async function isTestnetNetwork(
  adapter: WalletAdapter
): Promise<boolean> {
  const details = await adapter.getNetworkDetails();
  if (details.error) return true;
  if (!details.networkUrl && !details.networkPassphrase && !details.network) {
    return true;
  }
  return (
    details.network?.toLowerCase() === "testnet" ||
    details.networkPassphrase === TESTNET_PASSPHRASE ||
    Boolean(details.networkUrl?.includes("horizon-testnet"))
  );
}

export type { WalletAdapter, WalletNetworkDetails } from "./types";
