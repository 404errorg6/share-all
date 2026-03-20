package main

import (
	"changeme/internal/config"
	"fmt"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
)

// Register events
func StartEventSystem() {
	application.RegisterEvent[config.ServerDiscoveryInfo]("client:discover-servers")
	application.RegisterEvent[config.TransferInfo]("transfers:ongoing")
	application.RegisterEvent[config.TransferInfo]("transfers:completed")

	// Logs events
	go func() {
		app := application.Get()
		time.Sleep(2 * time.Second) //Wait for frontend start before sending logs
		for log := range config.LogsCh {
			log = fmt.Sprintf("[LOGS]: %v\n", log)
			fmt.Print(log)
			app.Event.Emit("Logs", log)
		}
	}()
}
