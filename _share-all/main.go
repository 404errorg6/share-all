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

//go:embed  frontend
var frontend embed.FS

func init() {
	contents, err := fs.Sub(frontend, "frontend") //cd into frontend
	if err != nil {
		log.Fatalf("Error cding into frontend: %v", err)
	}

	config.AssetsServer = http.FileServer(http.FS(contents))
}

// Register events
func init() {
	application.RegisterEvent[config.ServerDiscoveryInfo]("client:discover-servers")
}

func main() {

	app := application.New(application.Options{
		Name:        "_share-all",
		Description: "A sharing app to share anything with any device",
		Assets: application.AssetOptions{
			//			Handler: application.AssetFileServerFS(assets),
			Handler: Mux(),
		},
		Services: []application.Service{
			application.NewService(&services.Discovery{}),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	app.Window.NewWithOptions(application.WebviewWindowOptions{
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

	err := app.Run()

	if err != nil {
		log.Fatal(err)
	}
}
