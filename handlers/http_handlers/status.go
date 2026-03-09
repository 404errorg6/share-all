package httphandlers

import (
	"net/http"

	"github.com/404errorg6/FTP-server/config"
)

func HandleWebStatus(w http.ResponseWriter, req *http.Request) {
	if config.MiniServer.IsRunning {
		config.SendJSON(w, true)
		return
	}

	config.SendJSON(w, false)
}
