# App Specifications: Splittr (Stellar Level 1 dApp)

## 1. Project Context & Goal
Splittr is a Web3-enabled bill-splitting application built on the Stellar Testnet. It simplifies group expense sharing by allowing users to either manually input bill amounts or upload receipt images to automatically extract line items via AI/OCR parsing. Users can calculate individual shares, view real-time account balances, and settle payments instantly using native XLM via the Freighter wallet.

## 2. Tech Stack & Hard Constraints
- **Framework:** Next.js (App Router) with TypeScript
- **Styling:** Tailwind CSS
- **Stellar Libraries:** 
  - `@stellar/freighter-api` (Wallet connection, account signing)
  - `@stellar/stellar-sdk` (Horizon Testnet RPC calls, transaction construction, balance fetching)
- **OCR / Parsing:** Client-side integration using OpenAI GPT-4o Vision API or Tesseract.js (returns structured JSON line items)
- **Network Constraint:** Strictly locked to **Stellar Testnet** (`https://horizon-testnet.stellar.org`, Passphrase: `Test SDF Network ; September 2015`)

## 3. File Structure (Target State)
```text
splittr/
├── docs/
│   ├── FEATURES.md
│   └── UI_SPEC.md
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── WalletConnect.tsx
│   │   ├── BalanceDisplay.tsx
│   │   ├── ReceiptUploader.tsx
│   │   ├── ItemizedSplitter.tsx
│   │   └── PaymentModal.tsx
│   ├── lib/
│   │   ├── freighter.ts
│   │   ├── stellar.ts
│   │   └── ocr.ts
│   └── types/
│       └── index.ts
├── public/
├── package.json
└── README.md
