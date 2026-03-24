package webshare

import (
	"embed"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"changeme/internal/config"
	clienthandlers "changeme/internal/handlers/client_handlers"
)

//go:embed share.*
var shareFS embed.FS

func recieveFile(w http.ResponseWriter, req *http.Request) {
	localFilePath := req.FormValue("path")
	if localFilePath == "" {
		http.Error(w, "path is required", http.StatusBadRequest)
		return
	}

	remoteFile, _, err := req.FormFile("file")
	if err != nil {
		http.Error(w, "Error getting file from form: "+err.Error(), http.StatusBadRequest)
		return
	}
	defer remoteFile.Close()

	localFilePath = config.ResolveLocalPath(localFilePath)
	dirPath := filepath.Dir(localFilePath)
	fileName := filepath.Base(localFilePath)

	os.MkdirAll(dirPath, os.ModeDir)

	localFile, err := os.Create(localFilePath)
	if err != nil {
		http.Error(w, "Could not create file: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer localFile.Close()

	config.LogsCh <- fmt.Sprintf("[Web-share] \"%v\" is downloading %v to this device...", req.RemoteAddr, fileName)
	_, err = io.Copy(localFile, remoteFile)
	if err != nil {
		http.Error(w, "Failed to successfully upload file: "+err.Error(), http.StatusInternalServerError)
		return
	}
	config.LogsCh <- fmt.Sprintf("[Web-share] %v completed!", fileName)

	w.WriteHeader(http.StatusNoContent)
}

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
