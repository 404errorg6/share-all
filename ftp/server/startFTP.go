package server

import (
	"fmt"

	ftpserver "github.com/fclairamb/ftpserverlib"
)

var (
	svr *ftpserver.FtpServer
)

func StartFTP(logsCh chan string) error {
	if logsChPtr == nil {
		logsChPtr = &logsCh
	}
	if svr != nil {
		logsCh <- "server already running"
		return nil
	}
	//	path, err := os.UserHomeDir()
	//	if err != nil {
	//		return err
	//	}

	mydriver := &AndroidMainDriver{}
	svr = ftpserver.NewFtpServer(mydriver)
	go startLogsAndFTP(logsCh)
	logsCh <- fmt.Sprintf("FTP server started on: %v", addr)
	return nil
}

func StopFTP(logsCh chan string) {
	if svr == nil {
		logsCh <- "server is already dead"
		return
	}

	if err := svr.Stop(); err != nil {
		logsCh <- fmt.Sprintf("Error occured while stopping server: %v", err.Error())
		return
	}
	svr = nil

	connectedClient.Range(rmClients(logsCh))
	logsCh <- "server stopped"
}

func rmClients(logsCh chan string) func(key any, val any) bool {
	return func(key, val any) bool {
		cc, ok := val.(ftpserver.ClientContext)
		if !ok {
			logsCh <- fmt.Sprintf("Unable to type-cast(ClientContext): %v", val)
			return true
		}
		err := cc.Close()
		if err != nil {
			logsCh <- fmt.Sprintf("Error while closing %v: %v", cc.RemoteAddr(), err)
			return true
		}

		logsCh <- fmt.Sprintf("%v forcibly disconnected.", cc.RemoteAddr())
		return true
	}
}

func startLogsAndFTP(logsCh chan string) {
	if err := svr.ListenAndServe(); err != nil {
		// send error to logs channel without blocking
		select {
		case logsCh <- err.Error():
		default:
			fmt.Printf("logs channel full, dropping error: %v", err)
		}
		fmt.Printf("ftp server error: %v\n", err)
	}
}

func sendToLogsChPtr(s string) {
	if logsChPtr != nil {
		*logsChPtr <- s
	} else {
		fmt.Printf("[FAIL] Failed to send log: %v\n", s)
	}
}
