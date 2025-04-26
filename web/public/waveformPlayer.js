import WaveSurfer from 'https://cdn.jsdelivr.net/npm/wavesurfer.js@7/dist/wavesurfer.esm.js'
import TimelinePlugin from 'https://cdn.jsdelivr.net/npm/wavesurfer.js@7/dist/plugins/timeline.esm.js'

const waveformCanvas = document.getElementById("waveformCanvas");
const waveformWrapper = document.getElementById('waveformWrapper');
const interactionCanvas = document.getElementById("interactionCanvas");
const interactionCtx = interactionCanvas.getContext("2d");
const playbackCanvas = document.getElementById("playbackCanvas");
const modeToggleButton = document.getElementById("modeToggleButton");
const actionToggleButton = document.getElementById("actionToggleButton");
const colorRedButton = document.getElementById("colorRedButton");
const colorGreenButton = document.getElementById("colorGreenButton");
const fileInput = document.getElementById("fileUpload");
const PAYLOAD_ADDR = "http://0.0.0.0:7070";

const COLORS = {
    "red": ["red", "rgba(255, 0, 0, 0.3)"],
    "green": ["green", "rgba(0, 255, 0, 0.3)"]
};

let stateData = {
    "red": [],
    "green": [],
};
let drawMode = false;
let addMode = true;
let currentColor = "red";
let currentPxPerSec = 100;
let isDragging = false;
let draggedPoint = null;
let previewPoint = null;
let visibleStartTime = 0;

const wavesurfer = WaveSurfer.create({
    container: '#waveform',
    waveColor: '#4F4A85',
    progressColor: '#383351',
    url: '/audio-file',
    minPxPerSec: 100,
    plugins: [TimelinePlugin.create()],
    height: 500,
    mediaControls: true,
});

wavesurfer.on('scroll', (e) => {
    visibleStartTime = e;
});

fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const objectUrl = URL.createObjectURL(file);
        wavesurfer.load(objectUrl);
    }
});

function resizeCanvases() {
    const container = document.getElementById("waveform");
    const width = container.scrollWidth;
    const height = container.clientHeight;

    [waveformCanvas, interactionCanvas, playbackCanvas].forEach(canvas => {
        canvas.width = width;
        canvas.height = height;
    });

    drawInteraction();
}

window.addEventListener("resize", resizeCanvases);
resizeCanvases();

window.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
        event.preventDefault(); // prevent page scrolling
        if (wavesurfer.isPlaying()) {
            wavesurfer.pause();
        } else {
            wavesurfer.play();
        }
    }
});

wavesurfer.getWrapper().addEventListener('scroll', () => {
    const newScrollLeft = waveformWrapper.scrollLeft;
    const scrollableWidth = waveformCanvas.width;
    const duration = wavesurfer.getDuration();
    visibleStartTime = (newScrollLeft / scrollableWidth) * duration;

    drawInteraction();
});


function xToTime(x) {
    return visibleStartTime + (x / currentPxPerSec);
}

function timeToX(time) {
    return (time - visibleStartTime) * currentPxPerSec;
}

function drawInteraction() {
    const width = interactionCanvas.width;
    const height = interactionCanvas.height;
    interactionCtx.clearRect(0, 0, width, height);

    Object.keys(stateData).forEach(color => {
        if (stateData[color].length === 0 && !previewPoint) return;

        // Copy the points
        let points = [...stateData[color]];

        // If previewing and matching the current color, temporarily add the preview point
        if (previewPoint && color === currentColor) {
            points.push(previewPoint);
            points.sort((a, b) => a.x - b.x);
        }

        if (points.length === 0) return;

        const impliedStart = { x: 0, y: points[0].y };
        const impliedEnd = { x: wavesurfer.getDuration(), y: points[points.length - 1].y };
        const allPoints = [impliedStart, ...points, impliedEnd];

        // Draw the shaded fill
        interactionCtx.beginPath();
        interactionCtx.moveTo(0, height - (impliedStart.y / 1023) * height);
        allPoints.forEach(point => {
            const x = timeToX(point.x);
            const y = height - (point.y / 1023) * height;
            interactionCtx.lineTo(x, y);
        });
        interactionCtx.lineTo(width, height);
        interactionCtx.lineTo(0, height);
        interactionCtx.closePath();
        interactionCtx.fillStyle = COLORS[color][1];
        interactionCtx.fill();

        // Draw the lines and points
        allPoints.forEach((point, index) => {
            const x = timeToX(point.x);
            const y = height - (point.y / 1023) * height;

            // Draw dot
            interactionCtx.beginPath();
            interactionCtx.arc(x, y, 4, 0, 2 * Math.PI);
            interactionCtx.fillStyle = COLORS[color][0];
            interactionCtx.fill();

            // Draw line to next
            if (index < allPoints.length - 1) {
                const nextPoint = allPoints[index + 1];
                const nextX = timeToX(nextPoint.x);
                const nextY = height - (nextPoint.y / 1023) * height;
                interactionCtx.beginPath();
                interactionCtx.moveTo(x, y);
                interactionCtx.lineTo(nextX, nextY);
                interactionCtx.strokeStyle = COLORS[color][0];
                interactionCtx.stroke();
            }
        });
    });
}

