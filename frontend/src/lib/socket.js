import { io } from "socket.io-client";

const getSocketUrl = () => {
    // 1. Check for explicit env variable (Production/Staging)
    if (import.meta.env.VITE_SOCKET_URL) {
        return import.meta.env.VITE_SOCKET_URL;
    }

    // 2. Derive from API URL if available (Production standard)
    if (import.meta.env.VITE_API_BASE_URL) {
        try {
            const apiUrl = new URL(import.meta.env.VITE_API_BASE_URL);
            return `${apiUrl.protocol}//${apiUrl.host}`;
        } catch (e) {
            // Fallback to origin if URL is relative or invalid
        }
    }

    // 3. Production fallback: If we are on a non-localhost domain, 
    // assume backend is at the same domain/origin
    if (window.location.hostname !== 'localhost') {
        return window.location.origin; 
    }

    // 4. Local Development fallback
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
    reconnectionAttempts: 20, // Increased for stability
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.5,
    // Production Note: We start with "polling" then upgrade to "websocket".
    // This is much more reliable through Nginx/Cloudflare/Firewalls.
    transports: ["polling", "websocket"], 
    withCredentials: true,
    path: "/socket.io/" // Explicitly define path
});

// Guardian events
socket.on("connect", () => {
    console.log("🌌 [SOCKET] Connected to NovaSathi Realm:", socket.id);
});

socket.on("disconnect", (reason) => {
    console.log("🌑 [SOCKET] Disconnected:", reason);
    if (reason === "io server disconnect") {
        // the disconnection was initiated by the server, you need to reconnect manually
        socket.connect();
    }
});

socket.on("connect_error", (err) => {
    console.error("⚠️ [SOCKET] Cosmic Alignment Error:", err.message);
    console.debug("Context:", { 
        url: SOCKET_URL, 
        transport: socket.io?.engine?.transport?.name,
        auth: socket.auth 
    });
});

export default socket;
