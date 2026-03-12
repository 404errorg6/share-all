package server

import (
	"fmt"

	"changeme/internal/config"
	ftpserver "github.com/fclairamb/ftpserverlib"
)

func GetConnectedHosts() []config.Client {
	connectedClients := []config.Client{}
	fmt.Printf("Connected Clients:\n")
	config.FTPServer.ConnectedClients.Range(func(key, value any) bool {
		client, ok := value.(config.Client)
		if !ok {
			config.LogsCh <- fmt.Sprintf("Unable to convert to Client: %v", value)
			return false
		}

		fmt.Printf("	%v is connected\n", client.Msg)
		connectedClients = append(connectedClients, client)
		return true
	})
	return connectedClients
}

func alreadyConnected(addr string) bool {
	var matchFound bool
	host, _, err := config.GetHostPort(addr)
	if err != nil {
		config.LogsCh <- fmt.Sprintf("Function error in alreadyConnected while parsing addr: %v", err.Error())
	}

	config.FTPServer.ConnectedClients.Range(func(key, value any) bool {
		client, ok := value.(config.Client)
		if !ok {
			config.LogsCh <- fmt.Sprintf("[FATAL]: cannot convert to Client: %v", value)
			return false
		}

		if client.Host == host {
			matchFound = true
			return false
		}
		return true
	})

	if matchFound {
		return true
	}
	return false
}

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
	config.FTPServer.ConnectedClients.Store(cc.ID(), client)
}

func rmFromConnectedClients(cc ftpserver.ClientContext) {
	config.FTPServer.ConnectedClients.Delete(cc.ID())
}
