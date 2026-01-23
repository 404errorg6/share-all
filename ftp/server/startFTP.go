package server

import (
	"fmt"

	"github.com/404errorg6/FTP-server/ftp/config"
	ftpserver "github.com/fclairamb/ftpserverlib"
)

// TODO: Restrict api so attacker on same network can't start this server on personal dir

func StartFTP() error {
	if config.Server.Conn != nil {
		err := fmt.Errorf("server already running")
		config.LogsCh <- err.Error()
		return err
	}

	mydriver := &AndroidMainDriver{}
	config.Server.Conn = ftpserver.NewFtpServer(mydriver)
	go startLogsAndFTP()
	config.LogsCh <- fmt.Sprintf("FTP server started on: %v:%v with path: %v", config.Server.FTPHost, config.Server.FTPPort, config.Server.RootDir)
	return nil
}

func startLogsAndFTP() {
	config.Server.IsRunning = true
	if err := config.Server.Conn.ListenAndServe(); err != nil {
		// send error to logs channel without blocking
		select {
		case config.LogsCh <- err.Error():
		default:
			fmt.Printf("logs channel full, dropping: %v", err)
		}
	}
}
