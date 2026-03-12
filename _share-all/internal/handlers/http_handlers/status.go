package httphandlers

import (
	"net/http"

	"changeme/internal/config"
)

func HandleWebStatus(w http.ResponseWriter, req *http.Request) {
	if config.MiniServer.IsRunning {
		config.SendJSON(w, config.MiniServer.Host+":"+config.MiniServer.Port)
		return
	}

	config.SendJSON(w, false)
}
