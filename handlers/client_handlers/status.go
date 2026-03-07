package clienthandlers

import (
	"net/http"

	"github.com/404errorg6/FTP-server/ftp/client"
	"github.com/404errorg6/FTP-server/ftp/config"
)

func HandleStatus(w http.ResponseWriter, req *http.Request) {
	_, err := client.GetClient()
	if err != nil {
		config.SendJSON(w, "not-connected")
		return
	}

	config.SendJSON(w, "connected")
}
