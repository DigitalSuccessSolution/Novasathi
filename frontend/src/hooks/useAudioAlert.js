import { useCallback } from 'react';

export const useAudioAlert = () => {
    const playAlert = useCallback((type = 'notification') => {
        const audio = new Audio(
            type === 'alert' 
            ? 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' // Siren/Alert
            : 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3' // Ding/Soft
        );
        audio.volume = 0.5;
        audio.play().catch(e => console.warn("Audio play blocked by browser:", e));
    }, []);

    return { playAlert };
};
