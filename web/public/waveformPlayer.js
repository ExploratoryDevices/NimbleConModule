const canvas = document.getElementById("waveformCanvas");
const ctx = canvas.getContext("2d");
const audioPlayer = document.getElementById("audioPlayer");
const modeToggleButton = document.getElementById("modeToggleButton");
const actionToggleButton = document.getElementById("actionToggleButton");

let audioBuffer = null;
let stateData = []; // Array to hold external data (dots) as {x, y} objects
let drawMode = false; // Flag for draw mode vs playback mode
let addMode = true; // Flag for add mode vs delete mode

// Resize canvas to full width of the browser
function resizeCanvas() {
    canvas.width = window.innerWidth;
    if (audioBuffer) {
        drawWaveform(audioBuffer);
        drawDotsLinesAndShading();
    }
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Fetch and decode the MP3 file
fetch("/audio-file")
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        return audioContext.decodeAudioData(arrayBuffer);
    })
    .then(buffer => {
        audioBuffer = buffer;
        drawWaveform(audioBuffer);
    })
    .catch(error => {
        console.error("An error occurred:", error);
    });

// Draw waveform on the canvas
function drawWaveform(buffer) {
    const channelData = buffer.getChannelData(0);

    const width = canvas.width;
    const height = canvas.height;
    const step = Math.ceil(channelData.length / width);
    const amp = height / 2;

    ctx.clearRect(0, 0, width, height);

    ctx.beginPath();
    for (let i = 0; i < width; i++) {
        const min = Math.min(...channelData.slice(i * step, (i + 1) * step));
        const max = Math.max(...channelData.slice(i * step, (i + 1) * step));
        ctx.moveTo(i, (1 + min) * amp);
        ctx.lineTo(i, (1 + max) * amp);
    }
    ctx.strokeStyle = "blue";
    ctx.stroke();
}

function drawDotsLinesAndShading() {
    if (!audioBuffer || stateData.length === 0) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    // Redraw the waveform
    drawWaveform(audioBuffer);

    // Recalculate implied start and end points
    const impliedStart = { x: 0, y: stateData[0].y };
    const impliedEnd = { x: audioPlayer.duration, y: stateData[stateData.length - 1].y };

    // Combine implied points with state data and sort them by X
    const allPoints = [impliedStart, ...stateData, impliedEnd].sort((a, b) => a.x - b.x);

    // Regenerate translucent shading
    ctx.beginPath();
    ctx.moveTo(0, height - (impliedStart.y / 1023) * height); // Start at the implied start point
    allPoints.forEach((point) => {
        const x = (point.x / audioPlayer.duration) * width;
        const y = height - (point.y / 1023) * height;
        ctx.lineTo(x, y);
    });
    ctx.lineTo(width, height); // Close the path at the bottom-right corner
    ctx.lineTo(0, height); // Close the path at the bottom-left corner
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 0, 0, 0.3)"; // Translucent red shading
    ctx.fill();

    // Draw dots and lines
    allPoints.forEach((point, index) => {
        const x = (point.x / audioPlayer.duration) * width;
        const y = height - (point.y / 1023) * height;

        // Draw dot
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI); // Dot radius: 4
        ctx.fillStyle = "red";
        ctx.fill();

        // Draw line to next point
        if (index < allPoints.length - 1) {
            const nextPoint = allPoints[index + 1];
            const nextX = (nextPoint.x / audioPlayer.duration) * width;
            const nextY = height - (nextPoint.y / 1023) * height;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(nextX, nextY);
            ctx.strokeStyle = "red";
            ctx.stroke();
        }
    });
}

// Add a new point to stateData
function addPoint(x, y) {
    stateData.push({ x, y });
    stateData.sort((a, b) => a.x - b.x); // Sort by x-coordinate
    drawDotsLinesAndShading();
}

// Remove a point closest to the clicked coordinates
function removePoint(clickX, clickY) {
    const width = canvas.width;
    const height = canvas.height;

    const closestIndex = stateData.findIndex(point => {
        const x = (point.x / audioPlayer.duration) * width;
        const y = height - (point.y / 1023) * height;
        const distance = Math.sqrt((clickX - x) ** 2 + (clickY - y) ** 2); // Euclidean distance
        return distance < 10; // Threshold: 10px
    });

    if (closestIndex !== -1) {
        stateData.splice(closestIndex, 1);
        drawDotsLinesAndShading();
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
canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    if (drawMode) {
        const timestamp = (clickX / canvas.width) * audioPlayer.duration;
        const value = 1023 - (clickY / canvas.height) * 1023;

        if (addMode) {
            addPoint(timestamp, value);
        } else {
            removePoint(clickX, clickY);
        }
    } else {
        const clickPosition = (clickX / canvas.width) * audioPlayer.duration;
        audioPlayer.currentTime = clickPosition; // Seek audio playback
    }
});
