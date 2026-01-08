import { io } from "socket.io-client";

const socket = io();

const outPut = document.getElementById('outPut');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const clearBtn = document.getElementById('clearBtn');
const exportBtn = document.getElementById('exportBtn');
const helpBtn = document.getElementById('helpBtn');
const closeModal = document.getElementById('closeModal');
const helpModal = document.getElementById('helpModal');
const audioSourceSelect = document.getElementById('audioSource');
const translationDirectionSelect = document.getElementById('translationDirection');
const transcriptHistory = document.getElementById('transcriptHistory');
const sessionTimer = document.getElementById('sessionTimer');
const recordingIndicator = document.getElementById('recordingIndicator');

// File Input Elements
const fileInputContainer = document.getElementById('fileInputContainer');
const mediaFileInput = document.getElementById('mediaFileInput');
const mediaPlayer = document.getElementById('mediaPlayer');

// State variables
let recognition; // For Microphone
let mediaRecorder; // For System/File
let isRecording = false;
let sessionStartTime;
let timerInterval;
let debounceTimeout;
let activeStream = null;

// Socket listeners
socket.on('connect', () => {
    console.log('Socket connected');
});

socket.on('transcription', (data) => {
    if (data.text) {
        outPut.value = data.text;
        handleTranscriptionInput(data.text, data.isFinal);
    }
});

socket.on('error', (message) => {
    console.error("Socket Error:", message);
    showStatus(message, 'error'); // Fixed: showStatus adds 'Error:' prefix
    stopRecording();
});

// Initialize Web Speech API (Microphone only)
function initRecognition() {
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
            console.log('Microphone recognition started');
            updateUIState(true);
        };

        recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                transcript += event.results[i][0].transcript;
            }
            outPut.value = transcript;

            const latestResult = event.results[event.results.length - 1];
            if (latestResult.isFinal || transcript.length > 5) {
                handleTranscriptionInput(transcript, latestResult.isFinal);
            }
        };

        recognition.onerror = (event) => handleRecognitionError(event);
        recognition.onend = () => handleRecognitionEnd();
    }
}

// Stream Processing (System Audio & File) - NOW WITH SOCKETS
async function startStreamProcessing(stream) {
    activeStream = stream;

    // CRITICAL FIX: Extract ONLY audio tracks to prevent MediaRecorder crash
    // caused by trying to record Video+Audio stream with 'audio/webm' mimeType.
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
        showStatus('No audio detected. Check sharing settings.', 'error');
        alert("No audio detected! Did you check 'Share System Audio'?");
        updateUIState(false);
        return;
    }
    const audioStream = new MediaStream(audioTracks);

    const options = { mimeType: 'audio/webm;codecs=opus' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        // Fallback to default
        delete options.mimeType;
    }

    try {
        // Record only the clean audio stream
        mediaRecorder = new MediaRecorder(audioStream, options);
    } catch (e) {
        console.error('MediaRecorder error:', e);
        showStatus('MediaRecorder Error: ' + e.message, 'error');
        alert('Failed to create MediaRecorder: ' + e.message);
        return;
    }

    // Start Socket Stream
    const lang = translationDirectionSelect.value === 'ja-en' ? 'ja-JP' : 'en-US';
    socket.emit('start-stream', { languageCode: lang });

    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && isRecording) {
            socket.emit('audio-data', event.data);
        }
    };

    mediaRecorder.onstop = () => {
        socket.emit('end-stream');
    };

    // Start with 250ms chunks (Low Latency)
    try {
        mediaRecorder.start(250);
        showStatus('Streaming started...');
    } catch (e) {
        console.error("MediaRecorder Start Error:", e);
        showStatus('Start Error: ' + e.message, 'error');
        alert("MediaRecorder Start Error: " + e.message);
        isRecording = false;
        socket.emit('end-stream');
        updateUIState(false);
        return;
    }

    updateUIState(true);
}

// Logic Splitter
let isProcessing = false;

function showStatus(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    if (type === 'error') {
        outPut.value = `Error: ${message}`;
        recordingIndicator.textContent = 'Error';
        recordingIndicator.style.color = 'red';
        recordingIndicator.classList.remove('hidden');
    }
}

function setButtonsState(processing) {
    isProcessing = processing;
    startBtn.disabled = processing;
    stopBtn.disabled = processing;
    startBtn.style.opacity = processing ? '0.5' : '1';
    stopBtn.style.opacity = processing ? '0.5' : '1';
}

startBtn.addEventListener('click', async () => {
    if (isProcessing || isRecording) return;
    setButtonsState(true);

    try {
        isRecording = true;
        const source = audioSourceSelect.value;
        showStatus(`Starting ${source} mode...`);

        if (source === 'microphone') {
            await startMicrophone();
        } else if (source === 'system') {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            if (stream.getAudioTracks().length === 0) {
                throw new Error('No audio track selected. Please check "Share audio".');
            }
            stream.getVideoTracks()[0].onended = () => stopRecording();
            await startStreamProcessing(stream);
        } else if (source === 'file') {
            if (!mediaPlayer.src) throw new Error('Please select a file first.');

            await mediaPlayer.play();
            mediaPlayer.onended = () => stopRecording();

            let stream;
            if (mediaPlayer.captureStream) {
                stream = mediaPlayer.captureStream();
            } else if (mediaPlayer.mozCaptureStream) {
                stream = mediaPlayer.mozCaptureStream();
            } else {
                throw new Error('Browser captureStream not supported.');
            }

            // Wait for audio track (some browsers need delay)
            if (stream.getAudioTracks().length === 0) {
                await new Promise(r => setTimeout(r, 500));
            }

            await startStreamProcessing(stream);
        }
    } catch (error) {
        console.error("Start Error:", error);
        alert(error.message);
        isRecording = false;
        updateUIState(false);
    } finally {
        setButtonsState(false);
    }
});

