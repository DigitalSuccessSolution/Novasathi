---
name: NovaSathi Chat & Ritual Engine
description: Technical standards for real-time messaging, editing, and per-minute billing for Nova Sathi.
---

# 💬 Nova Sathi Chat & Ritual Engine

Specialized skill for handling the real-time core of the platform.

## 1. Socket.io Protocol
*   **Events:** `send_message`, `edit_message`, `partner_typing`, `session_started`, `force_disconnect`.
*   **Security:** Always validate the `sessionId` and `senderId` on every socket event.

## 2. Message Editing Rules
*   **Time Limit:** 5-minute maximum edit window. 
*   **Logic:** Any attempt to edit after 5 minutes must be rejected at the socket level.
*   **User Interface:** Use a global "Editing" banner above the main chat input field for all message updates. Single-click a message to edit.

## 3. Per-Minute Billing Logic
*   **Timer Sync:** The live countdown timer must be synchronized across devices and sessions.
*   **Auto-Termination:** Chat MUST terminate automatically when the user's wallet reaches zero.
*   **Low Balance Alerts:** Notify users at designated balance thresholds (e.g., ₹20 remaining).

## 4. Visibility Control (Clear Chat)
*   **Logic:** `hiddenForId` is a database array. "Clear Chat" adds the user's ID to this array for all messages in a session.
*   **Persistence:** Once "Cleared", messages must NOT be visible even after page reloads.

## 5. Media Extensions
*   **Image Support:** 100% secure uploads and high-fidelity previews (Mystic design).
*   **Audio/Video (Future):** Scalable architecture for future audio/video integration.
