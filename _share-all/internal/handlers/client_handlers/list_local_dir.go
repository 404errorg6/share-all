package clienthandlers

import (
	"net/http"
	"os"

	"changeme/internal/config"
)

func HandleListLocalDir(w http.ResponseWriter, req *http.Request) {
	localPath := req.FormValue("local_path")
	localPath = config.ResolveLocalPath(localPath)

	fullPath := config.ResolveLocalPath(localPath)
	dir, err := os.ReadDir(fullPath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	dirObj, err := getLcoalDirObj(dir)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	config.SendJSON(w, dirObj)
}

func getLcoalDirObj(dir []os.DirEntry) ([]config.FSObject, error) {
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
