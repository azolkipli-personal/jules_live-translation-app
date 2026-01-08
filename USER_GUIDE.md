# User Guide: Live Translation Application

This guide will walk you through the steps to use the Live Translation Application.

## Prerequisites

Before you begin, ensure you have the following:

*   A modern web browser that supports the Web Speech API (e.g., Google Chrome, Microsoft Edge).
*   A working microphone connected to your computer.

## Getting Started

1.  **Start the Application:** Follow the setup instructions in the `README.md` file to start the application server.
2.  **Open the Application:** Open your web browser and navigate to the URL where the application is running (by default, this is `http://localhost:3000`).

## How to Use the Application

1.  **Begin Translation:**
    *   Once the page has loaded, click the **"Start Translating"** button to begin the live translation.
    *   Your browser may ask for permission to access your microphone. Click **"Allow"** to proceed.

2.  **Speak in Japanese:**
    *   The application is now listening. Begin speaking clearly in Japanese.
    *   As you speak, you will see your transcribed words appear in the top text box in near real-time.

3.  **View the English Translation:**
    *   Almost immediately after the Japanese text appears, the English translation will be displayed in the larger text area below.

4.  **Stop the Translation:**
    *   To stop the translation, click the **"Stop Translating"** button. The application will no longer be listening to your microphone.

## Troubleshooting

*   **No sound is being transcribed:**
    *   Ensure your microphone is properly connected and not muted.
    *   Check your browser's site settings to make sure you have granted microphone access to the application.
*   **Translation is not appearing, or you see an error message:**
    *   If you see an error message in the translation box, there may be a problem with the translation service.
    *   Verify that the backend server is running correctly and that you have configured the Google Cloud credentials as described in the `README.md`.
    *   Check the browser's developer console for any more detailed error messages.

Thank you for using the Live Translation Application!
