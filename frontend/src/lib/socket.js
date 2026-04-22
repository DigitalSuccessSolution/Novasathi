import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `${window.location.protocol}//${window.location.hostname}:5001`;

/**
 * High-Fidelity Socket Connection - The Cosmic Bridge
 * Handles real-time events, chat rituals, and energy billing pulses.
 */
export const socket = io(SOCKET_URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ["websocket"],
    withCredentials: true
});

// Guardian events
socket.on("connect", () => {
    console.log("🌌 [SOCKET] Connected to NovaSathi Realm:", socket.id);
});

socket.on("disconnect", () => {
    console.log("🌑 [SOCKET] Disconnected from Sanctuary");
});

socket.on("connect_error", (err) => {
    console.error("⚠️ [SOCKET] Cosmic Alignment Error:", err.message);
});

export default socket;
