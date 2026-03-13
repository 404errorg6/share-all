package services

import (
	"changeme/internal/config"
	"changeme/internal/ftp/client"
	"fmt"

	"github.com/betamos/zeroconf"
)

type Discovery struct{}

var (
	stopDiscover = make(chan bool, 1)
)

func (ftp *Discovery) StartDiscovering() error {
	discovery, err := zeroconf.New().Browse(
		func(entry zeroconf.Event) {
			config.LogsCh <- fmt.Sprintln(entry.Op, entry.Name)

			svrInfo, err := client.ConvertEntryToServerInfo(entry)
			if err != nil {
				config.LogsCh <- err.Error()
				return
			}

			config.App.Event.Emit("discovered-servers", svrInfo)
		},
		zeroconf.NewType(config.SERVICE),
	).Open()

	if err != nil {
		return err
	}
	defer discovery.Close()
	<-stopDiscover
	return nil
}

func (ftp Discovery) StopDiscovering() {
	stopDiscover <- true
}
