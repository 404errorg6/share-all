package server

import (
	"fmt"
	"strings"

	"github.com/404errorg6/FTP-server/ftp/config"
	ftpserver "github.com/fclairamb/ftpserverlib"
)

func storeInfo(user string, cc ftpserver.ClientContext) {
	client := config.Client{}
	addr := cc.RemoteAddr().String()
	host, port, found := strings.Cut(addr, ":")
	if !found {
		config.LogsCh <- fmt.Sprintf("[FATAL]: %v doesn't contain \":\" ", addr)
		return
	}

	client.Name = user
	client.Host = host
	client.Port = port
	client.Msg = fmt.Sprintf("%v: %v    %v", user, addr, cc.RemoteAddr().Network())
	client.Context = cc
	config.Server.ConnectedClients.Store(cc.ID(), client)
}
