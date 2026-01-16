package server

import (
	"fmt"
	"log/slog"
	"os"

	ftpserver "github.com/fclairamb/ftpserverlib"
)

var (
	svr *ftpserver.FtpServer
)

func StartFTP(logsCh chan string) error {
	//	path, err := os.UserHomeDir()
	//	if err != nil {
	//		return err
	//	}

	mydriver := &AndroidMainDriver{}
	svr = ftpserver.NewFtpServer(mydriver)
	svr.Logger = slog.New(slog.NewTextHandler(os.Stdout, nil))
	go startLogs(logsCh)
	fmt.Printf("server started successfully on: %v\n", addr)
	return nil
}

func StopFTP() {
}

func startLogs(logsCh chan string) {
	if err := svr.ListenAndServe(); err != nil {
		logsCh <- err.Error()
	}
}
