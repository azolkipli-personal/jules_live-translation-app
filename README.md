# Live Translation Application

This is a simple web application that provides live voice translation from Japanese to English.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Frontend

This project uses `esbuild` to bundle the frontend code. To build the frontend, run the following command:

```bash
npm run build
```

### 3. Set up Google Cloud Authentication

This application uses the Google Cloud Translation API. To use it, you need to set up authentication.

1.  Create a service account and download the JSON key file. See the [Google Cloud documentation](https://cloud.google.com/docs/authentication/getting-started) for more information.
2.  Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the path of your JSON key file.

    ```bash
    export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/keyfile.json"
    ```

### 4. Start the Server

```bash
npm start
```

The server will start on port 3000 by default. You can change the port by setting the `PORT` environment variable.

## Usage

1.  Open your browser and navigate to `http://localhost:3000`.
2.  Click the "Start Translating" button and begin speaking in Japanese.
3.  The transcribed text will appear in the top text area, and the English translation will appear in the bottom text area.
