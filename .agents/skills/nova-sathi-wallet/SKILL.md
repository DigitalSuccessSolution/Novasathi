---
name: NovaSathi Wallet & Ledger Security
description: Core security and financial standards for the Nova Sathi wallet system.
---

# 💳 NovaSathi Wallet & Ledger Security

This skill defines the high-integrity protocols for the platform's financial core.

## 1. Transaction Integrity
*   **Ledger Model:** Every transaction must be recorded as a unique ledger entry (CREDIT/DEBIT).
*   **Safety Guards:** Direct balance updates are forbidden. Always calculate balance from the most recent confirmed ledger entries.
*   **Double-Spend Prevention:** Use row-level locking or optimistic concurrency for all wallet updates.

## 2. Payment Gateway Integration
*   **Provider:** Razorpay.
*   **Validation:** Use Webhooks for all payment updates.
*   **Pack Structure:** ₹99, ₹199, ₹499, Custom.
*   **Instant Updates:** The wallet reflected in the UI must update as soon as the webhook is confirmed by the backend.

## 3. Real-time Deduction
*   **Per-Minute Rate:** Defined per Expert Profile.
*   **Deduction Cycle:** Calculate and store per-minute usage accurately.
*   **Balance Syncing:** If the user reloads the chat, the *correct remaining time* must be fetched instantly from the database/session record.

## 4. Refund & Dispute Management
*   **Admin Panel:** Unified wallet and refund panel for quick resolution.
*   **Logging:** All wallet balance changes must be logged with a clear audit trail (Session ID, Admin ID, etc.).

## 5. Security Protocols
*   **Encryption:** Financial sensitivity demands all ledger data and payment IDs are treated as high-priority confidential data.
