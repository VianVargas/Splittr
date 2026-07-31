import {
  rpc,
  Contract,
  Address,
  Account,
  BASE_FEE,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
} from "@stellar/stellar-sdk";
import type { WalletAdapter } from "./wallets";
import { TESTNET_PASSPHRASE } from "./wallets";

const RPC_URL = "https://soroban-testnet.stellar.org";
const XLM_TO_STROOP = 10_000_000;

export const SPLIT_CONTRACT_ID = process.env.NEXT_PUBLIC_SPLIT_CONTRACT_ID ?? "";

export interface SplitParticipant {
  address: string;
  amountXlm: number;
}

export interface SplitRecord {
  id: string;
  creator: string;
  total: number;
  participants: string[];
  amounts: number[];
  settled: boolean;
}

export type TxStatus = "PENDING" | "SUCCESS" | "FAILED" | "NOT_FOUND";

export function getSplitContractId(): string {
  return SPLIT_CONTRACT_ID;
}

export function isContractConfigured(): boolean {
  return SPLIT_CONTRACT_ID.length > 0;
}

function getRpc(): rpc.Server {
  return new rpc.Server(RPC_URL);
}

function getContract(): Contract {
  if (!SPLIT_CONTRACT_ID) {
    throw new Error("Split contract not configured");
  }
  return new Contract(SPLIT_CONTRACT_ID);
}

function xlmToStroops(xlm: number): string {
  return String(Math.round(xlm * XLM_TO_STROOP));
}

function stroopsToXlm(stroops: bigint | number): number {
  return Number(stroops) / XLM_TO_STROOP;
}

export async function submitCreateSplit(params: {
  source: string;
  signer: WalletAdapter;
  participants: SplitParticipant[];
}): Promise<{ hash: string; splitId: string }> {
  const server = getRpc();
  const account = await server.getAccount(params.source);
  const contract = getContract();
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: TESTNET_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        "create_split",
        new Address(params.source).toScVal(),
        nativeToScVal(
          params.participants.map((p) => new Address(p.address).toScVal())
        ),
        nativeToScVal(params.participants.map((p) => xlmToStroops(p.amountXlm)), {
          type: "i128",
        })
      )
    )
    .setTimeout(30)
    .build();

  const simulation = await server.simulateTransaction(tx);
  const splitId =
    !("error" in simulation) && simulation.result?.retval
      ? String(scValToNative(simulation.result.retval))
      : "";
  const prepared = await server.prepareTransaction(tx);
  const { hash } = await signAndSubmit(
    server,
    params.signer,
    prepared.toXDR()
  );
  return { hash, splitId };
}

export async function submitSettleSplit(params: {
  source: string;
  signer: WalletAdapter;
  id: string;
}): Promise<{ hash: string }> {
  const server = getRpc();
  const account = await server.getAccount(params.source);
  const contract = getContract();
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: TESTNET_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        "settle_split",
        new Address(params.source).toScVal(),
        nativeToScVal(Number(params.id), { type: "u64" })
      )
    )
    .setTimeout(30)
    .build();

  const prepared = await server.prepareTransaction(tx);
  return signAndSubmit(server, params.signer, prepared.toXDR());
}

async function signAndSubmit(
  server: rpc.Server,
  signer: WalletAdapter,
  preparedXdr: string
): Promise<{ hash: string }> {
  const { signedTxXdr, error } = await signer.signTransaction(preparedXdr, {
    networkPassphrase: TESTNET_PASSPHRASE,
  });
  if (error || !signedTxXdr) {
    throw new Error(error ?? "Transaction rejected by user");
  }
  const signedTx = TransactionBuilder.fromXDR(
    signedTxXdr,
    TESTNET_PASSPHRASE
  );
  const submitted = await server.sendTransaction(signedTx);
  if (submitted.status !== "PENDING") {
    throw new Error(`Transaction failed to submit: ${submitted.status}`);
  }
  return { hash: submitted.hash };
}

export async function getTransactionStatus(
  hash: string
): Promise<TxStatus> {
  const result = await getRpc().getTransaction(hash);
  return result.status;
}

export async function getSplit(
  source: string,
  id: string
): Promise<SplitRecord | null> {
  const server = getRpc();
  const contract = getContract();
  const account = new Account(source, "0");
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: TESTNET_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        "get_split",
        nativeToScVal(Number(id), { type: "u64" })
      )
    )
    .setTimeout(30)
    .build();

  const simulation = await server.simulateTransaction(tx);
  const retval =
    !("error" in simulation) ? simulation.result?.retval : undefined;
  if (!retval) return null;

  const native = scValToNative(retval) as {
    id: bigint;
    creator: string;
    total: bigint;
    participants: string[];
    amounts: bigint[];
    settled: boolean;
  };
  return {
    id: String(native.id),
    creator: native.creator,
    total: stroopsToXlm(native.total),
    participants: native.participants,
    amounts: native.amounts.map(stroopsToXlm),
    settled: native.settled,
  };
}

export interface SplitEvent {
  id: string;
  name: string;
  splitId: string;
  txHash: string;
  ledger: number;
  ledgerClosedAt: string;
}

export async function fetchSplitEvents(
  cursor?: string
): Promise<{ events: SplitEvent[]; cursor: string }> {
  if (!SPLIT_CONTRACT_ID) return { events: [], cursor: cursor ?? "" };
  const server = getRpc();

  const request = cursor
    ? {
        filters: [{ contractIds: [SPLIT_CONTRACT_ID] }],
        cursor,
        limit: 50,
      }
    : {
        filters: [{ contractIds: [SPLIT_CONTRACT_ID] }],
        startLedger: (await server.getLatestLedger()).sequence,
        limit: 50,
      };

  const response = await server.getEvents(request);
  const events: SplitEvent[] = response.events
    .filter(
      (e) => e.type === "contract" && e.inSuccessfulContractCall
    )
    .map((e) => {
      const topic = e.topic.map((t) => scValToNative(t));
      return {
        id: e.id,
        name: String(topic[0] ?? ""),
        splitId: topic.length > 1 ? String(topic[1]) : "",
        txHash: e.txHash,
        ledger: e.ledger,
        ledgerClosedAt: e.ledgerClosedAt,
      };
    });

  return { events, cursor: response.cursor };
}
