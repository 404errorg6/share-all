package server

import (
	"fmt"
	"sync"

	ftpserver "github.com/fclairamb/ftpserverlib"
)

var (
	svr              *ftpserver.FtpServer
	logsChPtr        *chan string
	host             string
	port             string
	connectedClients sync.Map
	baseRoot         string
)

func Init(ftpHost, ftpPort string, logsCh chan string, root string) {
	host = ftpHost
	port = ftpPort
	logsChPtr = &logsCh
	baseRoot = root
}

func StartFTP(port, rootP string) error {
	if svr != nil {
		sendToLogsChPtr("server already running")
		return nil
	}

	mydriver := &AndroidMainDriver{}
	svr = ftpserver.NewFtpServer(mydriver)
	go startLogsAndFTP()
	sendToLogsChPtr(fmt.Sprintf("FTP server started on: %v:%v with path: %v", host, port, baseRoot))
	return nil
}

func startLogsAndFTP() {
	if err := svr.ListenAndServe(); err != nil {
		// send error to logs channel without blocking
		select {
		case *logsChPtr <- err.Error():
		default:
			fmt.Printf("logs channel full, dropping: %v", err)
		}
	}
}
