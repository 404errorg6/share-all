package httphandlers

import (
	"net/http"

	"changeme/internal/config"
)

func HandleStopWebUI(w http.ResponseWriter, req *http.Request) {
	var err error
	if !config.MiniServer.IsRunning {
		goto EXIT
	}

	err = config.MiniServer.Conn.Close()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

EXIT:
	config.MiniServer.IsRunning = false
	config.SendJSON(w, "Web based sharing disabled")
}
