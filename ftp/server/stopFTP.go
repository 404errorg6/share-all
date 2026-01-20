package server

import (
	"fmt"

	"github.com/404errorg6/FTP-server/ftp/config"
)

func StopFTP() {
	if svr == nil {
		sendToLogsChPtr("server is already dead")
		return
	}

	connectedClients.Range(rmClients)
	if err := svr.Stop(); err != nil {
		sendToLogsChPtr(fmt.Sprintf("Error occured while stopping server: %v", err.Error()))
		return
	}
	svr = nil

	sendToLogsChPtr("server stopped")
}

func rmClients(key any, val any) bool {
	client, ok := val.(config.Client)
	if !ok {
		sendToLogsChPtr(fmt.Sprintf("Unable to type-cast(Client): %v", val))
		return false
	}

	err := client.Context.Close()
	if err != nil {
		sendToLogsChPtr(fmt.Sprintf("Error while closing %v: %v", client.Msg, err))
		return true
	}

	sendToLogsChPtr(fmt.Sprintf("%v forcibly disconnected.", client.Msg))
	return true
}
