# Backend & Frontend Design Brief

## Project Overview
We require a frontend design and implementation for an **FTP Server Manager**.
The backend is a Go server. The frontend will communicate with it via API.

## 1. Visual Design (UI)
**Style**: Modern, Dark, Minimalist.
**Framework**: Vanilla HTML/CSS (or Stitches if preferred).

### Layout
The page should be a single-screen dashboard with two main sections:

#### A. Control Panel (Top Bar)
A horizontal bar containing the server controls.
1.  **Start Server Button**
    *   **Color**: Green (e.g., `#2e7d32`).
    *   **State**: Active by default. Disabled when server is running.
    *   **ID**: `startBtn`.
2.  **Stop Server Button**
    *   **Color**: Red (e.g., `#c62828`).
    *   **State**: Disabled by default. Active when server is running.
    *   **ID**: `stopBtn`.
3.  **Status Label**
    *   **Text**: "Files available at: [FTP_URL]"
    *   **Color**: Cyan/Blue (e.g., `#4fc3f7`) on a dark background.
    *   **Visibility**: Hidden by default. Only visible when the server is running.
    *   **Font**: Monospace (e.g., Consolas, Roboto Mono).

#### B. Log Console (Main Area)
A large, terminal-like area to display server logs.
1.  **Container**:
    *   **Background**: Deep Black (`#000000`).
    *   **Border**: Subtle gray border.
    *   **ID**: `console`.
    *   **Scroll**: Vertical scroll enabled (`overflow-y: auto`).
2.  **Log Entries**:
    *   **Font**: Monospace.
    *   **Color**: Light Gray (`#b0b0b0`) or Green (`#00ff00`).
    *   **Spacing**: Compact.

## 2. Frontend Logic (JavaScript)

### A. API Interaction
*   **Start Server**: Call `POST /api/start-ftp`.
    *   *On Success*: Disable Start button, Enable Stop button, Show Status Label (with URL from response).
*   **Stop Server**: Call `POST /api/stop-ftp`.
    *   *On Success*: Enable Start button, Disable Stop button, Hide Status Label.
*   **Listen to Logs**: Connect to `GET /api/logs` (EventStream).

### B. Smart Log Management (Crucial)
To maintain performance, the log console must follow these rules:
1.  **Buffer Limit**: Maximum **1000 lines**.
2.  **Auto-Cleanup**: When the limit is reached, delete the **oldest 5%** of logs (approx 50 lines) to make space. Do *not* clear the whole console.
3.  **Smart Auto-Scroll**:
    *   If the user is at the bottom: Auto-scroll to show new logs.
    *   If the user has scrolled up: Do **NOT** auto-scroll (let them read).
