package httphandlers

import (
	"fmt"
	"net/http"

	"changeme/internal/config"
	webshare "changeme/internal/web_share"
)

func init() {
	config.MiniServer.Conn.Handler = webshare.MiniMux()
}

func HandleStartWebUI(w http.ResponseWriter, req *http.Request) {

	if config.MiniServer.IsRunning {
		goto EXIT
	}

	config.LogsCh <- fmt.Sprintln("Starting web-share...")

	go func() {
		err := config.MiniServer.Conn.ListenAndServe()
		if err != nil {
			config.LogsCh <- err.Error()
		}
	}()

EXIT:
	config.MiniServer.IsRunning = true
	accessibleAddr := fmt.Sprintf("%v:%v", config.MiniServer.Host, config.MiniServer.Port)
	config.SendJSON(w, accessibleAddr)
}
