package server

import (
	"fmt"

	ftpserver "github.com/fclairamb/ftpserverlib"
)

var (
	svr *ftpserver.FtpServer
)

func StartFTP(logsCh chan string) error {
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
	go startLogs(logsCh)
	logsCh <- "server started"
	return nil
}

func StopFTP(logsCh chan string) {
	if svr != nil {
		svr.Stop()
		svr = nil
		logsCh <- "server stopped"
		return
	}
	logsCh <- "server is already dead"
}

func startLogs(logsCh chan string) {
	fmt.Printf("server starting on: %v\n", addr)
	if err := svr.ListenAndServe(); err != nil {
		// send error to logs channel without blocking
		select {
		case logsCh <- err.Error():
		default:
			fmt.Printf("logs channel full, dropping error: %v\n", err)
		}
		fmt.Printf("ftp server error: %v\n", err)
	}
}
