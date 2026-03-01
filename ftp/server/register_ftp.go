package server

import (
	"fmt"
	"strconv"

	"github.com/404errorg6/FTP-server/ftp/config"
	"github.com/betamos/zeroconf"
)

func registerFTP() error {
	var err error
	portInt, err := strconv.Atoi(config.FTPServer.Port)
	if err != nil {
		return err
	}

	text := []string{
		fmt.Sprintf("AnonymousAllowed=%v", config.FTPServer.AnonymousAccessAllowed),
	}

	svcType := zeroconf.NewType(config.SERVICE)

	service := zeroconf.NewService(svcType, config.FTPServer.Name, uint16(portInt))
	service.Text = text
	service.Name = config.FTPServer.Name

	config.DiscoveryClient, err = zeroconf.New().Publish(service).Open()
	if err != nil {
		return err
	}

	return nil
}
