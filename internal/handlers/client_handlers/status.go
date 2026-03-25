package clienthandlers

import (
	"net/http"

	"changeme/internal/ftp/client"
	"changeme/internal/config"
)

func HandleStatus(w http.ResponseWriter, req *http.Request) {
	_, err := client.GetClient()
	if err != nil {
		config.SendJSON(w, "not-connected")
		return
	}

	config.SendJSON(w, "connected")
}
