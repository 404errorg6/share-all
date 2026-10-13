package main

import (
	"embed"
	_ "embed"
	"fmt"
	"io/fs"
	"os"

	"log"
	"net/http"

	"github.com/404errorg6/share-all/internal/config"
	"github.com/404errorg6/share-all/internal/services"
	"github.com/joho/godotenv"
	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed all:.env
var envFile []byte

func init() {
	env, err := godotenv.Unmarshal(string(envFile))
	if err != nil {
		config.LogsCh <- "Error loading env file: " + err.Error()
	}

	for key, val := range env {
		os.Setenv(key, val)
	}

	dev := os.Getenv("DEV")
	if dev == "true" {
		config.Dev = true
	}

	relayID := os.Getenv("RELAY_PEER_ID")
	relayIP := os.Getenv("RELAY_IP")
	relayPort := os.Getenv("RELAY_PORT")

	config.RelayServerAddr = fmt.Sprintf("/ip4/%s/tcp/%s/p2p/%s", relayIP, relayPort, relayID)

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
			application.NewService(&services.OTITransfer{}),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	err := config.Setup()
	if err != nil {
		config.DisplayError(err, "")
	} else {
		win := app.Window.NewWithOptions(application.WebviewWindowOptions{
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

		StartEventSystem(app, win)

		config.LogsCh <- "app ready to start"
	}

	err = app.Run()
	if err != nil {
		log.Fatal(err)
	}
}
