package server

import (
	"fmt"
	"net"
	"os"
	"strconv"
	"strings"

	"github.com/404errorg6/FTP-server/ftp/config"
	ftpserver "github.com/fclairamb/ftpserverlib"
	"github.com/grandcat/zeroconf"
)

// TODO: Restrict api so attacker on same network can't start this server on personal dir

var server *zeroconf.Server

func StartFTP() error {
	if config.FTPServer.Conn != nil {
		err := fmt.Errorf("server already running")
		config.LogsCh <- err.Error()
		return err
	}

	mydriver := &AndroidMainDriver{}
	config.FTPServer.Conn = ftpserver.NewFtpServer(mydriver)
	go startLogsAndFTP()

	err := registerFTP() //Let clients discover this server
	if err != nil {
		config.LogsCh <- err.Error()
		return err
	}

	config.LogsCh <- fmt.Sprintf("FTP server started on: %v:%v with path: %v", config.FTPServer.Host, config.FTPServer.Port, config.FTPServer.RootDir)
	return nil
}

func registerFTP() error {
	instance, err := os.Hostname()
	if err != nil || instance == "" {
		instance = "FTP-Server"
	}

	portInt, err := strconv.Atoi(config.FTPServer.Port)
	if err != nil {
		return err
	}

	text := []string{
		fmt.Sprintf("AnonymousAllowed=%v", config.FTPServer.AnonymousAccessAllowed),
	}

	ifaces, err := getWifiOrMobileInterface()
	if err != nil {
		return err
	}

	config.LogsCh <- fmt.Sprintf("Wifi or Mobile interfaces: \n%v", ifaces)

	server, err = zeroconf.Register(instance, config.SERVICE, config.DOMAIN, portInt, text, ifaces)
	if err != nil {
		return err
	}

	return nil
}

func getWifiOrMobileInterface() ([]net.Interface, error) {
	var WifiOrMobileInterfaces []net.Interface
	ifs, err := net.Interfaces()
	if err != nil {
		return nil, err
	}

	for _, iface := range ifs {
		name := strings.ToLower(iface.Name)
		if strings.Contains(name, "cellular") || strings.Contains(name, "wi-fi") || strings.Contains(name, "wifi") || strings.HasPrefix(name, "wlan") || strings.HasPrefix(name, "ccmni") || strings.HasPrefix(iface.Name, "rmnet") {
			if iface.Flags%net.FlagUp != 0 && iface.Flags&net.FlagBroadcast != 0 {
				WifiOrMobileInterfaces = append(WifiOrMobileInterfaces, iface)
				fmt.Printf("Ready for register: %v\n", iface)
			}
		}
	}

	if len(WifiOrMobileInterfaces) == 0 {
		return nil, fmt.Errorf("Neither wifi nor mobile data enabled")
	}

	return WifiOrMobileInterfaces, nil
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
