import type { WalletAdapter, WalletNetworkDetails } from "./types";

interface RabetApi {
  connect(): Promise<{ publicKey: string; error?: string }>;
  sign(
    xdr: string,
    networkPassphrase: string
  ): Promise<{ xdr: string; error?: string }>;
  disconnect?(): Promise<void>;
}

function getRabet(): RabetApi | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { rabet?: RabetApi }).rabet;
}

export const rabetAdapter: WalletAdapter = {
  id: "rabet",
  name: "Rabet",
  async isAvailable() {
    return !!getRabet();
  },
  async connect() {
    const rabet = getRabet();
    if (!rabet) return { address: "", error: "Rabet wallet not detected" };
    try {
      const result = await rabet.connect();
      if (result.error) return { address: "", error: result.error };
      return { address: result.publicKey };
    } catch (e) {
      return {
        address: "",
        error: e instanceof Error ? e.message : "Rabet connect error",
      };
    }
  },
  async getStoredAddress() {
    const rabet = getRabet();
    if (!rabet) return { address: "", error: "Rabet wallet not detected" };
    return { address: "" };
  },
  async signTransaction(xdr, opts) {
    const rabet = getRabet();
    if (!rabet) {
      return { signedTxXdr: undefined, error: "Rabet wallet not detected" };
    }
    try {
      const result = await rabet.sign(xdr, opts.networkPassphrase);
      if (result.error) {
        return { signedTxXdr: undefined, error: result.error };
      }
      return { signedTxXdr: result.xdr };
    } catch (e) {
      return {
        signedTxXdr: undefined,
        error: e instanceof Error ? e.message : "Rabet sign error",
      };
    }
  },
  async getNetworkDetails(): Promise<WalletNetworkDetails> {
    return {};
  },
  async disconnect() {
    await getRabet()?.disconnect?.();
  },
};
