const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static("public"));

// Endpoint to serve the MP3 file
app.get("/audio-file", (req, res) => {
    const filePath = "./uploads/moon_and_sun.mp3";
    if (!fs.existsSync(filePath)) {
        res.status(404).send("Audio file not found");
        return;
    }
    res.sendFile(path.resolve(filePath));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
