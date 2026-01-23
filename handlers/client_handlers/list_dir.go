package clienthandlers

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/404errorg6/FTP-server/ftp/config"
)

func HandleGetLocalFolderEntries(w http.ResponseWriter, req *http.Request) {
	path := req.URL.Query().Get("path")
	if path == "" {
		path = config.HomeDir
	}

	fullPath, err := filepath.Abs(path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	dir, err := os.ReadDir(fullPath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	dirObj := []config.FSObject{}
	for _, entry := range dir {
		e := config.FSObject{
			Name:     entry.Name(),
			IsFolder: entry.IsDir(),
		}
		dirObj = append(dirObj, e)
	}

	config.SendJSON(w, dirObj)
}
