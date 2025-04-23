// Helper function to format time as MM:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

// Add time markers every 5 seconds
function addTimeMarkers(duration) {
    const interval = 5; // Marker interval in seconds
    const width = canvas.width;
    const numMarkers = Math.floor(duration / interval); // Total markers

    timeMarkers.innerHTML = ""; // Clear existing markers
    for (let i = 0; i <= numMarkers; i++) {
        const marker = document.createElement("span");
        const time = i * interval; // Marker time in seconds
        marker.innerText = formatTime(time); // Format time as MM:SS
        marker.style.flex = "1"; // Even spacing
        timeMarkers.appendChild(marker);
    }
}
