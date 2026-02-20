package server

import (
	"fmt"

	"github.com/404errorg6/FTP-server/ftp/config"
	ftpserver "github.com/fclairamb/ftpserverlib"
	"github.com/grandcat/zeroconf"
)

var (
	server *zeroconf.Server
)

func StartFTP() error {
	if config.WifiOrDataInterface == nil {
		return fmt.Errorf("Neither wifi, nor cellular is enabled")
	}

	if config.FTPServer.Conn != nil {
		err := fmt.Errorf("server already running")
		config.LogsCh <- err.Error()
		return err
	}

	mydriver := &AndroidMainDriver{}
	config.FTPServer.Conn = ftpserver.NewFtpServer(mydriver)
	go startLogsAndFTP()

	err := registerFTP()
	if err != nil {
		return err
	}

	config.LogsCh <- fmt.Sprintf("FTP server started on: %v:%v with path: %v", config.FTPServer.Host, config.FTPServer.Port, config.FTPServer.RootDir)
	return nil
}

func startLogsAndFTP() {
	config.FTPServer.IsRunning = true
	if err := config.FTPServer.Conn.ListenAndServe(); err != nil {
		// send error to logs channel without blocking
		select {
		case config.LogsCh <- err.Error():
		default:
			fmt.Printf("logs channel full, dropping: %v", err)
		}
	}
}
