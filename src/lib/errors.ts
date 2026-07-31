export type TransactionErrorType =
  | "user-rejected"
  | "insufficient-xlm"
  | "contract-failed"
  | "network-error"
  | "unknown";

export interface TransactionError {
  type: TransactionErrorType;
  message: string;
}

const REJECTION_PATTERNS: RegExp[] = [
  /cancelled/i,
  /canceled/i,
  /rejected/i,
  /denied/i,
  /declined/i,
  /user declin/i,
  /user cancel/i,
];

const INSUFFICIENT_PATTERNS: RegExp[] = [
  /insufficient/i,
  /not enough/i,
  /low balance/i,
  /underfunded/i,
];

const NETWORK_PATTERNS: RegExp[] = [
  /failed to fetch/i,
  /network error/i,
  /unreachable/i,
  /timed out/i,
  /timeout/i,
  /no connection/i,
  /connection refused/i,
];

const CONTRACT_PATTERNS: RegExp[] = [
  /contract/i,
  /host error/i,
  /invoke/i,
  /simulate/i,
  /soroban/i,
  /footprint/i,
];

export function classifyTransactionError(e: unknown): TransactionError {
  const raw = e instanceof Error ? e.message : String(e);
  const message = raw || "Unknown error";

  if (REJECTION_PATTERNS.some((r) => r.test(raw))) {
    return { type: "user-rejected", message: "Transaction Cancelled" };
  }
  if (INSUFFICIENT_PATTERNS.some((r) => r.test(raw))) {
    return { type: "insufficient-xlm", message: "Insufficient XLM" };
  }
  if (NETWORK_PATTERNS.some((r) => r.test(raw))) {
    return {
      type: "network-error",
      message: "Network Error: unable to reach Stellar Testnet",
    };
  }
  if (CONTRACT_PATTERNS.some((r) => r.test(raw))) {
    return { type: "contract-failed", message: `Contract call failed: ${message}` };
  }
  return { type: "unknown", message };
}

export function errorLabel(type: TransactionErrorType): string {
  switch (type) {
    case "user-rejected":
      return "Transaction Cancelled";
    case "insufficient-xlm":
      return "Insufficient XLM";
    case "contract-failed":
      return "Contract Call Failed";
    case "network-error":
      return "Network Error";
    default:
      return "Error";
  }
}
