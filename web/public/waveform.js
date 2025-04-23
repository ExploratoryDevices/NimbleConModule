document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("waveformCanvas");
    const ctx = canvas.getContext("2d");
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Fetch waveform data from the server
    fetch("/upload")
        .then(response => response.json())
        .then(waveformData => {
            // Example waveform data processing
            const samples = waveformData.samples; // Array of normalized sample values (0 to 1)
            const step = Math.ceil(samples.length / canvasWidth); // Scale the data to fit the canvas width
            renderWaveform(samples, step, canvasWidth, canvasHeight);
        })
        .catch(error => console.error("Error loading waveform data:", error));

    // Function to render waveform onto the canvas
    function renderWaveform(samples, step, width, height) {
        ctx.clearRect(0, 0, width, height); // Clear the canvas
        ctx.beginPath();
        ctx.strokeStyle = "#1E90FF"; // Choose a waveform color
        ctx.lineWidth = 2;

        // Draw the waveform
        for (let i = 0; i < width; i++) {
            const sampleIndex = i * step;
            const amplitude = samples[sampleIndex] * height;
            const x = i;
            const y = height / 2 - amplitude / 2;
            ctx.lineTo(x, y);
        }

        ctx.stroke();
    }
});
