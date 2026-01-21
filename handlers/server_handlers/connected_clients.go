package serverhandlers

import (
	"net/http"

	"github.com/404errorg6/FTP-server/ftp/config"
	"github.com/404errorg6/FTP-server/ftp/server"
)

func HandleGetConnectedClients(w http.ResponseWriter, req *http.Request) {
	connClients := server.GetConnectedHosts()
	config.SendJSON(w, connClients)
}
