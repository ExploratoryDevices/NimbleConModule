document.addEventListener("DOMContentLoaded", () => {
    const audio = new Howl({ src: ["./uploads/moon_and_sun.mp3"] });
    const playButton = document.getElementById("play");
    const pauseButton = document.getElementById("pause");
    const waveformContainer = document.getElementById("waveform");

    waveformContainer.addEventListener("click", (event) => {
        const rect = waveformContainer.getBoundingClientRect();
        const clickX = event.clientX - rect.left; // X position of the click
        const duration = audio.duration(); // Get the total duration of the audio
        const clickedTime = (clickX / rect.width) * duration;

        audio.seek(clickedTime); // Jump to the clicked time
    });


    fetch("/waveform-data")
        .then(response => response.json())
        .then(waveData => {
            // Get the waveform samples from the response data
            const samples = waveData.samples; // Assuming samples are normalized values between 0 and 1
            const canvas = document.getElementById("waveformCanvas");
            const ctx = canvas.getContext("2d");

            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;

            // Scale samples to fit the canvas width
            const step = Math.ceil(samples.length / canvasWidth);

            // Render the waveform onto the canvas
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            ctx.beginPath();
            ctx.strokeStyle = "#1E90FF"; // Waveform color
            ctx.lineWidth = 2;

            for (let i = 0; i < canvasWidth; i++) {
                const sampleIndex = i * step;
                const amplitude = samples[sampleIndex] * canvasHeight; // Scale amplitude to fit canvas height
                const x = i;
                const y = canvasHeight / 2 - amplitude / 2; // Center waveform vertically
                ctx.lineTo(x, y);
            }

            ctx.stroke();
        })
        .catch(error => {
            console.error("Error rendering waveform:", error);
        });


    playButton.addEventListener("click", () => audio.play());
    pauseButton.addEventListener("click", () => audio.pause());
});
