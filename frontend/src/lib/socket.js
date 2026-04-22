import { io } from "socket.io-client";

const getSocketUrl = () => {
    // 1. Check for explicit env variable (Production/Staging)
    if (import.meta.env.VITE_SOCKET_URL) {
        return import.meta.env.VITE_SOCKET_URL;
    }

    // 2. Production fallback: If we are on a non-localhost domain, 
    // assume backend is at the same domain/origin or a specific API subdomain
    if (window.location.hostname !== 'localhost') {
        // If your backend is proxied through the same domain (common in prod)
        return window.location.origin; 
    }

    // 3. Local Development fallback
    return `http://localhost:5001`;
};

const SOCKET_URL = getSocketUrl();

/**
 * High-Fidelity Socket Connection - The Cosmic Bridge
 * Handles real-time events, chat rituals, and energy billing pulses.
 */
export const socket = io(SOCKET_URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 10, // Increased for stability
    reconnectionDelay: 2000,
    transports: ["websocket", "polling"], // Allow polling fallback for restrictive proxies
    withCredentials: true
});

// Guardian events
socket.on("connect", () => {
    console.log("🌌 [SOCKET] Connected to NovaSathi Realm:", socket.id);
});

socket.on("disconnect", (reason) => {
    console.log("🌑 [SOCKET] Disconnected:", reason);
});

socket.on("connect_error", (err) => {
    console.error("⚠️ [SOCKET] Cosmic Alignment Error:", err.message);
    console.debug("Context:", { url: SOCKET_URL, auth: socket.auth });
});

export default socket;
