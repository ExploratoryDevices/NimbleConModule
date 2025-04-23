// Get the canvases and their contexts
const waveformCanvas = document.getElementById("waveformCanvas");
const waveformCtx = waveformCanvas.getContext("2d");
const interactionCanvas = document.getElementById("interactionCanvas");
const interactionCtx = interactionCanvas.getContext("2d");
const playbackCanvas = document.getElementById("playbackCanvas");
const playbackCtx = playbackCanvas.getContext("2d");
const audioPlayer = document.getElementById("audioPlayer");
const modeToggleButton = document.getElementById("modeToggleButton");
const actionToggleButton = document.getElementById("actionToggleButton");

const COLORS = {
    "red": ["red", "rgba(255, 0, 0, 0.3)"]
}

let audioBuffer = null;
let stateData = {
    "red": []
}; // Map of arrays to hold external data (dots) as {x, y} objects
let drawMode = false; // Flag for draw mode vs playback mode
let addMode = true; // Flag for add mode vs delete mode
let currentColor = "red";

// Resize all canvases to full width of the browser
function resizeCanvases() {
    const fixedHeight = 400; // Fixed height for all canvases
    waveformCanvas.width = window.innerWidth;
    waveformCanvas.height = fixedHeight;
    interactionCanvas.width = window.innerWidth;
    interactionCanvas.height = fixedHeight;
    playbackCanvas.width = window.innerWidth;
    playbackCanvas.height = fixedHeight;

    if (audioBuffer) {
        drawWaveformOnce(audioBuffer);
    }
    drawInteraction(currentColor);
    drawPlaybackLine();
}


window.addEventListener("resize", resizeCanvases);
resizeCanvases();

// Fetch and decode the MP3 file
fetch("/audio-file")
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        return audioContext.decodeAudioData(arrayBuffer);
    })
    .then(buffer => {
        audioBuffer = buffer;
        drawWaveformOnce(audioBuffer); // Draw the waveform once
    })
    .catch(error => {
        console.error("An error occurred:", error);
    });

// Draw the waveform (static layer)
function drawWaveformOnce(buffer) {
    const channelData = buffer.getChannelData(0);
    const width = waveformCanvas.width;
    const height = waveformCanvas.height;
    const step = Math.ceil(channelData.length / width);
    const amp = height / 2;

    waveformCtx.clearRect(0, 0, width, height);

    waveformCtx.beginPath();
    for (let i = 0; i < width; i++) {
        const min = Math.min(...channelData.slice(i * step, (i + 1) * step));
        const max = Math.max(...channelData.slice(i * step, (i + 1) * step));
        waveformCtx.moveTo(i, (1 + min) * amp);
        waveformCtx.lineTo(i, (1 + max) * amp);
    }
    waveformCtx.strokeStyle = "blue";
    waveformCtx.stroke();
}

// Draw interaction elements (dots, lines, and shading)
function drawInteraction(color) {
    const width = interactionCanvas.width;
    const height = interactionCanvas.height;

    interactionCtx.clearRect(0, 0, width, height);

    if (stateData[color].length === 0) return;

    const impliedStart = { x: 0, y: stateData[color][0].y };
    const impliedEnd = { x: audioPlayer.duration, y: stateData[color][stateData[color].length - 1].y };
    const allPoints = [impliedStart, ...stateData[color], impliedEnd].sort((a, b) => a.x - b.x);

    // Draw translucent shading
    interactionCtx.beginPath();
    interactionCtx.moveTo(0, height - (impliedStart.y / 1023) * height);
    allPoints.forEach(point => {
        const x = (point.x / audioPlayer.duration) * width;
        const y = height - (point.y / 1023) * height;
        interactionCtx.lineTo(x, y);
    });
    interactionCtx.lineTo(width, height);
    interactionCtx.lineTo(0, height);
    interactionCtx.closePath();
    interactionCtx.fillStyle = COLORS[color][1];
    interactionCtx.fill();

    // Draw dots and lines
    allPoints.forEach((point, index) => {
        const x = (point.x / audioPlayer.duration) * width;
        const y = height - (point.y / 1023) * height;

        // Draw dot
        interactionCtx.beginPath();
        interactionCtx.arc(x, y, 4, 0, 2 * Math.PI);
        interactionCtx.fillStyle = COLORS[color][0];
        interactionCtx.fill();

        // Draw line
        if (index < allPoints.length - 1) {
            const nextPoint = allPoints[index + 1];
            const nextX = (nextPoint.x / audioPlayer.duration) * width;
            const nextY = height - (nextPoint.y / 1023) * height;
            interactionCtx.beginPath();
            interactionCtx.moveTo(x, y);
            interactionCtx.lineTo(nextX, nextY);
            interactionCtx.strokeStyle = COLORS[color][0];
            interactionCtx.stroke();
        }
    });
}

