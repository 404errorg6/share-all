package server

import (
	"fmt"
	"strconv"

	"github.com/404errorg6/FTP-server/ftp/config"
	"github.com/grandcat/zeroconf"
)

func registerFTP() error {
	instance := config.FTPServer.Name

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
