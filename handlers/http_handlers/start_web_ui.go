package httphandlers

import (
	"embed"
	"fmt"
	"net/http"

	"github.com/404errorg6/FTP-server/ftp/config"
	clienthandlers "github.com/404errorg6/FTP-server/handlers/client_handlers"
)

//go:embed share.*
var assets embed.FS

func HandleStartWebUI(w http.ResponseWriter, req *http.Request) {
	server := &http.Server{
		Addr:    "0.0.0.0:8080",
		Handler: miniMux(),
	}

	config.LogsCh <- fmt.Sprintln("Starting unsecure sharing...")

	err := server.ListenAndServe()
	if err != nil {
		config.LogsCh <- err.Error()
	}
}

func miniMux() *http.ServeMux {
	mux := &http.ServeMux{}

	mux.HandleFunc("GET /", serveHTML)

	mux.HandleFunc("GET /api/ls", clienthandlers.HandleListLocalDir)
	mux.HandleFunc("GET /file", serveFile)

	return mux
}

func serveHTML(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path == "/" {
		http.Redirect(w, r, "share.html", http.StatusPermanentRedirect)
	}
	httpServer := http.FileServer(http.FS(assets))
	httpServer.ServeHTTP(w, r)
}

func serveFile(w http.ResponseWriter, r *http.Request) {
	localPath := r.FormValue("local_path")
	if localPath == "" {
		http.Error(w, "local_path is required", http.StatusBadRequest)
		return
	}

	localPath = config.ResolveLocalPath(localPath)
	http.ServeFile(w, r, localPath)
}
