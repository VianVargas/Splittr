import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

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

async function main() {
  const startLedger = Number(process.env.NEXT_PUBLIC_CONTRACT_START_LEDGER);
  const { fetchSplitEvents } = await import("../src/lib/contract");
  const { events, cursor } = await fetchSplitEvents(undefined, startLedger);
  console.log(`Fetched ${events.length} event(s) from ledger ${startLedger}`);
  for (const e of events) {
    console.log(`  ${e.name} #${e.splitId} @ ledger ${e.ledger} (${e.txHash})`);
  }
  console.log(`Cursor: ${cursor}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
