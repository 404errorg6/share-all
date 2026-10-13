package serverhandlers

import (
	"net/http"

	"github.com/404errorg6/share-all/internal/config"
)

func HandleServerStatus(w http.ResponseWriter, req *http.Request) {
	if config.FTPServer.IsRunning {
		config.SendJSON(w, config.FTPServer.Conn.Addr()+":"+config.FTPServer.Port)
		return
	}
	config.SendJSON(w, false)
}
