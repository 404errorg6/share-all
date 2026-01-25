package clienthandlers

import (
	"fmt"
	"net/http"
	"os"

	"github.com/404errorg6/FTP-server/ftp/client"
	"github.com/404errorg6/FTP-server/ftp/config"
)

func HandleUploadFile(w http.ResponseWriter, req *http.Request) {
	localPath := req.FormValue("local_path")
	remotePath := req.FormValue("remote_path")

	c, err := client.GetClient()
	if err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	if localPath == "" || remotePath == "" {
		http.Error(w, "local_path/remote_path are required", http.StatusBadRequest)
		return
	}

	localPath = config.ResolveLocalPath(localPath)
	localFile, err := os.Open(localPath)
	if err != nil {
		config.LogsCh <- err.Error()
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	info, err := localFile.Stat()
	if err != nil {
		config.LogsCh <- err.Error()
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if info.IsDir() {
		err := fmt.Errorf("\"%v\" is not a file", localPath)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err = c.Stor(remotePath, localFile)
	if err != nil {
		config.LogsCh <- err.Error()
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
