package serverhandlers

import (
	"net/http"

	"changeme/internal/ftp/server"
)

func HandleStopFTP(w http.ResponseWriter, req *http.Request) {
	err := server.StopFTP()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