// Draw playback line (dynamic layer)
function drawPlaybackLine() {
    const width = playbackCanvas.width;
    const height = playbackCanvas.height;

    playbackCtx.clearRect(0, 0, width, height);

    const playbackX = (audioPlayer.currentTime / audioPlayer.duration) * width;

    playbackCtx.beginPath();
    playbackCtx.moveTo(playbackX, 0);
    playbackCtx.lineTo(playbackX, height);
    playbackCtx.strokeStyle = "black";
    playbackCtx.lineWidth = 2;
    playbackCtx.stroke();
}

// Calculate the current red Y value
function getCurrentValue(time, color) {
    if (stateData[color].length === 0) {
        return 0; // No dots, return 0
    }

    const impliedStart = { x: 0, y: stateData[color][0].y };
    const impliedEnd = { x: audioPlayer.duration, y: stateData[color][stateData[color].length - 1].y };
    const allPoints = [impliedStart, ...stateData[color], impliedEnd].sort((a, b) => a.x - b.x);

    for (let i = 0; i < allPoints.length - 1; i++) {
        const point1 = allPoints[i];
        const point2 = allPoints[i + 1];
        if (time >= point1.x && time <= point2.x) {
            const t = (time - point1.x) / (point2.x - point1.x);
            return Math.round(point1.y + t * (point2.y - point1.y));
        }
    }

    return 0;
}

// Update the "Red value" display
audioPlayer.addEventListener("timeupdate", () => {
    const currentTime = audioPlayer.currentTime;
    const currentRedValue = getCurrentValue(currentTime, 'red');

    // Update the text box
    const redValueDisplay = document.getElementById("redValueDisplay");
    redValueDisplay.innerText = `Red value: ${currentRedValue}`;

    // Update the playback line
    drawPlaybackLine();
});

// Add a new point to stateData
function addPoint(x, y) {
    stateData[currentColor].push({ x, y });
    stateData[currentColor].sort((a, b) => a.x - b.x);
    drawInteraction(currentColor);
}

// Remove a point closest to the clicked coordinates
function removePoint(clickX, clickY) {
    const width = interactionCanvas.width;
    const height = interactionCanvas.height;

    const closestIndex = stateData[currentColor].findIndex(point => {
        const x = (point.x / audioPlayer.duration) * width;
        const y = height - (point.y / 1023) * height;
        const distance = Math.sqrt((clickX - x) ** 2 + (clickY - y) ** 2);
        return distance < 10;
    });

    if (closestIndex !== -1) {
        stateData[currentColor].splice(closestIndex, 1);
        drawInteraction(currentColor);
    }
}

// Toggle between playback and draw mode
modeToggleButton.addEventListener("click", () => {
    drawMode = !drawMode;
    modeToggleButton.innerText = drawMode ? "Switch to Playback Mode" : "Switch to Draw Mode";
});

// Toggle between add and delete mode
actionToggleButton.addEventListener("click", () => {
    addMode = !addMode;
    actionToggleButton.innerText = addMode ? "Switch to Delete Points" : "Switch to Add Points";
});

// Canvas click handler
interactionCanvas.addEventListener("click", (event) => {
    const rect = interactionCanvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left; // Map click position X
    const clickY = event.clientY - rect.top; // Map click position Y

    // Debugging log
    console.log(`Click coordinates relative to canvas: (${clickX}, ${clickY})`);

    if (drawMode) {
        const timestamp = (clickX / interactionCanvas.width) * audioPlayer.duration;
        const value = 1023 - (clickY / interactionCanvas.height) * 1023;

        if (addMode) {
            addPoint(timestamp, value);
        } else {
            removePoint(clickX, clickY);
        }
    } else {
        const clickPosition = (clickX / interactionCanvas.width) * audioPlayer.duration;
        audioPlayer.currentTime = clickPosition; // Seek audio playback
    }
});
