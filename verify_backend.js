
const fs = require('fs');

async function testBackend() {
    console.log("Creating dummy file...");
    fs.writeFileSync('dummy_test.webm', 'dummyaudiodata');

    const formData = new FormData();
    const blob = new Blob([fs.readFileSync('dummy_test.webm')], { type: 'audio/webm' });
    formData.append('audio', blob, 'dummy_test.webm');
    formData.append('languageCode', 'ja-JP');

    console.log("Sending request to /transcribe...");
    try {
        const response = await fetch('http://localhost:3000/transcribe', {
            method: 'POST',
            body: formData
        });

        const text = await response.text();
        console.log(`Status: ${response.status}`);
        console.log(`Response: ${text}`);

        if (response.status === 200) {
            console.log("SUCCESS: Backend processed the request (even if empty transcription).");
        } else if (response.status === 500 && text.includes("Invalid audio")) {
            console.log("SUCCESS: Backend connected to Google Cloud (Google rejected dummy audio as expected).");
        } else {
            console.log("FAILURE: Unexpected response.");
        }

    } catch (e) {
        console.error("Connection Error:", e);
    }
}

testBackend();
