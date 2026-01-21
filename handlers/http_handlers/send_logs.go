package httphandlers

import (
	"fmt"
	"net/http"

	"github.com/404errorg6/FTP-server/ftp/config"
)

func HandleLogs(w http.ResponseWriter, req *http.Request) {
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
		case m := <-config.LogsCh:
			m = fmt.Sprintf("[LOGS]: %v\n", m)
			_, err := fmt.Fprint(w, m)
			if err != nil {
				fmt.Printf("[FATAL] %v", m)
				continue
			}

			fmt.Printf("%v", m)
			flusher.Flush()
		}
	}
}
