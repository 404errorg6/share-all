package clienthandlers

import (
	"net/http"

	"changeme/internal/config"
)

func HandleServeFile(w http.ResponseWriter, req *http.Request) {
	localPath := req.FormValue("local_path")
	fullPath := config.ResolveLocalPath(localPath)
	// Serve the file
	http.ServeFile(w, req, fullPath)
}
