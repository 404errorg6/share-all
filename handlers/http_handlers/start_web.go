package httphandlers

import (
	"fmt"
	"net/http"

	"github.com/404errorg6/FTP-server/config"
)

func HandleStartWebUI(w http.ResponseWriter, req *http.Request) {
	if config.MiniServer.IsRunning {
		goto EXIT
	}

	config.LogsCh <- fmt.Sprintln("Starting unsecure sharing...")

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
