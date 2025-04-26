import WaveSurfer from 'https://cdn.jsdelivr.net/npm/wavesurfer.js@7/dist/wavesurfer.esm.js';
import TimelinePlugin from 'https://cdn.jsdelivr.net/npm/wavesurfer.js@7/dist/plugins/timeline.esm.js';

export const wavesurfer = WaveSurfer.create({
    container: '#waveform',
    waveColor: '#4F4A85',
    progressColor: '#383351',
    url: '/audio-file',
    minPxPerSec: 100,
    plugins: [TimelinePlugin.create()],
    height: 500,
    mediaControls: true,
});

wavesurfer.on('interaction', () => wavesurfer.play());

export let currentPxPerSec = 100;

wavesurfer.once('decode', () => {
    const slider = document.querySelector('input[type="range"]');
    slider.addEventListener('input', (e) => {
        const sliderValue = e.target.valueAsNumber;
        const normalized = sliderValue / 1000;
        const logZoom = 1 * Math.pow(100, normalized);

        const container = document.getElementById('waveform');
        const duration = wavesurfer.getDuration();

        const minPxPerSec = container.clientWidth / duration;

        currentPxPerSec = Math.max(logZoom, minPxPerSec);

        wavesurfer.zoom(currentPxPerSec);
        resizeCanvases();
        drawInteraction();
    });
});

export default wavesurfer;
