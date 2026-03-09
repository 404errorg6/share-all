package serverhandlers

import (
	"net/http"

	"github.com/404errorg6/FTP-server/config"
)

func HandleServerStatus(w http.ResponseWriter, req *http.Request) {
	if config.FTPServer.IsRunning {
		config.SendJSON(w, config.FTPServer.Host+":"+config.FTPServer.Port)
		return
	}
	config.SendJSON(w, false)
}
