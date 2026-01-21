package server

import (
	"fmt"

	"github.com/404errorg6/FTP-server/ftp/config"
)

func GetConnectedHosts() []string {
	hostsAddr := []string{}
	fmt.Printf("Connected Clients:\n")
	config.Server.ConnectedClients.Range(func(key, value any) bool {
		client, ok := value.(config.Client)
		if !ok {
			config.LogsCh <- fmt.Sprintf("Unable to convert to Client: %v", value)
			return false
		}

		fmt.Printf("	%v is connected\n", client.Msg)
		hostsAddr = append(hostsAddr, client.Context.RemoteAddr().String())
		return true
	})
	return hostsAddr
}

func alreadyConnected(addr string) bool {
	host, _, err := config.GetHostPort(addr)
	if err != nil {
		config.LogsCh <- err.Error()
		return true
	}
	var matchFound bool

	config.Server.ConnectedClients.Range(func(key, value any) bool {
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
