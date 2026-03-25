package httphandlers

import (
	"fmt"
	"net/http"

	"changeme/internal/config"
)

func HandleStartWebUI(w http.ResponseWriter, req *http.Request) {
	var host string
	var err error

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

	host, err = config.GetHost()
	if err != nil {
		config.DisplayError(err, "")
		return
	}

EXIT:
	config.MiniServer.IsRunning = true
	accessibleAddr := fmt.Sprintf("%v:%v", host, config.MiniServer.Port)
	config.SendJSON(w, accessibleAddr)
}
