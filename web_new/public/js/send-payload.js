import { wavesurfer } from './wavesurfer-setup.js';

const PAYLOAD_ADDR = "http://0.0.0.0:7070";

function sendValues() {
    const currentTime = wavesurfer.getCurrentTime();
    const payload = {
        redValue: 0,
        greenValue: 0,
        timestamp: currentTime,
    };
    fetch(PAYLOAD_ADDR, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    }).catch(console.error);
}

export default sendValues;
