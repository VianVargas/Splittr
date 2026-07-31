import {
  Account,
  Address,
  Keypair,
  Operation,
  rpc,
  TransactionBuilder,
  scValToNative,
  BASE_FEE,
  Networks,
} from "@stellar/stellar-sdk";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const RPC_URL = "https://soroban-testnet.stellar.org";
const WASM_PATH = resolve(
  process.cwd(),
  "contracts/split/target/wasm32v1-none/release/split.wasm"
);
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

function fail(message: string): never {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function log(message: string) {
  console.log(`  ${message}`);
}

function checkCommand(command: string, name: string) {
  try {
    execSync(`${command} --version`, { stdio: "ignore" });
  } catch {
    fail(`${name} is required but not found. Please install it first.`);
  }
}

function buildContract() {
  log("Building Split contract WASM...");
  execSync(
    "cargo build --manifest-path contracts/split/Cargo.toml --target wasm32v1-none --release",
    { stdio: "inherit", cwd: process.cwd() }
  );
  if (!existsSync(WASM_PATH)) {
    fail(`WASM not found at ${WASM_PATH}`);
  }
  log(`WASM built: ${WASM_PATH}`);
}

async function fundAccount(publicKey: string) {
  log(`Funding ${publicKey} via Friendbot...`);
  const friendbotUrl = `https://friendbot.stellar.org?addr=${publicKey}`;
  const response = await fetch(friendbotUrl);
  if (!response.ok) {
    const text = await response.text();
    fail(`Friendbot funding failed: ${response.status} ${text}`);
  }
  log("Account funded.");
}

async function ensureAccount(server: rpc.Server, keypair: Keypair) {
  try {
    await server.getAccount(keypair.publicKey());
    log(`Deployer account exists: ${keypair.publicKey()}`);
  } catch {
    log("Deployer account not found on Testnet.");
    await fundAccount(keypair.publicKey());
  }
}

async function submitAndWait(
  server: rpc.Server,
  keypair: Keypair,
  buildTx: (account: Account) => TransactionBuilder
) {
  const account = await server.getAccount(keypair.publicKey());
  const tx = buildTx(account).setTimeout(30).build();

  const simulation = await server.simulateTransaction(tx);
  if ("error" in simulation) {
    fail(`Simulation failed: ${JSON.stringify(simulation.error)}`);
  }

  const prepared = await server.prepareTransaction(tx);
  prepared.sign(keypair);

  const submitted = await server.sendTransaction(prepared);
  if (submitted.status !== "PENDING") {
    fail(`Transaction submission failed: ${submitted.status}`);
  }

  log(`Transaction submitted: ${submitted.hash}`);

  let result = await server.getTransaction(submitted.hash);
  while (result.status === "NOT_FOUND") {
    await new Promise((r) => setTimeout(r, 1500));
    result = await server.getTransaction(submitted.hash);
  }

  if (result.status !== "SUCCESS") {
    fail(`Transaction failed: ${result.status}`);
  }

  log(`Transaction confirmed: ${submitted.hash}`);
  return { result, hash: submitted.hash };
}

async function uploadWasm(
  server: rpc.Server,
  keypair: Keypair,
  wasm: Buffer
): Promise<Buffer> {
  log("Uploading contract WASM...");
  const { result } = await submitAndWait(server, keypair, (account) =>
    new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    }).addOperation(Operation.uploadContractWasm({ wasm }))
  );

  if (!result.returnValue) {
    fail("WASM upload did not return a hash");
  }

  const wasmHash = Buffer.from(scValToNative(result.returnValue));
  log(`WASM uploaded. Hash: ${wasmHash.toString("hex")}`);
  return wasmHash;
}

async function deployContract(
  server: rpc.Server,
  keypair: Keypair,
  wasmHash: Buffer
): Promise<{ contractId: string; ledger: number }> {
  log("Deploying contract instance...");
  const { result } = await submitAndWait(server, keypair, (account) =>
    new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    }).addOperation(
      Operation.createCustomContract({
        address: new Address(keypair.publicKey()),
        wasmHash,
      })
    )
  );

  if (!result.returnValue) {
    fail("Contract deployment did not return an address");
  }

  const contractId = scValToNative(result.returnValue) as string;
  const ledger = (result as { ledger?: number }).ledger ?? 0;
  log(`Contract deployed. ID: ${contractId}`);
  log(`Deployment ledger: ${ledger}`);
  return { contractId, ledger };
}

function readEnv(): string {
  if (!existsSync(ENV_PATH)) return "";
  return readFileSync(ENV_PATH, "utf8");
}

function writeEnvKey(key: string, value: string, force: boolean) {
  const existing = readEnv();
  const line = `${key}=${value}`;

  if (existing.includes(`${key}=`)) {
    if (!force) {
      fail(
        `${key} is already set in .env.local. Use --force to overwrite, or delete the existing value first.`
      );
    }
    log(`--force passed. Overwriting existing ${key}.`);
    const updated = existing
      .split("\n")
      .map((l) => (l.startsWith(`${key}=`) ? line : l))
      .join("\n");
    writeFileSync(ENV_PATH, updated.endsWith("\n") ? updated : `${updated}\n`);
  } else {
    const updated = existing.endsWith("\n") || existing.length === 0
      ? `${existing}${line}\n`
      : `${existing}\n${line}\n`;
    writeFileSync(ENV_PATH, updated);
  }

  log(`Updated .env.local with ${key}=${value}`);
}

function writeContractId(contractId: string, force: boolean) {
  writeEnvKey("NEXT_PUBLIC_SPLIT_CONTRACT_ID", contractId, force);
}

function writeContractStartLedger(ledger: number, force: boolean) {
  writeEnvKey("NEXT_PUBLIC_CONTRACT_START_LEDGER", String(ledger), force);
}

async function main() {
  console.log("\n🚀 Splittr contract deployment\n");

  checkCommand("cargo", "Cargo / Rust");
  checkCommand("rustc", "Rust compiler");

  const secretKey = process.env.DEPLOYER_SECRET_KEY;
  if (!secretKey) {
    fail(
      "DEPLOYER_SECRET_KEY environment variable is required.\n" +
        "Example: DEPLOYER_SECRET_KEY=S... pnpm deploy:contract"
    );
  }

  let keypair: Keypair;
  try {
    keypair = Keypair.fromSecret(secretKey);
  } catch {
    fail("DEPLOYER_SECRET_KEY is not a valid Stellar secret key.");
  }

  const force = process.argv.includes("--force");

  buildContract();

  const server = new rpc.Server(RPC_URL);
  await ensureAccount(server, keypair);

  const wasm = readFileSync(WASM_PATH);
  const wasmHash = await uploadWasm(server, keypair, wasm);
  const { contractId, ledger } = await deployContract(server, keypair, wasmHash);

  writeContractId(contractId, force);
  writeContractStartLedger(ledger, force);

  console.log("\n✅ Deployment complete.");
  console.log(`   Contract ID:    ${contractId}`);
  if (ledger) {
    console.log(`   Start ledger:   ${ledger}`);
  }
  console.log(
    `   Explorer:       https://stellar.expert/explorer/testnet/contract/${contractId}\n`
  );
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
