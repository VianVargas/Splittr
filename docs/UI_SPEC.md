# UI & UX Specifications: Splittr

## 0. Level 1 Requirements Compliance Map

| Level 1 Requirement          | UI Component / Feature Specification                                                    |
| :--------------------------- | :-------------------------------------------------------------------------------------- |
| **1. Wallet Setup**          | Header Testnet indicator badge + Freighter integration in `WalletConnect.tsx`           |
| **2. Wallet Connection**     | `WalletConnect.tsx` (Supports Connect, Connecting, and Disconnected states)             |
| **3. Balance Handling**      | `BalanceDisplay.tsx` (Displays XLM balance + manual refetch button)                     |
| **4. Transaction Flow**      | `PaymentModal.tsx` & Direct Send Form (Processing, Success, Tx Hash link, Error states) |
| **5. Development Standards** | Component-driven structure, clear loading/error states, design system guidelines        |

---

## 1. Design System & Layout Overview

- **Theme:** Clean Web3 interface using dark/light neutral backgrounds with high-contrast accent colors for call-to-actions.
- **Color Palette:**
  - **Primary (`#00BFA5` - Teal Green):** Brand accents, primary action buttons, active tab states.
  - **Secondary (`#00FF85` - Bright Mint / Neon Green):** Highlights, success badges, confirmation indicators.
  - **Tertiary (`#121212` - Dark Charcoal / Off-Black):** Main application background and card container fills.
  - **Neutral (`#94A3B8` - Slate Gray):** Body text, muted borders, input field borders.
- **Layout Structure:**
  - **Header:** Logo, Network indicator badge (`Testnet`), Wallet Status / Balance Pill.
  - **Main Card Container:** Responsive centered layout handling Level 1 direct transfer and bill split workflows.
  - **Footer:** Public GitHub repo link & Stellar Expert Explorer shortcuts.

---

## 2. Component Breakdown & States

### Component 1: Wallet Connection (`WalletConnect.tsx`)

_Satisfies Level 1: Wallet Setup & Connection_

- **Disconnected State:** Displays `Connect Freighter Wallet` button.
- **Connecting State:** Disabled button showing spinner.
- **Connected State:** Displays truncated public key (`GABC...1234`) with a `Disconnect` button. Network check ensures connection to Stellar Testnet.

### Component 2: Balance Header (`BalanceDisplay.tsx`)

_Satisfies Level 1: Balance Handling_

- Displays `XLM Balance: [VALUE] XLM`.
- Includes a subtle reload button to refetch balance from Stellar Horizon Testnet.

### Component 3: Level 1 Direct Payment / Bill Split Form (`PaymentForm.tsx` / `ItemizedSplitter.tsx`)

_Satisfies Level 1: Transaction Flow Inputs_

- **Direct Transfer (Level 1 Baseline):**
  - Recipient Stellar Address input field (`G...`).
  - XLM Amount input field with validation.
- **Advanced Bill Split (Optional Extension):**
  - Displays parsed itemized list with checkboxes/toggles.
  - Split calculation summary (Subtotal, Calculated Share per Person in XLM).

### Component 4: Receipt Upload & OCR Dropzone (`ReceiptUploader.tsx`)

- Drag-and-drop zone for `.png` / `.jpg` files.
- Thumbnail preview once selected.
- `Extract Items` action button triggering AI parsing loader.
- Fallback button: `Skip & Enter Amount Manually`.

### Component 5: Transaction Status & Feedback Modal (`PaymentModal.tsx`)

_Satisfies Level 1: Transaction Flow Feedback & Standards_

- **Processing State:** "Awaiting signature in Freighter..." / "Submitting to Stellar Testnet..."
- **Success State:**
  - Green confirmation banner.
  - Displayed Transaction Hash.
  - Direct external link: `https://stellar.expert/explorer/testnet/tx/[TX_HASH]`.
- **Error State:**
  - Red error alert box with explicit failure reason (e.g., `Transaction Cancelled`, `Insufficient XLM`).
  - `Retry` button.

---

## 3. Step-by-Step User Flow

1. **Connect:** User lands on page, connects Freighter (Stellar Testnet), and views their XLM balance.
2. **Upload or Input:** User drops a receipt image to extract items, inputs split parameters, or manually enters recipient address and XLM amount.
3. **Calculate:** System calculates final XLM transfer amount.
4. **Sign & Pay (Level 1 Core):** User clicks `Send XLM via Stellar`, approves the transaction prompt in Freighter, and receives visual feedback with a transaction confirmation link to Stellar Expert.
