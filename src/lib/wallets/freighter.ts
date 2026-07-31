import {
  isConnected,
  requestAccess,
  getAddress,
  getNetworkDetails,
  signTransaction,
} from "@stellar/freighter-api";
import type { WalletAdapter, WalletNetworkDetails } from "./types";

function errorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message;
  }
  return "Freighter error";
}

function networkDetailsFrom(result: {
  network?: string;
  networkUrl?: string;
  networkPassphrase?: string;
  error?: { message?: string } | string;
}): WalletNetworkDetails {
  if (result.error) {
    return { error: errorMessage(result.error) };
  }
  return {
    network: result.network,
    networkUrl: result.networkUrl,
    networkPassphrase: result.networkPassphrase,
  };
}

export const freighterAdapter: WalletAdapter = {
  id: "freighter",
  name: "Freighter",
  async isAvailable() {
    try {
      const { isConnected: connected } = await isConnected();
      return connected;
    } catch {
      return false;
    }
  },
  async connect() {
    try {
      const { address, error } = await requestAccess();
      if (error) return { address: "", error: errorMessage(error) };
      return { address };
    } catch (e) {
      return { address: "", error: errorMessage(e) };
    }
  },
  async getStoredAddress() {
    try {
      const { address, error } = await getAddress();
      if (error) return { address: "", error: errorMessage(error) };
      return { address };
    } catch (e) {
      return { address: "", error: errorMessage(e) };
    }
  },
  async signTransaction(xdr, opts) {
    try {
      const { signedTxXdr, error } = await signTransaction(xdr, {
        networkPassphrase: opts.networkPassphrase,
      });
      if (error || !signedTxXdr) {
        return { signedTxXdr: undefined, error: errorMessage(error) };
      }
      return { signedTxXdr };
    } catch (e) {
      return { signedTxXdr: undefined, error: errorMessage(e) };
    }
  },
  async getNetworkDetails() {
    try {
      return networkDetailsFrom(await getNetworkDetails());
    } catch (e) {
      return { error: errorMessage(e) };
    }
  },
};
