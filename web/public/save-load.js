import { drawInteraction } from './waveformPlayer.js';
import { stateData } from './waveformPlayer.js';

// SAVE FUNCTION
export function saveState() {
    const blob = new Blob([JSON.stringify(stateData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = prompt('Enter a filename:', 'my-audio-overlay.json') || 'my-audio-overlay.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}


// LOAD FUNCTION
export function loadState(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const loadedData = JSON.parse(event.target.result);
            // You could add validation here if needed
            Object.assign(stateData, loadedData);
            drawInteraction();
        } catch (err) {
            console.error("Failed to load state:", err);
        }
    };
    reader.readAsText(file);
}

export function saveStateToLocalStorage() {
    localStorage.setItem('audioOverlayState', JSON.stringify(stateData));
}

export function loadStateFromLocalStorage() {
    const saved = localStorage.getItem('audioOverlayState');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            stateData.red = (parsed.red || []).sort((a, b) => a.time - b.time);
            stateData.green = (parsed.green || []).sort((a, b) => a.time - b.time);
            drawInteraction();
        } catch (e) {
            console.error("Error parsing saved state:", e);
        }
    }
}
