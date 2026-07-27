import { Horizon } from "@stellar/stellar-sdk";

const HORIZON_URL = "https://horizon-testnet.stellar.org";

const server = new Horizon.Server(HORIZON_URL);

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
