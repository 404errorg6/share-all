package httphandlers

import (
	"net/http"

	"changeme/internal/config"
)

func HandleWebStatus(w http.ResponseWriter, req *http.Request) {
	host, err := config.GetHost()
	if err != nil {
		config.DisplayError(err, "")
		return
	}

	if config.MiniServer.IsRunning {
		config.SendJSON(w, host+":"+config.MiniServer.Port)
		return
	}

	config.SendJSON(w, false)
}
