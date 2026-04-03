package server

import (
	"fmt"
	"strconv"

	"github.com/404errorg6/share-all/internal/config"
	"github.com/betamos/zeroconf"
)

func registerFTP() error {
	discoveryClient = zeroconf.New()
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

	_, err = discoveryClient.Publish(service).Open()
	if err != nil {
		return err
	}

	return nil
}
