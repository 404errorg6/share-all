package clienthandlers

import (
	"net/http"

	"github.com/404errorg6/FTP-server/ftp/client"
	"github.com/404errorg6/FTP-server/ftp/config"
)

func GetClientConnectedStatus(w http.ResponseWriter, req *http.Request) {
	c, _ := client.GetClient()
	if c != nil {
		config.SendJSON(w, true)
	}
	config.SendJSON(w, false)
}
