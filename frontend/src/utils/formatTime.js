/**
 * Standard Time Formatter for NovaSathi
 * Handles HH:MM:SS and MM:SS formats gracefully.
 */
export const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return "--:--";
    
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};
