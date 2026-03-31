package main

import (
	"changeme/internal/config"
	"changeme/internal/services"
	"embed"
	_ "embed"
	"io/fs"

	"log"
	"net/http"

	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:frontend/dist
var assets embed.FS

func init() {
	contents, err := fs.Sub(assets, "frontend/dist") //cd into frontend
	if err != nil {
		log.Fatalf("Error cding into frontend: %v", err)
	}

	config.AssetsServer = http.FileServer(http.FS(contents))
}

func main() {
	app := application.New(application.Options{
		Name:        "Share all",
		Description: "A sharing app to share anything with any device",
		Assets: application.AssetOptions{
			Handler: Mux(),
		},
		Services: []application.Service{
			application.NewService(&services.Discovery{}),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	app.Event.On("common:ApplicationStarted", func(event *application.CustomEvent) {
		err := config.Setup()
		if err != nil {
			config.DisplayError(err, "")
		} else {
			app.Window.NewWithOptions(application.WebviewWindowOptions{
				Title:      "Share all",
				StartState: application.WindowStateMaximised,

				Mac: application.MacWindow{
					InvisibleTitleBarHeight: 50,
					Backdrop:                application.MacBackdropTranslucent,
					TitleBar:                application.MacTitleBarHiddenInset,
				},
				BackgroundColour: application.NewRGB(27, 38, 54),
				URL:              "/",
				EnableFileDrop:   true,
			})
			StartEventSystem(app.Window.Current())

			config.LogsCh <- "app ready to start"
		}
	})

	err := app.Run()
	if err != nil {
		log.Fatal(err)
	}
}
