export interface WalletNetworkDetails {
  network?: string;
  networkPassphrase?: string;
  networkUrl?: string;
  error?: string;
}

export interface WalletAdapter {
  id: string;
  name: string;
  isAvailable(): Promise<boolean>;
  connect(): Promise<{ address: string; error?: string }>;
  getStoredAddress(): Promise<{ address: string; error?: string }>;
  signTransaction(
    xdr: string,
    opts: { networkPassphrase: string }
  ): Promise<{ signedTxXdr?: string; error?: string }>;
  getNetworkDetails(): Promise<WalletNetworkDetails>;
  disconnect?(): Promise<void>;
}
