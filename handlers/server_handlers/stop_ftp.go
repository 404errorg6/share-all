package serverhandlers

import (
	"net/http"

	"github.com/404errorg6/FTP-server/ftp/server"
)

func HandleStopFTP(w http.ResponseWriter, req *http.Request) {
	err := server.StopFTP()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	w.WriteHeader(http.StatusNoContent)
}
