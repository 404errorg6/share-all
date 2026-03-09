package httphandlers

import (
	"net/http"

	"github.com/404errorg6/FTP-server/config"
)

func HandleStopWebUI(w http.ResponseWriter, req *http.Request) {
	err := config.MiniServer.Conn.Close()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	config.MiniServer.IsRunning = false
	config.SendJSON(w, "Web based sharing disabled")
}
