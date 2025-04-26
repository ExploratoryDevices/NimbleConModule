import { wavesurfer, currentPxPerSec } from './wavesurfer-setup.js';

const waveformCanvas = document.getElementById("waveformCanvas");
const interactionCanvas = document.getElementById("interactionCanvas");
const interactionCtx = interactionCanvas.getContext("2d");

const COLORS = {
    "red": ["red", "rgba(255, 0, 0, 0.3)"],
    "green": ["green", "rgba(0, 255, 0, 0.3)"]
};

let visibleStartTime = 0;
let stateData = { red: [], green: [] };

function drawInteraction() {
    const width = interactionCanvas.width;
    const height = interactionCanvas.height;
    interactionCtx.clearRect(0, 0, width, height);
}

function resizeCanvases() {
    const container = document.getElementById("waveform");
    const width = container.scrollWidth;
    const height = container.clientHeight;

    [waveformCanvas, interactionCanvas].forEach(canvas => {
        canvas.width = width;
        canvas.height = height;
    });

    drawInteraction();
}

window.addEventListener("resize", resizeCanvases);
resizeCanvases();

export { drawInteraction, resizeCanvases };
