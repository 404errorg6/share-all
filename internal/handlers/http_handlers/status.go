package httphandlers

import (
	"net/http"

	"github.com/404errorg6/share-all/internal/config"
)

func HandleWebStatus(w http.ResponseWriter, req *http.Request) {
	if config.MiniServer.IsRunning {
		config.SendJSON(w, config.MiniServer.Conn.Addr)
		return
	}

	config.SendJSON(w, false)
}
