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
	constrainedConClients := []constrainedConnClient{}

	clients := server.GetConnectedHosts() //Get full connected clients
	for _, c := range clients {
		constrainedConClient := constrainedConnClient{}
		constrainedConClient.Name = c.Name
		constrainedConClient.Host = c.Host
		constrainedConClient.Port = c.Port
		constrainedConClient.Network = c.Context.RemoteAddr().Network()
		constrainedConClients = append(constrainedConClients, constrainedConClient)
	}

	config.SendJSON(w, constrainedConClients)
}
