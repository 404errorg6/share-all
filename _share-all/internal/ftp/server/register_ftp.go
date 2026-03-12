package server

import (
	"fmt"
	"strconv"

	"changeme/internal/config"
	"github.com/betamos/zeroconf"
)

func registerFTP() error {
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

	_, err = config.DiscoveryClient.Publish(service).Open()
	if err != nil {
		return err
	}

	return nil
}
