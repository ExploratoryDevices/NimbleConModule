import { wavesurfer } from './wavesurfer-setup.js';
import { drawInteraction } from './canvas-draw.js';

const modeToggleButton = document.getElementById("modeToggleButton");

modeToggleButton.addEventListener("click", () => {
    drawMode = !drawMode;
    drawInteraction();
});

export default {};
