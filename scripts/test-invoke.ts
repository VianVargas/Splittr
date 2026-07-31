import {
  Keypair,
  TransactionBuilder,
  rpc,
} from "@stellar/stellar-sdk";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { WalletAdapter } from "../src/lib/wallets/types";
import { TESTNET_PASSPHRASE } from "../src/lib/wallets";

const ENV_PATH = resolve(process.cwd(), ".env.local");

function loadEnvFile() {
  if (!existsSync(ENV_PATH)) return;
  const content = readFileSync(ENV_PATH, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const RPC_URL = "https://soroban-testnet.stellar.org";

function createMockAdapter(keypair: Keypair): WalletAdapter {
  return {
    id: "mock",
    name: "Mock Deployer",
    async isAvailable() {
      return true;
    },
    async connect() {
      return { address: keypair.publicKey() };
    },
    async getStoredAddress() {
      return { address: keypair.publicKey() };
    },
    async signTransaction(xdr, opts) {
      const tx = TransactionBuilder.fromXDR(xdr, opts.networkPassphrase);
      tx.sign(keypair);
      return { signedTxXdr: tx.toXDR() };
    },
    async getNetworkDetails() {
      return { networkPassphrase: TESTNET_PASSPHRASE, network: "testnet" };
    },
  };
}

async function waitForSuccess(hash: string) {
  const server = new rpc.Server(RPC_URL);
  let status = await server.getTransaction(hash);
  while (status.status === "NOT_FOUND") {
    await new Promise((r) => setTimeout(r, 1500));
    status = await server.getTransaction(hash);
  }
  return status.status;
}

async function main() {
  const secretKey = process.env.DEPLOYER_SECRET_KEY;
  if (!secretKey) {
    throw new Error("DEPLOYER_SECRET_KEY is not set");
  }

  const keypair = Keypair.fromSecret(secretKey);
  const adapter = createMockAdapter(keypair);
  const source = keypair.publicKey();

  const {
    submitCreateSplit,
    submitSettleSplit,
  } = await import("../src/lib/contract");

  console.log("Funding/deployer account:", source);
  console.log("Creating on-chain split...");

  const { hash: createHash, splitId } = await submitCreateSplit({
    source,
    signer: adapter,
    participants: [{ address: source, amountXlm: 0.01 }],
  });

  console.log(`Create submitted: ${createHash}`);
  console.log(`Split ID (simulated): ${splitId}`);

  const createStatus = await waitForSuccess(createHash);
  console.log(`Create status: ${createStatus}`);

  if (createStatus !== "SUCCESS") {
    throw new Error(`Create split failed: ${createStatus}`);
  }

  console.log("Settling split...");
  const { hash: settleHash } = await submitSettleSplit({
    source,
    signer: adapter,
    id: splitId,
  });

  console.log(`Settle submitted: ${settleHash}`);
  const settleStatus = await waitForSuccess(settleHash);
  console.log(`Settle status: ${settleStatus}`);

  if (settleStatus !== "SUCCESS") {
    throw new Error(`Settle split failed: ${settleStatus}`);
  }

  console.log("\n✅ Live contract invocation successful.");
  console.log(`   Split ID:    ${splitId}`);
  console.log(`   Create tx:   https://stellar.expert/explorer/testnet/tx/${createHash}`);
  console.log(`   Settle tx:   https://stellar.expert/explorer/testnet/tx/${settleHash}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
