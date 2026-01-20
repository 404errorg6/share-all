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
		sendToLogsChPtr(fmt.Sprintf("[FATAL]: %v doesn't contain \":\" ", addr))
		return
	}

	client.Name = user
	client.Host = host
	client.Port = port
	client.Msg = fmt.Sprintf("%v: %v    %v", user, addr, cc.RemoteAddr().Network())
	client.Context = cc
	connectedClients.Store(cc.ID(), client)
}

func alreadyConnected(addr string) bool {
	var matchFound bool
	host, _, found := strings.Cut(addr, ":")
	if !found {
		sendToLogsChPtr(fmt.Sprintf("[FATAL]: %v doesn't contain \":\"", addr))
		return false
	}

	connectedClients.Range(func(key, value any) bool {
		client, ok := value.(config.Client)
		if !ok {
			sendToLogsChPtr(fmt.Sprintf("[FATAL]: cannot convert to Client: %v", value))
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

func sendToLogsChPtr(s string) {
	if logsChPtr != nil {
		select {
		case *logsChPtr <- s:
		default:
			fmt.Printf("[FAILURE] Channel full. Lost log: %v\n", s)
		}
	} else {
		fmt.Printf("[FAILURE] Use of nil logsChPtr. Lost log: %v\n", s)
	}
}