function getCurrentValue(time, color) {
    if (stateData[color].length === 0) return 0;
    const impliedStart = { x: 0, y: stateData[color][0].y };
    const impliedEnd = { x: xToTime(interactionCanvas.width), y: stateData[color][stateData[color].length - 1].y };
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

function removePoint(clickX, clickY) {
    const height = interactionCanvas.height;
    const closestIndex = stateData[currentColor].findIndex(point => {
        const x = timeToX(point.x);
        const y = height - (point.y / 1023) * height;
        const distance = Math.sqrt((clickX - x) ** 2 + (clickY - y) ** 2);
        return distance < 10;
    });
    if (closestIndex !== -1) {
        stateData[currentColor].splice(closestIndex, 1);
        drawInteraction();
    }
}

waveformWrapper.addEventListener("wheel", (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault(); // Stop page from scrolling horizontally

        const currentScroll = wavesurfer.getWrapper().scrollLeft;
        wavesurfer.getWrapper().scrollLeft = currentScroll + e.deltaX * 1.5;
    }
}, { passive: false });


modeToggleButton.addEventListener("click", () => {
    drawMode = !drawMode;
    modeToggleButton.innerText = drawMode ? "Switch to Playback Mode" : "Switch to Draw Mode";
    if (drawMode) {
        interactionCanvas.style.zIndex = 3;
        playbackCanvas.style.zIndex = 2;
        interactionCanvas.style.pointerEvents = 'auto'; // Allow clicking for drawing
    } else {
        interactionCanvas.style.zIndex = 2;
        playbackCanvas.style.zIndex = 3;
        interactionCanvas.style.pointerEvents = 'none'; // Disable blocking clicks when playing
    }
});


actionToggleButton.addEventListener("click", () => {
    addMode = !addMode;
    actionToggleButton.innerText = addMode ? "Switch to Delete Points" : "Switch to Add Points";
});

colorRedButton.addEventListener("click", () => currentColor = "red");
colorGreenButton.addEventListener("click", () => currentColor = "green");

function sendValues() {
    const currentTime = wavesurfer.getCurrentTime();
    const payload = {
        redValue: getCurrentValue(currentTime, 'red'),
        greenValue: getCurrentValue(currentTime, 'green'),
        timestamp: currentTime
    };
    fetch(PAYLOAD_ADDR, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    }).catch(console.error);
}

// setInterval(sendValues, 1000);

wavesurfer.on('interaction', () => wavesurfer.play());

wavesurfer.on("timeupdate", (currentTime) => {
    document.getElementById("redValueDisplay").innerText = `Red value: ${getCurrentValue(currentTime, 'red')}`;
    document.getElementById("greenValueDisplay").innerText = `Green value: ${getCurrentValue(currentTime, 'green')}`;
    drawInteraction();
});

wavesurfer.once('decode', () => {
    const slider = document.querySelector('input[type="range"]');
    slider.addEventListener('input', (e) => {
        const sliderValue = e.target.valueAsNumber;
        const normalized = sliderValue / 1000;
        const logZoom = 1 * Math.pow(100, normalized);

        const container = document.getElementById('waveform');
        const duration = wavesurfer.getDuration();

        // Calculate minimum zoom to fit full song
        const minPxPerSec = container.clientWidth / duration;

        // Clamp zoom level: don't allow zooming out past full song view
        currentPxPerSec = Math.max(logZoom, minPxPerSec);

        wavesurfer.zoom(currentPxPerSec);
        resizeCanvases();  // Important to resize canvases after zoom
        drawInteraction();
    });
});

// When you press mouse down
interactionCanvas.addEventListener("mousedown", (event) => {
    if (!drawMode) return;

    const rect = interactionCanvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const timestamp = xToTime(clickX);
    const value = 1023 - (clickY / interactionCanvas.height) * 1023;

    if (addMode) {
        // Check if clicking near existing point to drag
        draggedPoint = findClosestPoint(clickX, clickY, currentColor);
        if (draggedPoint) {
            isDragging = true;
        } else {
            // Otherwise, start previewing a new point
            previewPoint = { x: timestamp, y: value };
        }
    } else {
        removePoint(clickX, clickY);
    }
});

// While mouse moves
interactionCanvas.addEventListener("mousemove", (event) => {
    if (!drawMode) return;

    const rect = interactionCanvas.getBoundingClientRect();
    const moveX = event.clientX - rect.left;
    const moveY = event.clientY - rect.top;

    const timestamp = xToTime(moveX);
    const value = 1023 - (moveY / interactionCanvas.height) * 1023;

    if (isDragging && draggedPoint) {
        // Update dragged point
        draggedPoint.x = timestamp;
        draggedPoint.y = value;
        drawInteraction();
    } else if (previewPoint) {
        // Update preview point
        previewPoint.x = timestamp;
        previewPoint.y = value;
        drawInteraction();
    }
});

// When mouse button is released
interactionCanvas.addEventListener("mouseup", (event) => {
    if (!drawMode) return;

    if (isDragging) {
        // Done dragging
        isDragging = false;
        draggedPoint = null;
        drawInteraction();
    } else if (previewPoint) {
        // Add the new point for real
        stateData[currentColor].push(previewPoint);
        stateData[currentColor].sort((a, b) => a.x - b.x);
        console.log(previewPoint)
        console.log(visibleStartTime)
        previewPoint = null;
        drawInteraction();
    }
});

// Helper to find closest point
function findClosestPoint(clickX, clickY, color) {
    const height = interactionCanvas.height;
    const threshold = 10; // pixels
    for (const point of stateData[color]) {
        const px = timeToX(point.x);
        const py = height - (point.y / 1023) * height;
        const distance = Math.sqrt((clickX - px) ** 2 + (clickY - py) ** 2);
        if (distance < threshold) {
            return point;
        }
    }
    return null;
}

