package serverhandlers

import (
	"net/http"

	"github.com/404errorg6/share-all/internal/config"
	"github.com/404errorg6/share-all/internal/ftp/server"
)

func HandleGetConnectedClients(w http.ResponseWriter, req *http.Request) {
	//Constrained structure so unnecessary data doesn't leak out
	type constrainedClient struct {
		Name    string
		Host    string
		Port    string
		Network string
	}
	constrainedConnClients := []constrainedClient{}

	clients := server.GetConnectedHosts() //Get full connected clients
	for _, c := range clients {
		constrainedConClient := constrainedClient{}
		constrainedConClient.Name = c.Name
		constrainedConClient.Host = c.Host
		constrainedConClient.Port = c.Port
		constrainedConClient.Network = c.Context.RemoteAddr().Network()
		constrainedConnClients = append(constrainedConnClients, constrainedConClient)
	}

	config.SendJSON(w, constrainedConnClients)
}
