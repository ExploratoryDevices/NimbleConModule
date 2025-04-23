const canvas = document.getElementById("waveformCanvas");
const ctx = canvas.getContext("2d");
const timeMarkers = document.getElementById("timeMarkers");
const audioPlayer = document.getElementById("audioPlayer");

let audioBuffer = null; // Store the decoded audio buffer to regenerate waveform

// Resize canvas to full width of the browser
function resizeCanvas() {
    canvas.width = window.innerWidth;
    if (audioBuffer) {
        drawWaveform(audioBuffer); // Regenerate waveform on resize
    }
}

// Update canvas size when window is resized
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
        audioBuffer = buffer; // Save decoded audio buffer
        drawWaveform(audioBuffer);
    })
    .catch(error => {
        console.error("An error occurred:", error);
    });

// Draw waveform on the canvas
function drawWaveform(buffer) {
    const channelData = buffer.getChannelData(0); // Use first channel

    const width = canvas.width;
    const height = canvas.height;
    const step = Math.ceil(channelData.length / width);
    const amp = height / 2;

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    // Draw waveform
    ctx.beginPath();
    for (let i = 0; i < width; i++) {
        const min = Math.min(...channelData.slice(i * step, (i + 1) * step));
        const max = Math.max(...channelData.slice(i * step, (i + 1) * step));
        ctx.moveTo(i, (1 + min) * amp);
        ctx.lineTo(i, (1 + max) * amp);
    }
    ctx.strokeStyle = "blue";
    ctx.stroke();

    // Add time markers
    addTimeMarkers(buffer.duration);
}

// Add time markers in MM:SS format
function addTimeMarkers(duration) {
    const interval = 5; // Marker interval in seconds
    const width = canvas.width;
    const numMarkers = Math.floor(duration / interval); // Total markers

    timeMarkers.innerHTML = ""; // Clear existing markers
    for (let i = 0; i <= numMarkers; i++) {
        const marker = document.createElement("span");
        const timeInSeconds = i * interval;
        const minutes = Math.floor(timeInSeconds / 60); // Calculate minutes
        const seconds = Math.floor(timeInSeconds % 60); // Calculate remaining seconds
        const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`; // Format MM:SS
        marker.innerText = formattedTime;
        marker.style.flex = "1"; // Even spacing
        timeMarkers.appendChild(marker);
    }
}

// Click-to-seek functionality
canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left; // Adjust for canvas position
    const clickPosition = (clickX / canvas.width) * audioPlayer.duration;
    audioPlayer.currentTime = clickPosition; // Seek audio to clicked position
});
