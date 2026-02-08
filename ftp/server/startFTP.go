package server

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/404errorg6/FTP-server/ftp/config"
	ftpserver "github.com/fclairamb/ftpserverlib"
	"github.com/grandcat/zeroconf"
)

var (
	refreshTime = 5 * time.Second
	server      *zeroconf.Server
)

func StartFTP() error {
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

/*
	func registerUntilStopped() {
		time.Sleep(10 * time.Millisecond) //Ensure config.FTP-Server.IsRunning = true in startLogsAndFTP runs first
		for {
			if !config.FTPServer.IsRunning || server == nil {
				return
			}

			err := registerFTP()
			if err != nil {
				config.LogsCh <- err.Error()
			}
			time.Sleep(refreshTime)
		}
	}
*/
func registerFTP() error {
	instance, err := os.Hostname()
	if err != nil || instance == "" {
		// TODO: add mac at the end
		instance = "FTP-Server"
	}

	portInt, err := strconv.Atoi(config.FTPServer.Port)
	if err != nil {
		return err
	}

	text := []string{
		fmt.Sprintf("AnonymousAllowed=%v", config.FTPServer.AnonymousAccessAllowed),
	}

	config.LogsCh <- fmt.Sprintf("Wifi or Mobile interfaces: \n%v", config.WifiOrDataInterface)

	server, err = zeroconf.Register(instance, config.SERVICE, config.DOMAIN, portInt, text, nil)
	if err != nil {
		return err
	}
	server.TTL(5)

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
