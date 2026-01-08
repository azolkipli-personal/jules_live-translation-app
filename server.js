const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { Translate } = require('@google-cloud/translate').v2;
const speech = require('@google-cloud/speech');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = 3000;

// Instantiates clients
const translate = new Translate();
const speechClient = new speech.SpeechClient();

app.use(express.static('public'));
app.use(express.json());

// Socket.io Connection
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    let recognizeStream = null;

    socket.on('start-stream', (data) => {
        console.log(`Starting stream for ${socket.id} [${data.languageCode}]`);

        const request = {
            config: {
                encoding: 'WEBM_OPUS',
                sampleRateHertz: 48000,
                languageCode: data.languageCode || 'en-US',
            },
            interimResults: true,
        };

        recognizeStream = speechClient
            .streamingRecognize(request)
            .on('error', (error) => {
                console.error('Google Streaming Error:', error);

                // Allow user to see Permission Denied errors clearly
                if (error && (error.code === 7 || (error.details && error.details.includes('PERMISSION_DENIED')))) {
                    socket.emit('error', 'Google Cloud Speech API is NOT enabled. Please enable it in Console.');
                } else {
                    socket.emit('error', error.message);
                }
            })
            .on('data', (data) => {
                if (data.results[0] && data.results[0].alternatives[0]) {
                    const result = data.results[0];
                    socket.emit('transcription', {
                        text: result.alternatives[0].transcript,
                        isFinal: result.isFinal
                    });
                }
            });
    });

    socket.on('audio-data', (blob) => {
        if (recognizeStream) {
            recognizeStream.write(blob);
        }
    });

    socket.on('end-stream', () => {
        if (recognizeStream) {
            recognizeStream.end();
            recognizeStream = null;
        }
    });

    socket.on('disconnect', () => {
        if (recognizeStream) {
            recognizeStream.end();
            recognizeStream = null;
        }
        console.log('Client disconnected:', socket.id);
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/translate', async (req, res) => {
    try {
        const { text, target = 'en' } = req.body;
        const [translation] = await translate.translate(text, target);
        res.send({ translation: translation });
    } catch (error) {
        console.error('Error translating text:', error);
        res.status(500).send({ error: 'Failed to translate text' });
    }
});

server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
