package services

import (
	"github.com/404errorg6/share-all/internal/config"
	"github.com/404errorg6/share-all/internal/ftp/client"
	"context"
	"fmt"

	"github.com/betamos/zeroconf"
	"github.com/wailsapp/wails/v3/pkg/application"
)

var (
	stopDiscovery = make(chan bool, 1)
)

type Discovery struct{}

func (d *Discovery) StartDiscovering(ctx context.Context) {
	// Drain any pending stop signals to start fresh
	select {
	case <-stopDiscovery:
	default:
	}

	app := application.Get()
	discovery, err := zeroconf.New().Browse(
		func(entry zeroconf.Event) {
			config.LogsCh <- fmt.Sprintln(entry.Op, entry.Name)

			svrInfo, err := client.ConvertEntryToServerInfo(entry)
			if err != nil {
				config.LogsCh <- err.Error()
				return
			}

			app.Event.Emit("client:discover-servers", svrInfo)
		},
		zeroconf.NewType(config.SERVICE),
	).Open()

	if err != nil {
		return
	}
	defer discovery.Close()

	// Wait for manual stop signal OR Wails context cancellation
	select {
	case <-stopDiscovery:
	case <-ctx.Done():
	}
	config.LogsCh <- "Exited discovery"
}

func (d *Discovery) StopDiscovery() {
	select {
	case stopDiscovery <- true:
	default:
		// Channel already has a stop signal or nobody is listening
	}
}
