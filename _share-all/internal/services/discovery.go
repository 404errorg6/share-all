package services

import (
	"changeme/internal/config"
	"changeme/internal/ftp/client"
	"context"
	"fmt"

	"github.com/betamos/zeroconf"
	"github.com/wailsapp/wails/v3/pkg/application"
)

type Discovery struct{}

func (d *Discovery) StartDiscovering(ctx context.Context) {
	app := application.Get()
	discovery, err := zeroconf.New().Browse(
		func(entry zeroconf.Event) {
			config.LogsCh <- fmt.Sprintln(entry.Op, entry.Name)

			svrInfo, err := client.ConvertEntryToServerInfo(entry)
			if err != nil {
				config.LogsCh <- err.Error()
				return
			}

			app.Event.Emit("discover-servers", svrInfo)
		},
		zeroconf.NewType(config.SERVICE),
	).Open()

	if err != nil {
		return
	}
	defer discovery.Close()

	<-ctx.Done()
}
