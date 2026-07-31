import {
  isConnected,
  requestAccess,
  getAddress,
  getNetworkDetails,
} from "@stellar/freighter-api";

const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";

export async function isFreighterAvailable(): Promise<boolean> {
  try {
    const { isConnected: connected } = await isConnected();
    return connected;
  } catch {
    return false;
  }
}

export async function connectWallet(): Promise<{
  address: string;
  error?: string;
}> {
  try {
    const { address, error } = await requestAccess();
    if (error) {
      return { address: "", error: error.message };
    }
    return { address };
  } catch (e) {
    return { address: "", error: (e as Error).message };
  }
}

export async function getStoredPublicKey(): Promise<{
  address: string;
  error?: string;
}> {
  try {
    const { address, error } = await getAddress();
    if (error) {
      return { address: "", error: error.message };
    }
    return { address };
  } catch (e) {
    return { address: "", error: (e as Error).message };
  }
}

export async function isTestnetNetwork(): Promise<boolean> {
  try {
    const details = await getNetworkDetails();
    if (details.error || !details.networkUrl) return false;
    return (
      details.network?.toLowerCase() === "testnet" ||
      details.networkPassphrase === TESTNET_PASSPHRASE ||
      details.networkUrl.includes("horizon-testnet")
    );
  } catch {
    return false;
  }
}

export function truncatePublicKey(key: string): string {
  if (key.length <= 12) return key;
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}
