package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"

	"github.com/404errorg6/FTP-server/config"
)

//go:embed  frontend/*
var frontend embed.FS

func init() {
	contents, err := fs.Sub(frontend, "frontend") //cd into frontend
	if err != nil {
		log.Fatalf("Error cding into frontend: %v", err)
	}

	config.AssetsServer = http.FileServer(http.FS(contents))
}
