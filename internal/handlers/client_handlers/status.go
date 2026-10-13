package clienthandlers

import (
	"net/http"

	"github.com/404errorg6/share-all/internal/ftp/client"
	"github.com/404errorg6/share-all/internal/config"
)

func HandleStatus(w http.ResponseWriter, req *http.Request) {
	_, err := client.GetClient()
	if err != nil {
		config.SendJSON(w, "not-connected")
		return
	}

	config.SendJSON(w, "connected")
}
