package serverhandlers

import (
	"net/http"

	"github.com/404errorg6/FTP-server/ftp/config"
)

func HandleServerStatus(w http.ResponseWriter, req *http.Request) {
	if config.Server.IsRunning {
		config.SendJSON(w, "running")
		return
	}
	config.SendJSON(w, "not running")
}
