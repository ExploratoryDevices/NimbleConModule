import { saveState, loadState } from './save-load.js';

const saveButton = document.getElementById("saveButton");
const loadButton = document.getElementById("loadButton");
const loadInput = document.getElementById("loadInput");

saveButton.addEventListener("click", () => {
    saveState();
});

loadButton.addEventListener("click", () => {
    loadInput.click();
});

loadInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
        loadState(file);
    }
});
