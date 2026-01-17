package main

import (
	"fmt"
	"net/http"

	"github.com/404errorg6/FTP-server/ftp/server"
)

func handleLogs(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	ctx := req.Context()
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Unable to typecast to flusher", http.StatusInternalServerError)
		return
	}

	for {
		select {
		case <-ctx.Done():
			return
		case m := <-logsCh:
			m = fmt.Sprintf("[LOGS]: %v\n", m)
			fmt.Fprint(w, m)
			fmt.Printf("%v", m)
			flusher.Flush()
		}
	}
}

func handleStart(w http.ResponseWriter, req *http.Request) {
	err := server.StartFTP(logsCh)
	if err != nil {
		sendJSON(w, err.Error())
		fmt.Printf("Error occured while starting ftp: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
	}

	w.WriteHeader(http.StatusOK)
	sendJSON(w, "No response")
}

func handleStop(w http.ResponseWriter, req *http.Request) {
	server.StopFTP(logsCh)
	w.WriteHeader(http.StatusOK)
	sendJSON(w, "No response")
}

func handleCheck(w http.ResponseWriter, req *http.Request) {
	html := `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Server Log Monitor</title>
    <style>
        body { background: #121212; color: #00ff00; font-family: 'Courier New', monospace; padding: 20px; }
        #console {
            background: #000;
            border: 1px solid #333;
            height: 400px;
            overflow-y: auto;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 0 20px rgba(0,255,0,0.1);
        }
        .log-entry { margin-bottom: 5px; border-bottom: 1px solid #1a1a1a; padding-bottom: 2px; }
        .timestamp { color: #888; font-size: 0.8em; margin-right: 10px; }
        .controls { margin-bottom: 15px; }
        button { background: #333; color: #fff; border: none; padding: 8px 15px; cursor: pointer; border-radius: 4px; }
        button:hover { background: #444; }
    </style>
</head>
<body>

    <h2>Live Server Logs</h2>
    <div class="controls">
        <button onclick="clearLogs()">Clear Console</button>
        <span id="status">Status: Connecting...</span>
    </div>

    <div id="console"></div>

    <script>
        const logArray = []; // Your string array for storage
        const consoleEl = document.getElementById('console');
        const statusEl = document.getElementById('status');

        async function connectToLogs() {
            try {
	const response = await fetch('http://localhost:8085/api/logs'); // Adjust to your Go route
                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                statusEl.innerText = "Status: Streaming";
                statusEl.style.color = "#00ff00";

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    
                    // Split by newline in case multiple logs arrived in one flush
                    const lines = chunk.split('\n').filter(line => line.trim() !== "");
                    
                    lines.forEach(line => {
                        // 1. Add to the array
                        logArray.push(line);
                        
                        // 2. Add to the UI
                        const div = document.createElement('div');
                        div.className = 'log-entry';
												div.innerHTML = '<span class="timestamp">' + new Date().toLocaleTimeString() + '</span> ' + line;
                        consoleEl.appendChild(div);
                    });

                    // Auto-scroll to bottom
                    consoleEl.scrollTop = consoleEl.scrollHeight;
                }
            } catch (err) {
                statusEl.innerText = "Status: Disconnected";
                statusEl.style.color = "red";
                console.error("Stream error:", err);
            }
        }

        function clearLogs() {
            logArray.length = 0; // Clear the array
            consoleEl.innerHTML = ''; // Clear the UI
        }

        // Start listening when page loads
        connectToLogs();
    </script>
</body>
</html>`

	w.Header().Set("Content-Type", "text/html")
	w.Write([]byte(html))
	w.WriteHeader(200)
}
