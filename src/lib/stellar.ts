import {
  Horizon,
  StrKey,
  TransactionBuilder,
  Operation,
  Asset,
  Memo,
  Networks,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";

const HORIZON_URL = "https://horizon-testnet.stellar.org";

const server = new Horizon.Server(HORIZON_URL);

export function isValidStellarAddress(address: string): boolean {
  return StrKey.isValidEd25519PublicKey(address);
}

export async function fetchXlmBalance(
  publicKey: string
): Promise<string> {
  try {
    const account = await server.loadAccount(publicKey);
    const native = account.balances.find(
      (b) => b.asset_type === "native"
    );
    return native?.balance ?? "0";
  } catch {
    return "0";
  }
}

export async function sendXlmPayment({
  source,
  destination,
  amount,
  memo,
}: {
  source: string;
  destination: string;
  amount: string;
  memo?: string;
}): Promise<{ hash: string }> {
  const account = await server.loadAccount(source);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination,
        amount,
        asset: Asset.native(),
      })
    )
    .setTimeout(30);

  if (memo) {
    tx.addMemo(Memo.text(memo));
  }

  const built = tx.build();
  const xdr = built.toXDR();

  const { signedTxXdr, error } = await signTransaction(
    xdr,
    { networkPassphrase: Networks.TESTNET }
  );

  if (error || !signedTxXdr) {
    throw new Error(error?.message ?? "Transaction rejected by user");
  }

  const signedTx = TransactionBuilder.fromXDR(
    signedTxXdr,
    Networks.TESTNET
  );

  const result = await server.submitTransaction(signedTx);
  return { hash: result.hash };
}
