package server

import (
	"fmt"

	"github.com/404errorg6/FTP-server/ftp/config"
)

func GetConnectedHosts() []string {
	hostsAddr := []string{}
	fmt.Printf("Connected Clients:\n")
	connectedClients.Range(func(key, value any) bool {
		client, ok := value.(config.Client)
		if !ok {
			sendToLogsChPtr(fmt.Sprintf("Unable to convert to Client: %v", value))
			return false
		}

		fmt.Printf("	%v is connected\n", client.Msg)
		hostsAddr = append(hostsAddr, client.Context.RemoteAddr().String())
		return true
	})
	return hostsAddr
}
