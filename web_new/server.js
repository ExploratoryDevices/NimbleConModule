import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 7070;

// Needed because we are using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve everything inside /public as static files
app.use(express.static(path.join(__dirname, 'public')));

// For the audio file endpoint
app.get('/audio-file', (req, res) => {
    res.sendFile(path.join(__dirname, 'path-to-your-audio-file.mp3'));
});

// For receiving payloads
app.use(express.json());
app.post('/', (req, res) => {
    console.log('Received payload:', req.body);
    res.status(200).send('OK');
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
