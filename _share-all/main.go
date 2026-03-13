package main

import (
	"changeme/internal/config"
	services "changeme/internal/sevices"
	"embed"
	_ "embed"
	"io/fs"
	"log"
	"net/http"

	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed  frontend
var frontend embed.FS

func init() { //Initialize assets
	contents, err := fs.Sub(frontend, "frontend") //cd into frontend
	if err != nil {
		log.Fatalf("Error cding into frontend: %v", err)
	}

	config.AssetsServer = http.FileServer(http.FS(contents))
}

// Send logs
func startLogs() {
	go func() {
		for log := range config.LogsCh {
			config.App.Event.Emit("logs", log)
		}
	}()
}

func main() {

	config.App = application.New(application.Options{
		Name:        "share-all",
		Description: "A sharing app to share anything with any device",
		Assets: application.AssetOptions{
			//			Handler: application.AssetFileServerFS(assets),
			Handler: Mux(),
		},

		Services: []application.Service{application.NewService(
			&services.Discovery{},
		)},

		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	startLogs()

	config.App.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:      "Window 1",
		StartState: application.WindowStateFullscreen,
		Mac: application.MacWindow{
			InvisibleTitleBarHeight: 50,
			Backdrop:                application.MacBackdropTranslucent,
			TitleBar:                application.MacTitleBarHiddenInset,
		},
		BackgroundColour: application.NewRGB(27, 38, 54),
		URL:              "/",
	})

	err := config.App.Run()

	if err != nil {
		log.Fatal(err)
	}
}
