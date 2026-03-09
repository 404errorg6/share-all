package httphandlers

import (
	"embed"
	"net/http"

	"github.com/404errorg6/FTP-server/config"
	clienthandlers "github.com/404errorg6/FTP-server/handlers/client_handlers"
)

//go:embed share.*
var shareFS embed.FS

func handleLS(w http.ResponseWriter, req *http.Request) {
	path := req.URL.Query().Get("path")
	if path == "" {
		http.Error(w, "path is required", http.StatusBadRequest)
		return
	}

	err := req.ParseForm()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	req.Form.Add("local_path", path)
	clienthandlers.HandleListLocalDir(w, req)
}

func serveAssets(w http.ResponseWriter, req *http.Request) {
	config.AssetsServer.ServeHTTP(w, req)
}

func serveHTML(w http.ResponseWriter, req *http.Request) {
	if req.URL.Path == "/" {
		http.Redirect(w, req, "share.html", http.StatusPermanentRedirect)
	}

	httpServer := http.FileServer(http.FS(shareFS))
	httpServer.ServeHTTP(w, req)
}

func serveFile(w http.ResponseWriter, req *http.Request) {
	localPath := req.FormValue("path")
	if localPath == "" {
		http.Error(w, "path is required", http.StatusBadRequest)
		return
	}

	localPath = config.ResolveLocalPath(localPath)
	http.ServeFile(w, req, localPath)
}
