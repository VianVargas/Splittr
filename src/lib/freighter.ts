import {
  isConnected,
  requestAccess,
  getAddress,
} from "@stellar/freighter-api";

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

export function truncatePublicKey(key: string): string {
  if (key.length <= 12) return key;
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}