stopBtn.addEventListener('click', async () => {
    if (stopBtn.disabled) return;
    stopRecording();
});

function startMicrophone() {
    if (!recognition) initRecognition();
    recognition.lang = translationDirectionSelect.value === 'ja-en' ? 'ja-JP' : 'en-US';
    try {
        recognition.start();
    } catch (e) {
        console.error("Mic start error:", e);
    }
}

function stopRecording() {
    if (!isRecording) return;
    showStatus('Stopping...');

    isRecording = false;

    // Stop Mic
    try { if (recognition) recognition.stop(); } catch (e) { }

    // Stop Socket Stream via MediaRecorder stop which triggers 'end-stream'
    try {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
    } catch (e) { console.warn('MediaRecorder stop error', e); }

    // Backup: Emit end-stream just in case
    socket.emit('end-stream');

    if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
        activeStream = null;
    }

    if (audioSourceSelect.value === 'file') {
        mediaPlayer.pause();
    }

    updateUIState(false);
    setButtonsState(false);
    showStatus('Stopped.');
}

// Shared Logic
function handleRecognitionEnd() {
    console.log('Mic recognition ended');
    if (isRecording && audioSourceSelect.value === 'microphone') {
        try { recognition.start(); } catch (e) { stopRecording(); }
    } else {
        updateUIState(false);
    }
}

function handleRecognitionError(event) {
    if (event.error === 'not-allowed') {
        alert('Microphone access denied.');
        stopRecording();
    }
}

function updateUIState(recording) {
    if (recording) {
        startBtn.classList.add('hidden');
        stopBtn.classList.remove('hidden');
        recordingIndicator.classList.remove('hidden');
        outPut.parentElement.classList.remove('hidden');
        if (!timerInterval) {
            sessionStartTime = Date.now();
            timerInterval = setInterval(updateTimer, 1000);
        }
    } else {
        startBtn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
        recordingIndicator.classList.add('hidden');
        clearInterval(timerInterval);
        timerInterval = null;
        if (recordingIndicator.textContent === 'Error') {
            recordingIndicator.style.color = 'var(--text-secondary)';
            recordingIndicator.textContent = 'Recording...';
        }
    }
}

function updateTimer() {
    const diff = Math.floor((Date.now() - sessionStartTime) / 1000);
    const h = Math.floor(diff / 3600).toString().padStart(2, '0');
    const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(diff % 60).toString().padStart(2, '0');
    sessionTimer.textContent = `${h}:${m}:${s}`;
}

let lastTranslatedText = '';
function handleTranscriptionInput(text, isFinal) {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        if (text && (isFinal || text !== lastTranslatedText)) {
            translateText(text, isFinal);
        }
    }, isFinal ? 0 : 500);
}

async function translateText(text, isFinal) {
    if (!text || text.trim() === '') return;
    const direction = translationDirectionSelect.value;
    const targetLang = direction === 'ja-en' ? 'en' : 'ja';

    try {
        const response = await fetch('/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, target: targetLang }),
        });
        if (!response.ok) throw new Error('Translation failed');
        const data = await response.json();

        lastTranslatedText = text;
        if (isFinal) {
            addToTranscript(text, data.translation);
            outPut.value = '';
        }
    } catch (error) {
        console.error('Translation error:', error);
    }
}

function addToTranscript(original, translated) {
    const emptyState = transcriptHistory.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    const entry = document.createElement('div');
    entry.className = 'transcript-entry';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    entry.innerHTML = `<span class="timestamp">${time}</span><div class="original-text">${original}</div><div class="translated-text">${translated}</div>`;
    transcriptHistory.prepend(entry);
}

audioSourceSelect.addEventListener('change', () => {
    if (audioSourceSelect.value === 'file') {
        fileInputContainer.classList.remove('hidden');
    } else {
        fileInputContainer.classList.add('hidden');
        mediaPlayer.pause();
    }
});

mediaFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        mediaPlayer.src = URL.createObjectURL(file);
        mediaPlayer.classList.remove('hidden');
    }
});

exportBtn.addEventListener('click', () => {
    // Export logic
    const entries = Array.from(document.querySelectorAll('.transcript-entry')).reverse();
    if (entries.length === 0) return alert('No transcript.');
    let csv = "data:text/csv;charset=utf-8,Timestamp,Original,Translation\n";
    entries.forEach(e => {
        csv += `${e.querySelector('.timestamp').textContent},${e.querySelector('.original-text').textContent.replace(/,/g, ' ')},${e.querySelector('.translated-text').textContent.replace(/,/g, ' ')}\n`;
    });
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `meeting_transcript_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

clearBtn.addEventListener('click', () => {
    if (confirm('Clear transcript?')) {
        transcriptHistory.innerHTML = '<div class="empty-state">Click "Start Translating"...</div>';
        sessionTimer.textContent = '00:00:00';
    }
});

// Modal
helpBtn.addEventListener('click', () => helpModal.classList.remove('hidden'));
closeModal.addEventListener('click', () => helpModal.classList.add('hidden'));
window.addEventListener('click', (e) => { if (e.target === helpModal) helpModal.classList.add('hidden'); });

initRecognition();
