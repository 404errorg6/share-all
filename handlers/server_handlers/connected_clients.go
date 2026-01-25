package serverhandlers

import (
	"net/http"

	"github.com/404errorg6/FTP-server/ftp/config"
	"github.com/404errorg6/FTP-server/ftp/server"
)

func HandleGetConnectedClients(w http.ResponseWriter, req *http.Request) {
	//Constrained structure so unnecessary data doesn't leak out
	type constrainedConnClient struct {
		Name    string
		Host    string
		Port    string
		Network string
	}
	connectedClients := []constrainedConnClient{}

	clients := server.GetConnectedHosts() //Get full connected clients
	for _, c := range clients {
		ccc := constrainedConnClient{}
		ccc.Name = c.Name
		ccc.Host = c.Host
		ccc.Port = c.Port
		ccc.Network = c.Context.RemoteAddr().Network()
		connectedClients = append(connectedClients, ccc)
	}

	config.SendJSON(w, connectedClients)
}
