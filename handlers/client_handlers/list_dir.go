package clienthandlers

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/404errorg6/FTP-server/ftp/config"
)

func HandleGetLocalFolderEntries(w http.ResponseWriter, req *http.Request) {
	path := req.URL.Query().Get("path")
	//TODO: Fix bug here
	path = config.ResolveLocalPath(path)

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

	dirObj, err := getDirObj(dir)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	config.SendJSON(w, dirObj)
}

func getDirObj(dir []os.DirEntry) ([]config.FSObject, error) {
	dirObj := []config.FSObject{}
	for _, entry := range dir {
		info, err := entry.Info()
		if err != nil {
			return nil, err
		}

		e := config.FSObject{
			Name:         entry.Name(),
			IsFolder:     entry.IsDir(),
			LastModified: info.ModTime(),
			Size:         int(info.Size()),
		}
		dirObj = append(dirObj, e)
	}

	return dirObj, nil
}
