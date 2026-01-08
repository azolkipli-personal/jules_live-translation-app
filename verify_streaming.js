
const { io } = require("socket.io-client");
const socket = io("http://localhost:3000");

console.log("Connecting to socket...");

socket.on("connect", () => {
    console.log("Connected to server! ID:", socket.id);

    // Simulate Start Stream
    console.log("Sending start-stream...");
    socket.emit("start-stream", { languageCode: "en-US" });

    // Simulate Fake Audio Data (not real audio, just to check pipe)
    // Sending random bytes
    const buffer = Buffer.from("fakeaudiochunk");
    console.log("Sending audio-data...");
    socket.emit("audio-data", buffer);

    // Wait a bit then disconnect
    setTimeout(() => {
        console.log("Ending stream...");
        socket.emit("end-stream");
        socket.disconnect();
    }, 2000);
});

socket.on("error", (err) => {
    console.log("Socket Error:", err);
});

socket.on("disconnect", () => {
    console.log("Disconnected.");
});
