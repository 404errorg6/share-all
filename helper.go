package main

import (
	"changeme/internal/config"
	"fmt"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

// Register events
func StartEventSystem(app *application.App, win *application.WebviewWindow) {
	application.RegisterEvent[config.ServerDiscoveryInfo]("client:discover-servers")
	application.RegisterEvent[config.TransferInfo]("transfers:ongoing")
	application.RegisterEvent[config.TransferInfo]("transfers:completed")

	win.OnWindowEvent(events.Common.WindowFilesDropped, func(event *application.WindowEvent) {
		files := event.Context().DroppedFiles()
		app.Event.Emit("item-dropped", files)
		for _, file := range files {
			app.Event.Emit("dropped-item", files)
			fmt.Printf("Dropped: %v\n", file)
		}
	},
	)

	// Logs events
	go func() {
		time.Sleep(2 * time.Second) //Wait for frontend start before sending logs
		for log := range config.LogsCh {
			log = fmt.Sprintf("[LOGS]: %v\n", log)
			fmt.Print(log)
			app.Event.Emit("Logs", log)
		}
	}()
}
