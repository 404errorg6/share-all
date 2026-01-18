package server

import (
	"fmt"

	ftpserver "github.com/fclairamb/ftpserverlib"
)

func StopFTP() {
	if svr == nil {
		sendToLogsChPtr("server is already dead")
		return
	}

	if err := svr.Stop(); err != nil {
		sendToLogsChPtr(fmt.Sprintf("Error occured while stopping server: %v", err.Error()))
		return
	}
	svr = nil

	connectedClients.Range(rmClients)
	sendToLogsChPtr("server stopped")
}

func rmClients(key any, val any) bool {
	cc, ok := val.(ftpserver.ClientContext)
	if !ok {
		sendToLogsChPtr(fmt.Sprintf("Unable to type-cast(ClientContext): %v", val))
		return true
	}
	err := cc.Close()
	if err != nil {
		sendToLogsChPtr(fmt.Sprintf("Error while closing %v: %v", cc.RemoteAddr(), err))
		return true
	}

	sendToLogsChPtr(fmt.Sprintf("%v forcibly disconnected.", cc.RemoteAddr()))
	return true
}
