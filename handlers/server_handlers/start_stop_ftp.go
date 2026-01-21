package serverhandlers

import (
	"fmt"
	"net/http"
	"path/filepath"

	"github.com/404errorg6/FTP-server/ftp/config"
	"github.com/404errorg6/FTP-server/ftp/server"
)

func HandleStartFTP(w http.ResponseWriter, req *http.Request) {
	port := req.FormValue("port")
	newRoot := req.FormValue("root")
	if port != "" {
		config.Server.FTPPort = port
	} else {
		config.Server.FTPPort = config.DefFTPPort
	}

	if newRoot != "" {
		if !config.FolderExists(newRoot) {
			http.Error(w, fmt.Sprintf("\"%v\" folder does not exist", newRoot), http.StatusBadRequest)
			return
		}

		config.Server.Root = filepath.Join(config.HomeDir, newRoot)
	}

	err := server.StartFTP()
	if err != nil {
		config.LogsCh <- err.Error()
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	w.WriteHeader(http.StatusNoContent)
}

func HandleStopFTP(w http.ResponseWriter, req *http.Request) {
	err := server.StopFTP()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	w.WriteHeader(http.StatusNoContent)
}
