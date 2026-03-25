package httphandlers

import (
	"fmt"
	"net/http"

	"changeme/internal/config"
	webshare "changeme/internal/web_share"
)

func HandleStartWebUI(w http.ResponseWriter, req *http.Request) {
	var host string
	var err error

	if config.MiniServer.IsRunning {
		goto EXIT
	}

	host, err = config.GetHost()
	if err != nil {
		config.DisplayError(err, "")
		return
	}

	//Initialize miniserver
	config.MiniServer.Conn = &http.Server{
		Addr:    host + ":" + "8080",
		Handler: webshare.MiniMux(),
	}

	config.LogsCh <- fmt.Sprintf("Starting web-share on %v...", config.MiniServer.Conn.Addr)

	go func() {
		err := config.MiniServer.Conn.ListenAndServe()
		if err != nil {
			config.LogsCh <- err.Error()
		}
	}()

EXIT:
	config.MiniServer.IsRunning = true
	config.SendJSON(w, config.MiniServer.Conn.Addr)
}
