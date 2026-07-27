### File 2: `docs/UI_SPEC.md`

```markdown
# UI & UX Specifications: Splittr

## 1. Design System & Layout Overview

- **Theme:** Clean Web3 interface using dark/light neutral backgrounds with high-contrast accent colors for call-to-actions.
- **Color Palette:**
  - **Primary (`#00BFA5` - Teal Green):** Brand accents, primary action buttons, active tab states.
  - **Secondary (`#00FF85` - Bright Mint / Neon Green):** Highlights, success badges, confirmation indicators.
  - **Tertiary (`#121212` - Dark Charcoal / Off-Black):** Main application background and card container fills.
  - **Neutral (`#94A3B8` - Slate Gray):** Body text, muted borders, input field borders.
- **Layout Structure:**
  - **Header:** Logo, Network indicator badge (`Testnet`), Wallet Status / Balance Pill.
  - **Main Card Container:** Responsive centered layout handling workflow stages.
  - **Footer:** Public GitHub repo link & Stellar Expert Explorer shortcuts.

## 2. Component Breakdown & States

### Component 1: Wallet Connection (`WalletConnect.tsx`)

- **Disconnected State:** Displays `Connect Freighter Wallet` button.
- **Connecting State:** Disabled button showing spinner.
- **Connected State:** Displays truncated public key (`GABC...1234`) with a `Disconnect` button.

### Component 2: Balance Header (`BalanceDisplay.tsx`)

- Displays `XLM Balance: [VALUE] XLM`.
- Includes a subtle reload button to refetch balance from Horizon.

### Component 3: Receipt Upload & OCR Dropzone (`ReceiptUploader.tsx`)

- Drag-and-drop zone for `.png` / `.jpg` files.
- Thumbnail preview once selected.
- `Extract Items` action button triggering AI parsing loader.
- Fallback button: `Skip & Enter Amount Manually`.

### Component 4: Bill Split Dashboard (`ItemizedSplitter.tsx`)

- Displays parsed itemized list with checkboxes/toggles.
- Recipient Stellar Address input field (`G...`).
- Split calculation summary section:
  - Subtotal
  - Calculated Share per Person (XLM)

### Component 5: Transaction Status & Feedback Modal (`PaymentModal.tsx`)

- **Processing State:** "Awaiting signature in Freighter..." / "Submitting to Stellar Testnet..."
- **Success State:**
  - Green confirmation banner.
  - Displayed Transaction Hash.
  - Direct external link: `https://stellar.expert/explorer/testnet/tx/[TX_HASH]`.
- **Error State:**
  - Red error alert box with explicit failure reason (e.g., `Transaction Cancelled`, `Insufficient XLM`).
  - `Retry` button.

## 3. Step-by-Step User Flow

1. **Connect:** User lands on page, connects Freighter, and views their XLM balance.
2. **Upload or Input:** User drops a receipt image to extract items or enters total bill amount manually.
3. **Calculate:** User specifies recipient wallet address and configures split parameters.
4. **Sign & Pay:** User clicks `Send Share via Stellar`, approves the prompt in Freighter, and receives a transaction confirmation link to Stellar Expert.
```
