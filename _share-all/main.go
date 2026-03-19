package main

import (
	"changeme/internal/config"
	"changeme/internal/services"
	"embed"
	_ "embed"
	"fmt"
	"io/fs"
	"time"

	//	"io/fs"
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

// Register events
func init() {
	application.RegisterEvent[config.ServerDiscoveryInfo]("client:discover-servers")
	application.RegisterEvent[config.TransferInfo]("transfers:ongoing")
	application.RegisterEvent[config.TransferInfo]("transfers:completed")
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
		Title:      "Share all",
		StartState: application.WindowStateMaximised,
		Mac: application.MacWindow{
			InvisibleTitleBarHeight: 50,
			Backdrop:                application.MacBackdropTranslucent,
			TitleBar:                application.MacTitleBarHiddenInset,
		},
		BackgroundColour: application.NewRGB(27, 38, 54),
		URL:              "/",
	})

	//Logs events
	go func() {
		time.Sleep(2 * time.Second) //Wait for frontend start before sending logs
		for log := range config.LogsCh {
			log = fmt.Sprintf("[LOGS]: %v\n", log)
			fmt.Print(log)
			app.Event.Emit("Logs", log)
		}
	}()

	config.LogsCh <- "app ready to start"
	err := app.Run()

	if err != nil {
		log.Fatal(err)
	}
}
