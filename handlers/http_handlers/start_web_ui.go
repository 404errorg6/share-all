package httphandlers

import (
	"embed"
	"fmt"
	"net/http"

	"github.com/404errorg6/FTP-server/config"
	clienthandlers "github.com/404errorg6/FTP-server/handlers/client_handlers"
)

//go:embed share.*
var shareFS embed.FS

func HandleStartWebUI(w http.ResponseWriter, req *http.Request) {
	server := &http.Server{
		Addr:    "0.0.0.0:8080",
		Handler: miniMux(),
	}

	config.LogsCh <- fmt.Sprintln("Starting unsecure sharing...")

	go func() {
		err := server.ListenAndServe()
		if err != nil {
			config.LogsCh <- err.Error()
		}
	}()
}

func miniMux() *http.ServeMux {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /", serveHTML)
	mux.HandleFunc("GET /assets/", serveAssets)

	mux.HandleFunc("GET /api/ls", handleLS)
	mux.HandleFunc("GET /file", serveFile)

	return mux
}

func handleLS(w http.ResponseWriter, req *http.Request) {
	path := req.URL.Query().Get("path")
	if path == "" {
		http.Error(w, "path is required", http.StatusBadRequest)
		return
	}

	err := req.ParseForm()
	if err != nil {
		config.LogsCh <- err.Error()
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
