package server

import (
	"fmt"

	"github.com/404errorg6/FTP-server/ftp/config"
	ftpserver "github.com/fclairamb/ftpserverlib"
)

func addToConnectedClient(user string, cc ftpserver.ClientContext) {
	client := config.Client{}
	addr := cc.RemoteAddr().String()
	host, _, err := config.GetHostPort(addr)
	if err != nil {
		config.LogsCh <- err.Error()
		host = addr
	}

	client.Name = user
	client.Host = host
	client.Msg = fmt.Sprintf("%v: %v    %v", user, addr, cc.RemoteAddr().Network())
	client.Context = cc
	config.Server.ConnectedClients.Store(cc.ID(), client)
}

func rmFromConnectedClients(cc ftpserver.ClientContext) {
	config.Server.ConnectedClients.Delete(cc.ID())
}
