package clienthandlers

import (
	"net/http"
	"path/filepath"

	"github.com/404errorg6/FTP-server/ftp/config"
)

func HandleServeFile(w http.ResponseWriter, req *http.Request) {
	path := req.URL.Query().Get("path")
	fullPath := config.ResolveLocalPath(path)

	// Additional check to ensure path exists and is a file
	absPath, err := filepath.Abs(fullPath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	absPath = filepath.Clean(absPath)

	// Serve the file
	http.ServeFile(w, req, absPath)
}
