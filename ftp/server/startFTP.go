package server

import (
	"fmt"
	"net"

	"github.com/404errorg6/FTP-server/ftp/config"
	ftpserver "github.com/fclairamb/ftpserverlib"
)

func StartFTP() error {
	if !isInitialized(config.WifiOrDataInterface) {
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
		config.LogsCh <- err.Error()
	}
}

func isInitialized(iface net.Interface) bool {
	// A valid interface will always have an Index > 0
	return iface.Index != 0
}
