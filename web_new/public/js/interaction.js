import { drawInteraction } from './canvas-draw.js';
import { wavesurfer } from './wavesurfer-setup.js';

const interactionCanvas = document.getElementById("interactionCanvas");
let drawMode = false;

interactionCanvas.addEventListener("mousedown", (event) => {
    if (!drawMode) return;
});

interactionCanvas.addEventListener("mousemove", (event) => {
    if (!drawMode) return;
});

interactionCanvas.addEventListener("mouseup", (event) => {
    if (!drawMode) return;
});

export default {};
