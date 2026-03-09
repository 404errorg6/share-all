package httphandlers

import (
	"fmt"
	"net/http"

	"github.com/404errorg6/FTP-server/config"
)

func HandleStartWebUI(w http.ResponseWriter, req *http.Request) {
	config.LogsCh <- fmt.Sprintln("Starting unsecure sharing...")
	config.MiniServer.Handler = miniMux()

	go func() {
		err := config.MiniServer.ListenAndServe()
		if err != nil {
			config.LogsCh <- err.Error()
		}
	}()

	accessibleAddr := fmt.Sprintf("%v:%v", config.DefFTPHost, config.MiniServerPort)
	config.SendJSON(w, accessibleAddr)
}
