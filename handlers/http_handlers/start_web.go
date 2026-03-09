package httphandlers

import (
	"fmt"
	"net/http"

	"github.com/404errorg6/FTP-server/config"
)

func HandleStartWebUI(w http.ResponseWriter, req *http.Request) {
	config.LogsCh <- fmt.Sprintln("Starting unsecure sharing...")
	config.MiniServer.Conn.Handler = miniMux()

	go func() {
		err := config.MiniServer.Conn.ListenAndServe()
		if err != nil {
			config.LogsCh <- err.Error()
		}
	}()

	config.MiniServer.IsRunning = true
	accessibleAddr := fmt.Sprintf("%v:%v", config.DefFTPHost, config.MiniServer.Port)
	config.SendJSON(w, accessibleAddr)
}
